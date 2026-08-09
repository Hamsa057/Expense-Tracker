# Expense Ledger

A simple expense tracker with login/register, a dashboard for adding and
managing expenses, and monthly/yearly spending analysis with charts.

## Features

- **Login & register**, backed by MySQL — passwords are hashed with
  `scrypt`, not stored in plain text.
- **Dashboard** with a running total, an add/edit/delete expense form, and
  a full expense table.
- **Overview / This Month / This Year** tabs on the dashboard, each with a
  bar chart of spending by category.
- Clean REST-style API: `GET/POST/PUT/DELETE /expenses`, filterable by
  `?period=month|year|all`.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create the database and tables.

   On macOS/Linux:
   ```
   mysql -u root -p < schema.sql
   ```
   On Windows PowerShell:
   ```
   Get-Content schema.sql | mysql -u root -p
   ```
   (or open `mysql -u root -p` and run `source schema.sql` from the prompt)

3. Set your DB credentials as environment variables (or edit the defaults
   in `db.js`):

   macOS/Linux:
   ```
   export DB_HOST=localhost
   export DB_USER=root
   export DB_PASSWORD=yourpassword
   export DB_NAME=expenseDB
   ```
   Windows PowerShell:
   ```
   $env:DB_HOST="localhost"
   $env:DB_USER="root"
   $env:DB_PASSWORD="yourpassword"
   $env:DB_NAME="expenseDB"
   ```

4. Start the server:
   ```
   npm start
   ```

5. Open `http://localhost:3000` — register an account, then log in.

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
