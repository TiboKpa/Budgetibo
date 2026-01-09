const db = require('../db/connection');

const getMonthSummary = async (req, res) => {
  try {
    const { year, month } = req.params;
    const userId = req.query.userId || 1;
    
    const yearRecord = await db.getQuery(
      'SELECT id FROM years WHERE user_id = ? AND year = ?',
      [userId, year]
    );
    
    if (!yearRecord) {
      return res.status(404).json({ error: 'Year not found' });
    }
    
    const monthRecord = await db.getQuery(
      'SELECT * FROM months WHERE year_id = ? AND month = ?',
      [yearRecord.id, month]
    );
    
    if (!monthRecord) {
      return res.status(404).json({ error: 'Month not found' });
    }
    
    const fixedExpenses = await db.allQuery(
      'SELECT SUM(amount) as total FROM fixed_expenses WHERE month_id = ?',
      [monthRecord.id]
    );
    
    const variableExpenses = await db.allQuery(
      'SELECT category_id, SUM(amount - COALESCE(cost_mitigation, 0)) as total FROM variable_expenses WHERE month_id = ? GROUP BY category_id',
      [monthRecord.id]
    );
    
    const revenues = await db.allQuery(
      'SELECT SUM(amount) as total FROM revenues WHERE month_id = ?',
      [monthRecord.id]
    );
    
    const totalRevenues = revenues[0]?.total || 0;
    const totalFixedExpenses = fixedExpenses[0]?.total || 0;
    const totalVariableExpenses = variableExpenses.reduce((sum, row) => sum + (row.total || 0), 0);
    
    const allocation = JSON.parse(monthRecord.allocation_distribution);
    const savingsTheoretical = totalRevenues * (allocation.epargne / 100);
    
    res.json({
      month: monthRecord,
      totalRevenues,
      totalFixedExpenses,
      totalVariableExpenses,
      savingsTheoretical,
      allocation,
      variableByCategory: variableExpenses
    });
  } catch (error) {
    console.error('Error getting month summary:', error);
    res.status(500).json({ error: error.message });
  }
};

const getYearSummary = async (req, res) => {
  try {
    const { year } = req.params;
    const userId = req.query.userId || 1;
    
    const yearRecord = await db.getQuery(
      'SELECT id FROM years WHERE user_id = ? AND year = ?',
      [userId, year]
    );
    
    if (!yearRecord) {
      return res.status(404).json({ error: 'Year not found' });
    }
    
    const months = await db.allQuery(
      'SELECT * FROM months WHERE year_id = ? ORDER BY month',
      [yearRecord.id]
    );
    
    let annualSummary = {
      totalRevenues: 0,
      totalFixedExpenses: 0,
      totalVariableExpenses: 0,
      monthlyData: []
    };
    
    for (const month of months) {
      const monthSummary = await getMonthSummaryData(month.id);
      annualSummary.monthlyData.push(monthSummary);
      annualSummary.totalRevenues += monthSummary.totalRevenues;
      annualSummary.totalFixedExpenses += monthSummary.totalFixedExpenses;
      annualSummary.totalVariableExpenses += monthSummary.totalVariableExpenses;
    }
    
    res.json(annualSummary);
  } catch (error) {
    console.error('Error getting year summary:', error);
    res.status(500).json({ error: error.message });
  }
};

const getMonthSummaryData = async (monthId) => {
  const fixedResult = await db.getQuery(
    'SELECT SUM(amount) as total FROM fixed_expenses WHERE month_id = ?',
    [monthId]
  );
  
  const variableResult = await db.getQuery(
    'SELECT SUM(amount - COALESCE(cost_mitigation, 0)) as total FROM variable_expenses WHERE month_id = ?',
    [monthId]
  );
  
  const revenueResult = await db.getQuery(
    'SELECT SUM(amount) as total FROM revenues WHERE month_id = ?',
    [monthId]
  );
  
  return {
    month_id: monthId,
    totalRevenues: revenueResult?.total || 0,
    totalFixedExpenses: fixedResult?.total || 0,
    totalVariableExpenses: variableResult?.total || 0
  };
};

module.exports = {
  getMonthSummary,
  getYearSummary
};
