const db = require('../db/connection');

const getAllAccounts = async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    
    const accounts = await db.allQuery(
      'SELECT * FROM savings_accounts WHERE user_id = ? ORDER BY created_at',
      [userId]
    );
    
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching savings accounts:', error);
    res.status(500).json({ error: error.message });
  }
};

const createAccount = async (req, res) => {
  try {
    const { name, annualRate, initialBalance } = req.body;
    const userId = req.query.userId || 1;
    
    const result = await db.runQuery(
      'INSERT INTO savings_accounts (user_id, name, annual_rate, initial_balance) VALUES (?, ?, ?, ?)',
      [userId, name, annualRate || 0, initialBalance || 0]
    );
    
    const account = await db.getQuery('SELECT * FROM savings_accounts WHERE id = ?', [result.id]);
    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating savings account:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { name, annualRate } = req.body;
    
    await db.runQuery(
      'UPDATE savings_accounts SET name = ?, annual_rate = ? WHERE id = ?',
      [name, annualRate, accountId]
    );
    
    const updated = await db.getQuery('SELECT * FROM savings_accounts WHERE id = ?', [accountId]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating savings account:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    await db.runQuery('DELETE FROM savings_accounts WHERE id = ?', [accountId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting savings account:', error);
    res.status(500).json({ error: error.message });
  }
};

const recordMonthlySavings = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { allocations } = req.body;
    const userId = req.query.userId || 1;
    
    const yearRecord = await db.getQuery(
      'SELECT id FROM years WHERE user_id = ? AND year = ?',
      [userId, year]
    );
    
    if (!yearRecord) {
      return res.status(404).json({ error: 'Year not found' });
    }
    
    const monthRecord = await db.getQuery(
      'SELECT id FROM months WHERE year_id = ? AND month = ?',
      [yearRecord.id, month]
    );
    
    if (!monthRecord) {
      return res.status(404).json({ error: 'Month not found' });
    }
    
    for (const [accountId, amount] of Object.entries(allocations)) {
      await db.runQuery(
        'INSERT OR REPLACE INTO monthly_savings (month_id, savings_account_id, amount_added) VALUES (?, ?, ?)',
        [monthRecord.id, accountId, amount]
      );
    }
    
    res.json({ success: true, message: 'Savings recorded for month' });
  } catch (error) {
    console.error('Error recording monthly savings:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  recordMonthlySavings
};
