const db = require('../db/connection');

const ensureYearExists = async (userId, year) => {
  let yearRecord = await db.getQuery(
    'SELECT id FROM years WHERE user_id = ? AND year = ?',
    [userId, year]
  );
  
  if (!yearRecord) {
    const result = await db.runQuery(
      'INSERT INTO years (user_id, year) VALUES (?, ?)',
      [userId, year]
    );
    yearRecord = { id: result.id };
  }
  
  return yearRecord;
};

const getAllMonthsForYear = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.query.userId || 1;
    
    const yearRecord = await ensureYearExists(userId, year);
    
    let months = await db.allQuery(
      `SELECT m.*, COUNT(fe.id) as fixed_count, COUNT(ve.id) as variable_count
       FROM months m
       LEFT JOIN fixed_expenses fe ON m.id = fe.month_id
       LEFT JOIN variable_expenses ve ON m.id = ve.month_id
       WHERE m.year_id = ?
       GROUP BY m.id
       ORDER BY m.month ASC`,
      [yearRecord.id]
    );
    
    if (months.length === 0) {
      for (let i = 1; i <= 12; i++) {
        await db.runQuery(
          `INSERT OR IGNORE INTO months (year_id, month, allocation_distribution)
           VALUES (?, ?, ?)`,
          [yearRecord.id, i, JSON.stringify({ besoins: 45, courses: 10, loisirs: 10, vacances: 10, epargne: 25 })]
        );
      }
      months = await db.allQuery(
        'SELECT * FROM months WHERE year_id = ? ORDER BY month ASC',
        [yearRecord.id]
      );
    }
    
    res.json(months.map(m => ({
      ...m,
      allocation_distribution: JSON.parse(m.allocation_distribution)
    })));
  } catch (error) {
    console.error('Error fetching months:', error);
    res.status(500).json({ error: error.message });
  }
};

const getMonthDetails = async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.query.userId || 1;
    
    const yearRecord = await ensureYearExists(userId, year);
    
    let monthRecord = await db.getQuery(
      'SELECT * FROM months WHERE year_id = ? AND month = ?',
      [yearRecord.id, month]
    );
    
    if (!monthRecord) {
      const result = await db.runQuery(
        `INSERT INTO months (year_id, month, allocation_distribution)
         VALUES (?, ?, ?)`,
        [yearRecord.id, month, JSON.stringify({ besoins: 45, courses: 10, loisirs: 10, vacances: 10, epargne: 25 })]
      );
      monthRecord = await db.getQuery('SELECT * FROM months WHERE id = ?', [result.id]);
    }
    
    const fixedExpenses = await db.allQuery(
      'SELECT * FROM fixed_expenses WHERE month_id = ? ORDER BY created_at',
      [monthRecord.id]
    );
    
    const variableExpenses = await db.allQuery(
      'SELECT * FROM variable_expenses WHERE month_id = ? ORDER BY date_incurred',
      [monthRecord.id]
    );
    
    const revenues = await db.allQuery(
      'SELECT * FROM revenues WHERE month_id = ? ORDER BY created_at',
      [monthRecord.id]
    );
    
    res.json({
      month: monthRecord,
      fixedExpenses,
      variableExpenses,
      revenues,
      allocation: JSON.parse(monthRecord.allocation_distribution)
    });
  } catch (error) {
    console.error('Error fetching month details:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateAllocation = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { allocation } = req.body;
    const userId = req.query.userId || 1;
    
    const yearRecord = await ensureYearExists(userId, year);
    
    const monthRecord = await db.getQuery(
      'SELECT id FROM months WHERE year_id = ? AND month = ?',
      [yearRecord.id, month]
    );
    
    if (!monthRecord) {
      return res.status(404).json({ error: 'Month not found' });
    }
    
    await db.runQuery(
      'UPDATE months SET allocation_distribution = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(allocation), monthRecord.id]
    );
    
    const updated = await db.getQuery('SELECT * FROM months WHERE id = ?', [monthRecord.id]);
    
    res.json({
      month: updated,
      allocation: JSON.parse(updated.allocation_distribution)
    });
  } catch (error) {
    console.error('Error updating allocation:', error);
    res.status(500).json({ error: error.message });
  }
};

const applyAllocationToYear = async (req, res) => {
  try {
    const { year } = req.params;
    const { allocation } = req.body;
    const userId = req.query.userId || 1;
    
    const yearRecord = await ensureYearExists(userId, year);
    
    await db.runQuery(
      'UPDATE months SET allocation_distribution = ?, updated_at = CURRENT_TIMESTAMP WHERE year_id = ?',
      [JSON.stringify(allocation), yearRecord.id]
    );
    
    const months = await db.allQuery(
      'SELECT * FROM months WHERE year_id = ? ORDER BY month ASC',
      [yearRecord.id]
    );
    
    res.json(months.map(m => ({
      ...m,
      allocation_distribution: JSON.parse(m.allocation_distribution)
    })));
  } catch (error) {
    console.error('Error applying allocation to year:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllMonthsForYear,
  getMonthDetails,
  updateAllocation,
  applyAllocationToYear
};
