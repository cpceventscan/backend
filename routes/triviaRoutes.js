const express = require('express');
const router = express.Router();
const triviaController = require('../controllers/triviaController');

router.post('/add', triviaController.addTrivia);
router.get('/:event_id/:period', triviaController.getTriviaByEventAndPeriod);

module.exports = router;
