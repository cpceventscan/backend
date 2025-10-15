const express = require('express');
const router = express.Router();
const { getAllStudentRequests, updateRequestStatus } = require('../controllers/adminRequestController');

router.get('/requests', getAllStudentRequests);
router.put('/requests/:request_id', updateRequestStatus);

module.exports = router;
