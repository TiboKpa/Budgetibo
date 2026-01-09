const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenueController');

router.get('/:year/:month', revenueController.getRevenues);
router.post('/:year/:month', revenueController.createRevenue);
router.patch('/:year/:month/:revenueId', revenueController.updateRevenue);
router.delete('/:year/:month/:revenueId', revenueController.deleteRevenue);
router.post('/:year/:month/copy-from/:sourceMonth', revenueController.copyFromMonth);

module.exports = router;
