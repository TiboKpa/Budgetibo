const db = require('../db/connection');

const getVariableExpenses = async (req, res) => {
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
      `SELECT ve.*, c.name as category_name FROM variable_expenses ve
       LEFT JOIN categories c ON ve.category_id = c.id
       WHERE ve.month_id = ? ORDER BY ve.date_incurred`,
      [monthRecord.id]
    );
    
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching variable expenses:', error);
    res.status(500).json({ error: error.message });
  }
};

const createVariableExpense = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { categoryId, subcategory, label, amount, costMitigation, dateIncurred } = req.body;
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
      `INSERT INTO variable_expenses (month_id, category_id, subcategory, label, amount, cost_mitigation, date_incurred)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [monthRecord.id, categoryId, subcategory || null, label, amount, costMitigation || 0, dateIncurred]
    );
    
    const expense = await db.getQuery('SELECT * FROM variable_expenses WHERE id = ?', [result.id]);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating variable expense:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateVariableExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { label, amount, subcategory, costMitigation, dateIncurred } = req.body;
    
    await db.runQuery(
      `UPDATE variable_expenses
       SET label = ?, amount = ?, subcategory = ?, cost_mitigation = ?, date_incurred = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [label, amount, subcategory || null, costMitigation || 0, dateIncurred, expenseId]
    );
    
    const updated = await db.getQuery('SELECT * FROM variable_expenses WHERE id = ?', [expenseId]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating variable expense:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteVariableExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    
    await db.runQuery('DELETE FROM variable_expenses WHERE id = ?', [expenseId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting variable expense:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getVariableExpenses,
  createVariableExpense,
  updateVariableExpense,
  deleteVariableExpense
};
