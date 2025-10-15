const express = require("express");
const router = express.Router();
const twofaController = require("../controllers/twofaController");

router.get("/", twofaController.get2FARecords);
router.post("/update", twofaController.toggle2FA);
router.post("/update-by-student", twofaController.update2FAByStudent);
router.post('/verify', (req, res) => {
  const { student_id, code } = req.body;

  if (!req.session.twofa || req.session.twofa.student_id !== student_id) {
    return res.status(400).json({ message: 'No verification pending.' });
  }

  if (Date.now() > req.session.twofa.expires) {
    return res.status(400).json({ message: 'Code expired.' });
  }

  if (req.session.twofa.code != code) {
    return res.status(400).json({ message: 'Invalid code.' });
  }

  delete req.session.twofa;
  req.session.student = { student_id };

  res.json({ message: 'Verification successful', student: req.session.student });
});

router.post('/resend', async (req, res) => {
  const { student_id } = req.body;
  // You can reuse the email sending logic here
  res.json({ message: 'Code resent (not implemented in this snippet)' });
});

module.exports = router;
