const express = require('express');
const router = express.Router();
const variableExpenseController = require('../controllers/variableExpenseController');

router.get('/:year/:month', variableExpenseController.getVariableExpenses);
router.post('/:year/:month', variableExpenseController.createVariableExpense);
router.patch('/:year/:month/:expenseId', variableExpenseController.updateVariableExpense);
router.delete('/:year/:month/:expenseId', variableExpenseController.deleteVariableExpense);

module.exports = router;
