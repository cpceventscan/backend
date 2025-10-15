const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.post('/', eventController.createEvent);
router.get('/list', eventController.getAllEvents);
router.get('/list/:id', eventController.getEventById);
router.delete('/delete/:id', eventController.deleteEvent);
router.put('/update/:id', eventController.updateEvent);

module.exports = router;