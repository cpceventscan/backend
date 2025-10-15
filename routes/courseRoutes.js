const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

router.post('/register', courseController.registerCourse);
router.get('/list', courseController.getCourses);
router.put('/update/:id', courseController.updateCourse);
router.get('/count', courseController.countCourses);

module.exports = router;