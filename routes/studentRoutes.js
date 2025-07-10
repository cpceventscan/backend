const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.post('/register', studentController.registerStudent);
router.get('/list', studentController.getAllStudents);
router.put('/deactivate/:id', studentController.deactivateStudent);
router.put('/activate/:id', studentController.activateStudent);

module.exports = router;