CREATE TABLE IF NOT EXISTS months (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month_number INTEGER NOT NULL, -- 1-12
    status TEXT DEFAULT 'open', -- 'open', 'closed'
    budget_config TEXT DEFAULT '{"needs":45,"wants":10,"travel":10,"savings":35}', -- JSON string for % distribution
    savings_actual REAL DEFAULT 0,
    savings_distribution TEXT DEFAULT '{}', -- JSON: {"Livret A": 500, "PEA": 200}
    UNIQUE(year, month_number)
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'fixed_expense', 'variable_expense', 'income'
    is_system BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    last_used_at DATETIME,
    FOREIGN KEY(category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, -- YYYY-MM-DD
    description TEXT,
    amount REAL NOT NULL,
    category_id INTEGER,
    subcategory_name TEXT, -- Stored as text for easier display, also linked to subcategories table for autocomplete
    type TEXT NOT NULL, -- 'income', 'expense'
    is_fixed BOOLEAN DEFAULT 0, -- 1 for fixed expenses/incomes, 0 for variable
    is_mitigation BOOLEAN DEFAULT 0, -- 1 if it reduces an expense (e.g. carpooling income)
    month_id INTEGER,
    FOREIGN KEY(month_id) REFERENCES months(id),
    FOREIGN KEY(category_id) REFERENCES categories(id)
);

-- Seed initial categories if empty
INSERT OR IGNORE INTO categories (id, name, type, is_system) VALUES 
(1, 'Salaire', 'income', 1),
(2, 'Loyer/Crédit', 'fixed_expense', 1),
(3, 'Electricité/Gaz', 'fixed_expense', 1),
(4, 'Assurances', 'fixed_expense', 1),
(5, 'Abonnements', 'fixed_expense', 1),
(6, 'Courses', 'variable_expense', 1),
(7, 'Loisirs', 'variable_expense', 1),
(8, 'Vacances', 'variable_expense', 1),
(9, 'Transports', 'variable_expense', 1),
(10, 'Santé', 'variable_expense', 1);
