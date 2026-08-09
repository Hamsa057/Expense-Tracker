// ============================================================
// Shared client script. Safe to include on every page: the
// dashboard logic only runs when the dashboard's elements exist.
// ============================================================

const currentUser = localStorage.getItem("currentUser");

function logout(){
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

// ---------------- Dashboard (home.html) ----------------
if(document.getElementById("table")){

  if(!currentUser){
    window.location.assign("index.html");
  } else {
    document.getElementById("whoami").textContent = "Hi, " + currentUser;
  }

  let period = "all";     // all | month | year
  let editId = null;      // id currently being edited
  let chart = null;

  setPeriodUI();
  loadExpenses();

  async function loadExpenses(){
    const res = await fetch(`/expenses?user=${encodeURIComponent(currentUser)}&period=${period}`);
    const data = await res.json();
    renderTotalAndChart(data);
    renderTable(data);
  }

  function renderTotalAndChart(data){
    const total = data.reduce((sum, e) => sum + Number(e.amount), 0);
    document.getElementById("total").textContent = total.toFixed(2);

    const byCategory = {};
    data.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
    });

    if(chart) chart.destroy();
    chart = new Chart(document.getElementById("chart"), {
      type: "bar",
      data: {
        labels: Object.keys(byCategory),
        datasets: [{
          label: "Spend by category (₹)",
          data: Object.values(byCategory),
          backgroundColor: "#4B3FE4",
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  function renderTable(data){
    const tbody = document.getElementById("table");

    if(data.length === 0){
      tbody.innerHTML = `<tr class="empty-row"><td colspan="4">No expenses yet — add your first one above.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(e => {
      const date = new Date(e.created_at).toLocaleDateString();
      return `
        <tr>
          <td>₹${Number(e.amount).toFixed(2)}</td>
          <td>${escapeHtml(e.category)}</td>
          <td>${date}</td>
          <td>
            <button class="ghost" onclick='startEdit(${e.id}, ${e.amount}, "${escapeHtml(e.category)}")'>Edit</button>
            <button class="danger" onclick="removeExpense(${e.id})">Delete</button>
          </td>
        </tr>`;
    }).join("");
  }

  window.setPeriod = function(p){
    period = p;
    setPeriodUI();
    loadExpenses();
  };

  function setPeriodUI(){
    document.getElementById("tab-all").classList.toggle("active", period === "all");
    document.getElementById("tab-month").classList.toggle("active", period === "month");
    document.getElementById("tab-year").classList.toggle("active", period === "year");
    document.getElementById("totalLabel").textContent =
      period === "month" ? "Total this month" :
      period === "year"  ? "Total this year"  : "Total spent";
  }

  window.saveExpense = async function(){
    const amount = document.getElementById("amount").value;
    const category = document.getElementById("category").value.trim();

    if(!amount || Number(amount) <= 0 || !category){
      alert("Enter a valid amount and category.");
      return;
    }

    if(editId){
      await fetch(`/expenses/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, category })
      });
      cancelEdit();
    } else {
      await fetch("/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser, amount, category })
      });
      clearInputs();
    }

    loadExpenses();
  };

  window.startEdit = function(id, amount, category){
    editId = id;
    document.getElementById("amount").value = amount;
    document.getElementById("category").value = category;
    document.getElementById("saveBtn").textContent = "Save changes";
    document.getElementById("cancelBtn").style.display = "inline-block";
  };

  window.cancelEdit = function(){
    editId = null;
    clearInputs();
    document.getElementById("saveBtn").textContent = "Add expense";
    document.getElementById("cancelBtn").style.display = "none";
  };

  window.removeExpense = async function(id){
    if(!confirm("Delete this expense?")) return;
    await fetch(`/expenses/${id}`, { method: "DELETE" });
    loadExpenses();
  };

  function clearInputs(){
    document.getElementById("amount").value = "";
    document.getElementById("category").value = "";
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[c]));
  }
}
