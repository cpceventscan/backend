const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController');

router.post('/create', controller.createNotification);
router.get('/list', controller.listNotifications); // student view
router.get('/list-all', controller.listAllNotifications); // admin view
router.delete('/delete/:id', controller.deleteNotification);
router.put('/update/:id', controller.updateNotification);
router.put('/mark-read/:id', controller.markReadNotification);

module.exports = router;
