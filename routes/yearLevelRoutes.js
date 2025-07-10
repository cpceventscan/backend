const express = require('express');
const router = express.Router();
const yearLevelController = require('../controllers/yearLevelController');

router.post('/add', yearLevelController.addYearLevel);
router.get('/list', yearLevelController.getAllYears);
router.put('/update/:yearID', yearLevelController.updateYearLevel);

module.exports = router;
