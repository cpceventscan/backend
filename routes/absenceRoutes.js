// routes/absenceRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { submitAbsenceRequest } = require('../controllers/absenceController');
const { absenceController } = require('../controllers/absenceController');
const { getMyabsense } = require('../controllers/absenceController');
const { cancelAbsenceRequest } = require('../controllers/absenceController');

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// POST /apply with file
router.post('/apply', upload.single('documentation'), submitAbsenceRequest);
router.get('/', absenceController.getStudentAbsences);
router.get('/myabsense', getMyabsense);
router.delete('/:id', cancelAbsenceRequest);

module.exports = router;
