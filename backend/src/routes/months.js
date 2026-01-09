const express = require('express');
const router = express.Router();
const monthController = require('../controllers/monthController');

router.get('/:year', monthController.getAllMonthsForYear);
router.get('/:year/:month', monthController.getMonthDetails);
router.patch('/:year/:month/allocation', monthController.updateAllocation);
router.post('/:year/:month/allocation/apply-all', monthController.applyAllocationToYear);

module.exports = router;
