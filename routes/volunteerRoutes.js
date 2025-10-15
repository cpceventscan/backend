const express = require('express');
const router = express.Router();
const { 
  submitVolunteerApplication, 
  getVolunteers, 
  cancelVolunteerApplication ,
  getMyVolunteers
} = require('../controllers/volunteerController');

router.post('/volunteers/apply', submitVolunteerApplication);

router.get('/volunteers', getVolunteers);
router.get('/myvolunteers', getMyVolunteers);
router.delete('/volunteers/:id', cancelVolunteerApplication);

module.exports = router;
