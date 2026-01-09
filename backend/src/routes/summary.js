const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summaryController');

router.get('/year/:year', summaryController.getYearSummary);
router.get('/month/:year/:month', summaryController.getMonthSummary);

module.exports = router;
