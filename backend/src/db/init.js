const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const dataDir = path.join(__dirname, '../../data');
const dbPath = process.env.DB_PATH || path.join(dataDir, 'budgetibo.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'EUR',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS years (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  UNIQUE(user_id, year)
);

CREATE TABLE IF NOT EXISTS months (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year_id INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
  allocation_distribution TEXT NOT NULL DEFAULT '{"besoins": 45, "courses": 10, "loisirs": 10, "vacances": 10, "epargne": 25}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(year_id) REFERENCES years(id),
  UNIQUE(year_id, month)
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('fixed', 'variable')),
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS fixed_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  source TEXT,
  copied_from_month_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(month_id) REFERENCES months(id),
  FOREIGN KEY(category_id) REFERENCES categories(id),
  FOREIGN KEY(copied_from_month_id) REFERENCES months(id)
);

CREATE TABLE IF NOT EXISTS variable_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  subcategory TEXT,
  label TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  cost_mitigation DECIMAL(10, 2) DEFAULT 0,
  date_incurred DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(month_id) REFERENCES months(id),
  FOREIGN KEY(category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS revenues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('fixed', 'variable')),
  label TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  source TEXT,
  copied_from_month_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(month_id) REFERENCES months(id),
  FOREIGN KEY(copied_from_month_id) REFERENCES months(id)
);

CREATE TABLE IF NOT EXISTS savings_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  annual_rate DECIMAL(5, 2) DEFAULT 0,
  initial_balance DECIMAL(12, 2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS monthly_savings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month_id INTEGER NOT NULL,
  savings_account_id INTEGER NOT NULL,
  amount_added DECIMAL(10, 2) DEFAULT 0,
  balance_at_month_end DECIMAL(12, 2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(month_id) REFERENCES months(id),
  FOREIGN KEY(savings_account_id) REFERENCES savings_accounts(id)
);

CREATE TABLE IF NOT EXISTS monthly_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month_id INTEGER NOT NULL UNIQUE,
  total_revenues DECIMAL(12, 2) DEFAULT 0,
  total_fixed_expenses DECIMAL(12, 2) DEFAULT 0,
  total_variable_expenses DECIMAL(12, 2) DEFAULT 0,
  distribution_theoretical TEXT,
  distribution_real TEXT,
  savings_theoretical DECIMAL(12, 2) DEFAULT 0,
  savings_real DECIMAL(12, 2) DEFAULT 0,
  is_closed BOOLEAN DEFAULT 0,
  closed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(month_id) REFERENCES months(id)
);
`;

db.serialize(() => {
  const statements = schema.split(';').filter(stmt => stmt.trim());
  statements.forEach((stmt, index) => {
    db.run(stmt + ';', (err) => {
      if (err) {
        console.error(`Error executing statement ${index + 1}:`, err);
      } else {
        console.log(`Table created successfully (${index + 1}/${statements.length})`);
      }
    });
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Database initialization complete. Connection closed.');
  }
});
