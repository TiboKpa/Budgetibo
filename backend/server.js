const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
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

const db = new sqlite3.Database(dbPath);

// Helper for Promisified Queries
const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
    });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

// Initialize Schema
const schema = fs.readFileSync(schemaPath, 'utf8');
// Split schema by commands as sqlite3 exec can handle one at a time mostly safely, 
// but exec() handles multiple statements.
db.exec(schema, (err) => {
    if (err) console.error("Schema init error:", err);
    else console.log("Database initialized.");
});

// --- ROUTES ---

// 1. Months Management
app.get('/api/months/:year', async (req, res) => {
    const { year } = req.params;
    try {
        // Ensure all 12 months exist
        for (let i = 1; i <= 12; i++) {
            await run('INSERT OR IGNORE INTO months (year, month_number) VALUES (?, ?)', [year, i]);
        }
        const months = await all('SELECT * FROM months WHERE year = ? ORDER BY month_number', [year]);
        res.json(months);
    } catch(e) { res.status(500).json({error: e.message}) }
});

app.put('/api/months/:id/config', async (req, res) => {
    const { id } = req.params;
    const { budget_config } = req.body;
    await run('UPDATE months SET budget_config = ? WHERE id = ?', [JSON.stringify(budget_config), id]);
    res.json({ success: true });
});

app.put('/api/months/:id/close', async (req, res) => {
    const { id } = req.params;
    const { savings_actual, savings_distribution } = req.body;
    await run(`
        UPDATE months 
        SET status = 'closed', 
            savings_actual = ?, 
            savings_distribution = ? 
        WHERE id = ?
    `, [savings_actual, JSON.stringify(savings_distribution), id]);
    res.json({ success: true });
});

// 2. Transactions
app.get('/api/transactions/:month_id', async (req, res) => {
    try {
        const txs = await all(`
            SELECT t.*, c.name as category_name 
            FROM transactions t 
            LEFT JOIN categories c ON t.category_id = c.id 
            WHERE month_id = ?
        `, [req.params.month_id]);
        res.json(txs);
    } catch(e) { res.status(500).json({error: e.message}) }
});

app.post('/api/transactions', async (req, res) => {
    const { date, description, amount, category_id, subcategory_name, type, is_fixed, is_mitigation, month_id } = req.body;
    
    // Auto-add subcategory
    if (subcategory_name) {
        const existing = await get('SELECT id FROM subcategories WHERE name = ? AND category_id = ?', [subcategory_name, category_id]);
        if (existing) {
            await run('UPDATE subcategories SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?', [existing.id]);
        } else {
            await run('INSERT INTO subcategories (name, category_id, last_used_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [subcategory_name, category_id]);
        }
    }

    const info = await run(`
        INSERT INTO transactions (date, description, amount, category_id, subcategory_name, type, is_fixed, is_mitigation, month_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [date, description, amount, category_id, subcategory_name, type, is_fixed, is_mitigation ? 1 : 0, month_id]);
    
    res.json({ id: info.id });
});

app.delete('/api/transactions/:id', async (req, res) => {
    await run('DELETE FROM transactions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

// 3. Batch Operations
app.post('/api/months/:targetMonthId/copy-fixed', async (req, res) => {
    const { sourceMonthId } = req.body;
    const { targetMonthId } = req.params;

    const sourceTxs = await all('SELECT * FROM transactions WHERE month_id = ? AND is_fixed = 1', [sourceMonthId]);
    
    if (sourceTxs.length === 0) return res.json({ count: 0 });
    
    const targetMonth = await get('SELECT year, month_number FROM months WHERE id = ?', [targetMonthId]);

    let count = 0;
    for (const tx of sourceTxs) {
        const oldDate = new Date(tx.date);
        const newDate = new Date(Date.UTC(targetMonth.year, targetMonth.month_number - 1, oldDate.getDate())).toISOString().split('T')[0];
        
        await run(`
            INSERT INTO transactions (date, description, amount, category_id, subcategory_name, type, is_fixed, is_mitigation, month_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [newDate, tx.description, tx.amount, tx.category_id, tx.subcategory_name, tx.type, 1, tx.is_mitigation, targetMonthId]);
        count++;
    }

    res.json({ count });
});

app.get('/api/categories', async (req, res) => {
    const cats = await all('SELECT * FROM categories');
    res.json(cats);
});

app.get('/api/subcategories', async (req, res) => {
    const subs = await all('SELECT * FROM subcategories ORDER BY last_used_at DESC');
    res.json(subs);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
