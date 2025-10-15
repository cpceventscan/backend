const express = require('express');
const router = express.Router();
const { addFeedback, getFeedback, getAllFeedbackEvent, getFeedbacktitle} = require('../controllers/feedbackController');

router.post('/add', addFeedback);
router.get('/:eventId', getFeedback);
router.get('/', getAllFeedbackEvent);
router.get('/title/:eventId', getFeedbacktitle);
module.exports = router;
