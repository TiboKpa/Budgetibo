const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Database Setup
const dbPath = path.join(__dirname, 'database', 'budgetibo.db');
const schemaPath = path.join(__dirname, 'database', 'schema.sql');

// Ensure database directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);

// Initialize Schema
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

// --- ROUTES ---

// 1. Months Management
app.get('/api/months/:year', (req, res) => {
    const { year } = req.params;
    // Ensure all 12 months exist for the year
    const insertStmt = db.prepare('INSERT OR IGNORE INTO months (year, month_number) VALUES (?, ?)');
    const insertMany = db.transaction((y) => {
        for (let i = 1; i <= 12; i++) insertStmt.run(y, i);
    });
    insertMany(year);

    const months = db.prepare('SELECT * FROM months WHERE year = ? ORDER BY month_number').all(year);
    res.json(months);
});

app.put('/api/months/:id/config', (req, res) => {
    const { id } = req.params;
    const { budget_config } = req.body; // Expects JSON object
    db.prepare('UPDATE months SET budget_config = ? WHERE id = ?').run(JSON.stringify(budget_config), id);
    res.json({ success: true });
});

app.put('/api/months/:id/close', (req, res) => {
    const { id } = req.params;
    const { savings_actual, savings_distribution } = req.body;
    db.prepare(`
        UPDATE months 
        SET status = 'closed', 
            savings_actual = ?, 
            savings_distribution = ? 
        WHERE id = ?
    `).run(savings_actual, JSON.stringify(savings_distribution), id);
    res.json({ success: true });
});

// 2. Transactions
app.get('/api/transactions/:month_id', (req, res) => {
    const txs = db.prepare(`
        SELECT t.*, c.name as category_name 
        FROM transactions t 
        LEFT JOIN categories c ON t.category_id = c.id 
        WHERE month_id = ?
    `).all(req.params.month_id);
    res.json(txs);
});

app.post('/api/transactions', (req, res) => {
    const { date, description, amount, category_id, subcategory_name, type, is_fixed, is_mitigation, month_id } = req.body;
    
    // Auto-add subcategory to history
    if (subcategory_name) {
        const checkSub = db.prepare('SELECT id FROM subcategories WHERE name = ? AND category_id = ?');
        const existing = checkSub.get(subcategory_name, category_id);
        if (existing) {
            db.prepare('UPDATE subcategories SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(existing.id);
        } else {
            db.prepare('INSERT INTO subcategories (name, category_id, last_used_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(subcategory_name, category_id);
        }
    }

    const stmt = db.prepare(`
        INSERT INTO transactions (date, description, amount, category_id, subcategory_name, type, is_fixed, is_mitigation, month_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(date, description, amount, category_id, subcategory_name, type, is_fixed, is_mitigation ? 1 : 0, month_id);
    res.json({ id: info.lastInsertRowid });
});

app.delete('/api/transactions/:id', (req, res) => {
    db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// 3. Batch Operations (Copy Previous Month)
app.post('/api/months/:targetMonthId/copy-fixed', (req, res) => {
    const { sourceMonthId } = req.body;
    const { targetMonthId } = req.params;

    const sourceTxs = db.prepare('SELECT * FROM transactions WHERE month_id = ? AND is_fixed = 1').all(sourceMonthId);
    
    if (sourceTxs.length === 0) return res.json({ count: 0 });

    const insertStmt = db.prepare(`
        INSERT INTO transactions (date, description, amount, category_id, subcategory_name, type, is_fixed, is_mitigation, month_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // We keep the day but change the month/year to match target month
    // Need to get target month details
    const targetMonth = db.prepare('SELECT year, month_number FROM months WHERE id = ?').get(targetMonthId);
    
    const count = db.transaction(() => {
        let inserted = 0;
        for (const tx of sourceTxs) {
            const oldDate = new Date(tx.date);
            const newDate = new Date(Date.UTC(targetMonth.year, targetMonth.month_number - 1, oldDate.getDate())).toISOString().split('T')[0];
            
            insertStmt.run(newDate, tx.description, tx.amount, tx.category_id, tx.subcategory_name, tx.type, 1, tx.is_mitigation, targetMonthId);
            inserted++;
        }
        return inserted;
    })();

    res.json({ count });
});

app.get('/api/categories', (req, res) => {
    const cats = db.prepare('SELECT * FROM categories').all();
    res.json(cats);
});

app.get('/api/subcategories', (req, res) => {
    const subs = db.prepare('SELECT * FROM subcategories ORDER BY last_used_at DESC').all();
    res.json(subs);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
