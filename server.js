const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const db = require("./db");

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript"
};

function hashPassword(password){
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored){
    const [salt, hash] = stored.split(":");
    const check = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(check));
}

// ---------------- Helpers ----------------
function readBody(req){
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try{ resolve(body ? JSON.parse(body) : {}); }
            catch(e){ reject(e); }
        });
        req.on("error", reject);
    });
}

function sendJson(res, status, data){
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}

function sendText(res, status, text){
    res.writeHead(status, { "Content-Type": "text/plain" });
    res.end(text);
}

function serveStatic(req, res){
    let filePath = req.url === "/" ? "/index.html" : req.url;
    filePath = path.join(PUBLIC_DIR, filePath.split("?")[0]);

    // stay inside the public directory
    if(!filePath.startsWith(PUBLIC_DIR)){
        sendText(res, 403, "Forbidden");
        return true;
    }

    const ext = path.extname(filePath);
    if(!MIME[ext]) return false;

    fs.readFile(filePath, (err, data) => {
        if(err){ sendText(res, 404, "Not found"); return; }
        res.writeHead(200, { "Content-Type": MIME[ext] });
        res.end(data);
    });
    return true;
}

// ---------------- Server ----------------
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    try{

        // ---- static files ----
        if(req.method === "GET" && serveStatic(req, res)) return;

        // ---- register ----
        if(req.method === "POST" && url.pathname === "/register"){
            const { username, password } = await readBody(req);
            if(!username || !password) return sendText(res, 400, "Username and password required");

            db.query("SELECT id FROM users WHERE username=?", [username], (err, rows) => {
                if(err) return sendText(res, 500, "Server error");
                if(rows.length) return sendText(res, 409, "Username already taken");

                db.query(
                    "INSERT INTO users(username, password) VALUES(?,?)",
                    [username, hashPassword(password)],
                    (err) => {
                        if(err) return sendText(res, 500, "Server error");
                        sendText(res, 201, "Registered");
                    }
                );
            });
            return;
        }

        // ---- login ----
        if(req.method === "POST" && url.pathname === "/login"){
            const { username, password } = await readBody(req);
            if(!username || !password) return sendText(res, 400, "Username and password required");

            db.query("SELECT password FROM users WHERE username=?", [username], (err, rows) => {
                if(err) return sendText(res, 500, "Server error");
                if(!rows.length) return sendText(res, 401, "User not found");
                if(!verifyPassword(password, rows[0].password)) return sendText(res, 401, "Wrong password");
                sendText(res, 200, "OK");
            });
            return;
        }

        // ---- get expenses (optionally filtered by period) ----
        if(req.method === "GET" && url.pathname === "/expenses"){
            const user = url.searchParams.get("user");
            const period = url.searchParams.get("period") || "all";
            if(!user) return sendText(res, 400, "user is required");

            let sql = "SELECT id, amount, category, created_at FROM expenses WHERE username=?";
            if(period === "month") sql += " AND MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE())";
            if(period === "year") sql += " AND YEAR(created_at)=YEAR(CURDATE())";
            sql += " ORDER BY created_at DESC";

            db.query(sql, [user], (err, rows) => {
                if(err) return sendText(res, 500, "Server error");
                sendJson(res, 200, rows);
            });
            return;
        }

        // ---- add expense ----
        if(req.method === "POST" && url.pathname === "/expenses"){
            const { username, amount, category } = await readBody(req);
            if(!username || !amount || !category) return sendText(res, 400, "username, amount and category required");
            if(Number(amount) <= 0) return sendText(res, 400, "amount must be positive");

            db.query(
                "INSERT INTO expenses(username, amount, category) VALUES(?,?,?)",
                [username, amount, category],
                (err) => {
                    if(err) return sendText(res, 500, "Server error");
                    sendText(res, 201, "Added");
                }
            );
            return;
        }

        // ---- update expense ----
        const updateMatch = url.pathname.match(/^\/expenses\/(\d+)$/);
        if(req.method === "PUT" && updateMatch){
            const id = updateMatch[1];
            const { amount, category } = await readBody(req);
            if(!amount || !category) return sendText(res, 400, "amount and category required");

            db.query(
                "UPDATE expenses SET amount=?, category=? WHERE id=?",
                [amount, category, id],
                (err) => {
                    if(err) return sendText(res, 500, "Server error");
                    sendText(res, 200, "Updated");
                }
            );
            return;
        }

        // ---- delete expense ----
        if(req.method === "DELETE" && updateMatch){
            const id = updateMatch[1];
            db.query("DELETE FROM expenses WHERE id=?", [id], (err) => {
                if(err) return sendText(res, 500, "Server error");
                sendText(res, 200, "Deleted");
            });
            return;
        }

        sendText(res, 404, "Not found");

    }catch(err){
        sendText(res, 400, "Bad request");
    }
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
