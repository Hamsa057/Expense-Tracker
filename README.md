# Expense Ledger

A simplified rebuild of the expense manager: 7 files instead of 14, one shared
script, one dashboard page, and login backed by the database instead of
`localStorage`.

## What changed

- **Fewer files.** `monthly.html`, `yearly.html`, `reports.js`, and `script.js`
  are gone. `home.html` now has an *Overview / This Month / This Year* tab
  switcher that reuses the same table and chart.
- **Real login.** Registering and logging in now check the MySQL `users`
  table (password hashed with `scrypt`), instead of only living in the
  browser's `localStorage`. `localStorage` is still used client-side just to
  remember *who's currently logged in* on this device.
- **Cleaner API.** `GET/POST/PUT/DELETE /expenses` replaces the old mix of
  `/add`, `/update/:id`, `/delete/:id` GET-based deletes, and separate
  `/monthlyTotal` / `/yearlyTotal` routes — one endpoint filtered by
  `?period=month|year|all`.
- **New color palette** — indigo/violet primary with a soft off-white
  background, replacing the pink/blue combo — plus Sora + Inter for
  headings/body text.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create the database and tables:
   ```
   mysql -u root -p < schema.sql
   ```
3. Set your DB credentials as environment variables (or edit the defaults in
   `db.js`):
   ```
   export DB_HOST=localhost
   export DB_USER=root
   export DB_PASSWORD=yourpassword
   export DB_NAME=expenseDB
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open `http://localhost:3000`.

## File map

```
server.js        # HTTP server, auth + expense routes
db.js            # MySQL connection
schema.sql       # users + expenses tables
public/
  index.html     # login
  register.html  # register
  home.html      # dashboard: add expense, totals, monthly/yearly analysis
  app.js         # all client-side logic (shared across pages)
  style.css      # shared styling
```
