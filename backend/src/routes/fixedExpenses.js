const express = require('express');
const router = express.Router();
const fixedExpenseController = require('../controllers/fixedExpenseController');

router.get('/:year/:month', fixedExpenseController.getFixedExpenses);
router.post('/:year/:month', fixedExpenseController.createFixedExpense);
router.patch('/:year/:month/:expenseId', fixedExpenseController.updateFixedExpense);
router.delete('/:year/:month/:expenseId', fixedExpenseController.deleteFixedExpense);
router.post('/:year/:month/copy-from/:sourceMonth', fixedExpenseController.copyFromMonth);

module.exports = router;
