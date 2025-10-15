const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

const isAuthenticated = (req, res, next) => {
  if (req.session.student) return next();
  res.status(401).json({ message: 'Not authenticated' });
};

router.post('/register', studentController.registerStudent);
router.get('/list', studentController.getAllStudents);
router.put('/deactivate/:id', studentController.deactivateStudent);
router.put('/activate/:id', studentController.activateStudent);
router.post('/logout', studentController.logoutStudent);
router.put('/update-student/:id', studentController.updateStudent);
router.post('/change-password', isAuthenticated, studentController.changePassword);
router.post('/update-auth', studentController.updateAuth);
router.post('/auth-login', studentController.loginStudent);
router.post('/verify-twofa', studentController.verifyTwoFA);
router.post('/resend-twofa', studentController.resendTwoFactorCode);
router.post('/logout-all', isAuthenticated, studentController.logoutStudent);
router.get('/count', studentController.countStudents);
router.get('/attendance-logs/:student_id', studentController.getAttendanceLogs);

module.exports = router;
