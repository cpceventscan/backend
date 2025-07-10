const express = require('express');
const router = express.Router();
const SectionController = require('../controllers/sectionController');

router.post('/create', SectionController.createSection);
router.get('/list', SectionController.getSections);
router.put('/update/:sectionId', SectionController.updateSection);

module.exports = router;