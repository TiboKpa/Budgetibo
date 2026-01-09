const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/budgetibo.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

const getDatabase = () => {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('Connected to SQLite database at', dbPath);
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
      }
    });
    db.configure('busyTimeout', 5000);
  }
  return db;
};

const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const allQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
};

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
  allocation_distribution TEXT NOT NULL DEFAULT '{"besoins": 50, "loisirs": 30, "epargne": 20}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(year_id) REFERENCES years(id),
  UNIQUE(year_id, month)
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('fixed', 'variable', 'revenue')),
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS fixed_expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month_id INTEGER NOT NULL,
  category_id INTEGER,
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
  category_id INTEGER,
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
  type TEXT DEFAULT 'fixed',
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

const initDb = () => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.serialize(() => {
      const statements = schema.split(';').filter(stmt => stmt.trim());
      
      // 1. Run schema creation queries first
      statements.forEach((stmt) => {
        database.run(stmt + ';', (err) => {
          if (err) {
            console.error('Error executing schema statement:', err);
            // Don't reject here to allow progressive updates, but log errors
          }
        });
      });

      // 2. Insert default user
      database.run("INSERT OR IGNORE INTO users (id, name) VALUES (1, 'Default User')", (err) => {
        if (err) console.error('Error creating default user:', err);
      });

      // 3. Insert Excel-matching categories
      // We use 'fixed' and 'variable' types mainly, but some can be both or specific
      const defaultCategories = [
        ['fixed', 'Loyer'],
        ['fixed', 'Electricité'],
        ['fixed', 'Assurance'],
        ['fixed', 'Transport'],
        ['fixed', 'Internet'],
        ['fixed', 'Téléphone'],
        ['variable', 'Besoins'],
        ['variable', 'Loisirs'],
        ['variable', 'Vacances'],
        ['variable', 'Courses'],
        ['variable', 'Autre']
      ];

      defaultCategories.forEach(([type, name]) => {
        database.run(
          "INSERT INTO categories (user_id, type, name) SELECT 1, ?, ? WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id = 1 AND name = ?)",
          [type, name, name],
          (err) => {
            if (err) console.error(`Error creating category ${name}:`, err);
          }
        );
      });

      resolve();
    });
  });
};

module.exports = {
  getDatabase,
  runQuery,
  getQuery,
  allQuery,
  initDb
};
