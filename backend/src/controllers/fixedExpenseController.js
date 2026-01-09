const db = require('../db/connection');

const getFixedExpenses = async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.query.userId || 1;
    
    const yearRecord = await db.getQuery(
      'SELECT id FROM years WHERE user_id = ? AND year = ?',
      [userId, year]
    );
    
    if (!yearRecord) {
      return res.json([]);
    }
    
    const monthRecord = await db.getQuery(
      'SELECT id FROM months WHERE year_id = ? AND month = ?',
      [yearRecord.id, month]
    );
    
    if (!monthRecord) {
      return res.json([]);
    }
    
    const expenses = await db.allQuery(
      `SELECT fe.*, c.name as category_name FROM fixed_expenses fe
       LEFT JOIN categories c ON fe.category_id = c.id
       WHERE fe.month_id = ? ORDER BY fe.created_at`,
      [monthRecord.id]
    );
    
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching fixed expenses:', error);
    res.status(500).json({ error: error.message });
  }
};

const createFixedExpense = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { categoryId, label, amount, source } = req.body;
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
      'INSERT INTO fixed_expenses (month_id, category_id, label, amount, source) VALUES (?, ?, ?, ?, ?)',
      [monthRecord.id, categoryId, label, amount, source || null]
    );
    
    const expense = await db.getQuery('SELECT * FROM fixed_expenses WHERE id = ?', [result.id]);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating fixed expense:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateFixedExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { label, amount, source } = req.body;
    
    await db.runQuery(
      'UPDATE fixed_expenses SET label = ?, amount = ?, source = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [label, amount, source || null, expenseId]
    );
    
    const updated = await db.getQuery('SELECT * FROM fixed_expenses WHERE id = ?', [expenseId]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating fixed expense:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteFixedExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    
    await db.runQuery('DELETE FROM fixed_expenses WHERE id = ?', [expenseId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting fixed expense:', error);
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
    
    const sourceExpenses = await db.allQuery(
      'SELECT * FROM fixed_expenses WHERE month_id = ?',
      [sourceMonthRecord.id]
    );
    
    let copiedCount = 0;
    for (const expense of sourceExpenses) {
      await db.runQuery(
        'INSERT INTO fixed_expenses (month_id, category_id, label, amount, source, copied_from_month_id) VALUES (?, ?, ?, ?, ?, ?)',
        [targetMonthRecord.id, expense.category_id, expense.label, expense.amount, expense.source, sourceMonthRecord.id]
      );
      copiedCount++;
    }
    
    res.json({ message: `Copied ${copiedCount} fixed expenses` });
  } catch (error) {
    console.error('Error copying fixed expenses:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getFixedExpenses,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  copyFromMonth
};
