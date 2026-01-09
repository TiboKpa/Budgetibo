const express = require('express');
const router = express.Router();
const savingsAccountController = require('../controllers/savingsAccountController');

router.get('/', savingsAccountController.getAllAccounts);
router.post('/', savingsAccountController.createAccount);
router.patch('/:accountId', savingsAccountController.updateAccount);
router.delete('/:accountId', savingsAccountController.deleteAccount);
router.post('/:year/:month/closure', savingsAccountController.recordMonthlySavings);

module.exports = router;
