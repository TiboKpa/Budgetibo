const db = require('../db/connection');

const getRevenues = async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.query.userId || 1;
    
    const yearRecord = await db.getQuery(
      'SELECT id FROM years WHERE user_id = ? AND year = ?',
      [userId, year]
    );
    
    if (!yearRecord) {
      return res.json({ fixed: [], variable: [] });
    }
    
    const monthRecord = await db.getQuery(
      'SELECT id FROM months WHERE year_id = ? AND month = ?',
      [yearRecord.id, month]
    );
    
    if (!monthRecord) {
      return res.json({ fixed: [], variable: [] });
    }
    
    const revenues = await db.allQuery(
      'SELECT * FROM revenues WHERE month_id = ? ORDER BY type, created_at',
      [monthRecord.id]
    );
    
    const fixed = revenues.filter(r => r.type === 'fixed');
    const variable = revenues.filter(r => r.type === 'variable');
    
    res.json({ fixed, variable });
  } catch (error) {
    console.error('Error fetching revenues:', error);
    res.status(500).json({ error: error.message });
  }
};

const createRevenue = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { type, label, amount, source } = req.body;
    const userId = req.query.userId || 1;
    
    const yearRecord = await db.getQuery(
      'SELECT id FROM years WHERE user_id = ? AND year = ?',
      [userId, year]
    );
    
    if (!yearRecord) {
      return res.status(404).json({ error: 'Year not found' });
    }
    
    let monthRecord = await db.getQuery(
      'SELECT id FROM months WHERE year_id = ? AND month = ?',
      [yearRecord.id, month]
    );
    
    if (!monthRecord) {
      const monthResult = await db.runQuery(
        'INSERT INTO months (year_id, month) VALUES (?, ?)',
        [yearRecord.id, month]
      );
      monthRecord = { id: monthResult.id };
    }
    
    const result = await db.runQuery(
      'INSERT INTO revenues (month_id, type, label, amount, source) VALUES (?, ?, ?, ?, ?)',
      [monthRecord.id, type, label, amount, source || null]
    );
    
    const revenue = await db.getQuery('SELECT * FROM revenues WHERE id = ?', [result.id]);
    res.status(201).json(revenue);
  } catch (error) {
    console.error('Error creating revenue:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateRevenue = async (req, res) => {
  try {
    const { revenueId } = req.params;
    const { label, amount, source } = req.body;
    
    await db.runQuery(
      'UPDATE revenues SET label = ?, amount = ?, source = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [label, amount, source || null, revenueId]
    );
    
    const updated = await db.getQuery('SELECT * FROM revenues WHERE id = ?', [revenueId]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating revenue:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteRevenue = async (req, res) => {
  try {
    const { revenueId } = req.params;
    
    await db.runQuery('DELETE FROM revenues WHERE id = ?', [revenueId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting revenue:', error);
    res.status(500).json({ error: error.message });
  }
};

const copyFromMonth = async (req, res) => {
  try {
    const { year, month, sourceMonth } = req.params;
    const userId = req.query.userId || 1;
    
    const yearRecord = await db.getQuery(
      'SELECT id FROM years WHERE user_id = ? AND year = ?',
      [userId, year]
    );
    
    if (!yearRecord) {
      return res.status(404).json({ error: 'Year not found' });
    }
    
    const sourceMonthRecord = await db.getQuery(
      'SELECT id FROM months WHERE year_id = ? AND month = ?',
      [yearRecord.id, sourceMonth]
    );
    
    if (!sourceMonthRecord) {
      return res.status(404).json({ error: 'Source month not found' });
    }
    
    let targetMonthRecord = await db.getQuery(
      'SELECT id FROM months WHERE year_id = ? AND month = ?',
      [yearRecord.id, month]
    );
    
    if (!targetMonthRecord) {
      const monthResult = await db.runQuery(
        'INSERT INTO months (year_id, month) VALUES (?, ?)',
        [yearRecord.id, month]
      );
      targetMonthRecord = { id: monthResult.id };
    }
    
    const sourceRevenues = await db.allQuery(
      'SELECT * FROM revenues WHERE month_id = ? AND type = ?',
      [sourceMonthRecord.id, 'fixed']
    );
    
    let copiedCount = 0;
    for (const revenue of sourceRevenues) {
      await db.runQuery(
        'INSERT INTO revenues (month_id, type, label, amount, source, copied_from_month_id) VALUES (?, ?, ?, ?, ?, ?)',
        [targetMonthRecord.id, revenue.type, revenue.label, revenue.amount, revenue.source, sourceMonthRecord.id]
      );
      copiedCount++;
    }
    
    res.json({ message: `Copied ${copiedCount} fixed revenues` });
  } catch (error) {
    console.error('Error copying revenues:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getRevenues,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  copyFromMonth
};
