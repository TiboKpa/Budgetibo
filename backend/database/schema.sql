CREATE TABLE IF NOT EXISTS months (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month_number INTEGER NOT NULL, -- 1-12
    status TEXT DEFAULT 'open', -- 'open', 'closed'
    -- Default config: Besoins 45%, Courses 10%, Loisirs 10%, Vacances 10%, Epargne 25%
    budget_config TEXT DEFAULT '{"Besoins":45,"Courses":10,"Loisirs":10,"Vacances":10,"Epargne":25}', 
    savings_actual REAL DEFAULT 0,
    savings_distribution TEXT DEFAULT '{}',
    UNIQUE(year, month_number)
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL, -- 'income', 'expense'
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
    date TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    category_id INTEGER,
    subcategory_name TEXT,
    type TEXT NOT NULL, -- 'income', 'expense'
    is_fixed BOOLEAN DEFAULT 0,
    is_mitigation BOOLEAN DEFAULT 0,
    month_id INTEGER,
    FOREIGN KEY(month_id) REFERENCES months(id),
    FOREIGN KEY(category_id) REFERENCES categories(id)
);

-- Seed user-defined categories
INSERT OR IGNORE INTO categories (name, type, is_system) VALUES 
('Salaire', 'income', 1),
('Autre Revenu', 'income', 1),
('Besoins', 'expense', 1),   -- Loyer, Elec, Assurances, etc.
('Courses', 'expense', 1),   -- Alimentation
('Loisirs', 'expense', 1),   -- Sorties, Plaisirs
('Vacances', 'expense', 1);  -- Voyages, Projets
