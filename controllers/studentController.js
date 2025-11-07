const studentModel = require('../models/studentModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const db = require('../config/db');
require('dotenv').config();

// ✅ Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'cpcevents135@gmail.com',
    pass: process.env.EMAIL_PASS || 'hqcq rmrc alba cqvb',
  },
});

// ✅ Generate random 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

/* =====================================================
   STUDENT REGISTRATION
===================================================== */
const registerStudent = async (req, res) => {
  try {
    const student = req.body;
    const plainPassword = student.password;
    const hashedPassword = await bcrypt.hash(student.password, 10);
    student.password = hashedPassword;

    const studentId = await studentModel.createStudent(student);

    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'cpcevents135@gmail.com',
      to: student.email,
      subject: 'Student Registration - Password Info',
      text: `Hello ${student.first_name},\n\nYour Account Registration is successful.\n\nYour username is your Student ID: ${student.student_id}\nDefault password: ${plainPassword}\n\nPlease keep it safe.\n\n`,
    });

    res.status(201).json({ message: 'Student registered successfully', id: studentId });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/* =====================================================
   GET ALL STUDENTS
===================================================== */
const getAllStudents = async (req, res) => {
  try {
    const students = await studentModel.getAllStudents();
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

/* =====================================================
   ACTIVATE / DEACTIVATE STUDENT
===================================================== */
const deactivateStudent = async (req, res) => {
  try {
    await studentModel.deactivateStudent(req.params.id);
    res.json({ message: 'Student deactivated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const activateStudent = async (req, res) => {
  try {
    await studentModel.updateStatus(req.params.id, 0);
    res.json({ message: 'Student activated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to activate student' });
  }
};

/* =====================================================
   LOGOUT
===================================================== */
const logoutStudent = (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Logout failed.' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
};

/* =====================================================
   UPDATE STUDENT INFO
===================================================== */
const updateStudent = async (req, res) => {
  try {
    const studentData = req.body;
    if (studentData.id) delete studentData.id;

    const updated = await studentModel.updateStudent(req.params.id, studentData);
    if (updated.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found or no changes made' });
    }

    const [updatedRows] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    req.session.student = updatedRows[0];

    res.json({ message: 'Student updated successfully', student: updatedRows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update student' });
  }
};

/* =====================================================
   CHANGE PASSWORD
===================================================== */
const changePassword = async (req, res) => {
  try {
    const studentId = req.session?.student?.student_id;
    if (!studentId) return res.status(401).json({ message: 'Not authenticated' });

    const { currentPassword, newPassword } = req.body;
    const storedPassword = await studentModel.getPasswordByStudentId(studentId);

    const isMatch = storedPassword.startsWith('$2')
      ? await bcrypt.compare(currentPassword, storedPassword)
      : storedPassword === currentPassword;

    if (!isMatch) return res.status(401).json({ message: 'Incorrect current password' });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await studentModel.updatePassword(studentId, hashedNewPassword);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* =====================================================
   UPDATE AUTH (ENABLE / DISABLE 2FA)
===================================================== */
const updateAuth = async (req, res) => {
  try {
    const studentId = req.session?.student?.student_id;
    if (!studentId) return res.status(401).json({ message: 'Not authenticated' });

    const { auth } = req.body;
    const result = await studentModel.updateAuthStudent(studentId, auth);

    res.json({
      message: auth === 1
        ? 'Two-Factor Authentication enabled'
        : 'Two-Factor Authentication disabled',
    });
  } catch (err) {
    console.error('Error updating auth:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* =====================================================
   LOGIN WITH 2FA SUPPORT
===================================================== */
const loginStudent = async (req, res) => {
  const { student_id, password } = req.body;

  try {
    const [rows] = await db.execute(`
      SELECT 
        s.*, 
        c.course_code, 
        sec.section_name, 
        yl.year_level, 
        tf.status AS twofa_status,
        fi.id AS face_image_id,
        fi.image AS face_image,
        fi.created_at AS face_image_created_at,
        fi.luxand_id AS face_luxand_id
    FROM students s
    LEFT JOIN courses c ON s.course_id = c.course_id
    LEFT JOIN sections sec ON s.section_id = sec.section_id
    LEFT JOIN year_levels yl ON s.year_id = yl.year_id
    LEFT JOIN two_factor tf ON s.student_id = tf.student_id
    LEFT JOIN face_images fi ON s.student_id = fi.student_id
    WHERE s.student_id = ?;
    `, [student_id]);

    const student = rows[0];
    if (!student) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // ✅ 2FA enabled
    if (student.twofa_status === 1) {
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

      await db.execute(`
        INSERT INTO two_factor_codes (student_id, code, expires_at)
        VALUES (?, ?, ?)
      `, [student.student_id, code, expiresAt]);

      // Send code via email
      await transporter.sendMail({
        from: `"CPC Verification" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: 'Your 2FA Verification Code',
        html: `<p>Hello ${student.first_name},</p>
               <p>Your verification code is:</p>
               <h2>${code}</h2>
               <p>This code expires in 5 minutes.</p>`,
      });

      // ✅ Store temporary student info in session
      req.session.tempStudent = {
        student_id: student.student_id,
        email: student.email,
        first_name: student.first_name,
      };

      return res.json({
        twofa_required: true,
        email: student.email,
        student_id: student.student_id,
      });
    }

    // ✅ Normal login (no 2FA)
    req.session.student = student;
    res.json({ message: 'Login successful', student });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyTwoFA = async (req, res) => {
  try {
    // ✅ Use tempStudent from session
    const studentId = req.session?.tempStudent?.student_id;
    const { code } = req.body;

    if (!studentId || !code) {
      return res.status(400).json({ message: 'Missing student_id or code' });
    }

    const [rows] = await db.execute(`
      SELECT * FROM two_factor_codes
      WHERE student_id = ?
      ORDER BY id DESC
      LIMIT 1
    `, [studentId]);

    if (!rows.length) return res.status(400).json({ message: 'No verification code found' });

    const record = rows[0];
    const now = new Date();

    if (record.code !== code) return res.status(400).json({ message: 'Invalid verification code' });
    if (new Date(record.expires_at) < now) return res.status(400).json({ message: 'Verification code expired' });

    // Delete used code
    await db.execute('DELETE FROM two_factor_codes WHERE id = ?', [record.id]);

    // Fetch full student info
    const [studentRows] = await db.execute(`
      SELECT s.*, c.course_code, sec.section_name, yl.year_level, tf.status AS twofa_status
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.course_id
      LEFT JOIN sections sec ON s.section_id = sec.section_id
      LEFT JOIN year_levels yl ON s.year_id = yl.year_id
      LEFT JOIN two_factor tf ON s.student_id = tf.student_id
      WHERE s.student_id = ?
    `, [studentId]);

    const student = studentRows[0];

    // ✅ Store full student object in session
    req.session.student = student;
    delete req.session.tempStudent;

    res.json({ success: true, message: '2FA verified successfully', student });
  } catch (err) {
    console.error('Verify 2FA Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const resendTwoFactorCode = async (req, res) => {
  try {
    console.log('Resend 2FA request body:', req.body);

    const { student_id, email } = req.body;

    if (!student_id || !email) {
      console.log('Missing fields:', { student_id, email });
      return res.status(400).json({ message: 'Missing student_id or email' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.execute(`
      INSERT INTO two_factor_codes (student_id, code, expires_at)
      VALUES (?, ?, ?)
    `, [student_id, code, expiresAt]);

    console.log('2FA code generated:', code, 'for student_id:', student_id);

    await transporter.sendMail({
      from: `"CPC Verification" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your New 2FA Verification Code',
      html: `<p>Hello,</p><p>Your new verification code is:</p><h2>${code}</h2>`,
    });

    console.log('2FA code email sent to:', email);

    res.json({ message: 'New code sent successfully' });
  } catch (err) {
    console.error('Resend 2FA Error:', err);
    res.status(500).json({ message: 'Failed to resend code' });
  }
};
// Count total students
const countStudents = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM students');
    res.json({ total: rows[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error counting students' });
  }
};

const getAttendanceLogs = async (req, res) => {
  const studentId = req.params.student_id;
  try {
    const [rows] = await db.query(
      `SELECT 
    a.attendance_id,
    a.student_id,
    s.first_name,
    s.last_name,
    a.id,

    -- Map status
    CASE a.status
        WHEN 0 THEN 'Unsettled'
        WHEN 1 THEN 'Settled'
        ELSE 'N/A'
    END AS attendance_status,

    -- Morning times
    DATE_FORMAT(a.time_in, '%l:%i %p') AS time_in_formatted,
    CASE 
        WHEN a.trivia_time_in = '1900-01-01 00:00:00' THEN 'Missed'
        ELSE DATE_FORMAT(a.trivia_time_in, '%l:%i %p')
    END AS trivia_time_in_formatted,
    DATE_FORMAT(a.time_out, '%l:%i %p') AS time_out_formatted,

    -- Afternoon times
    DATE_FORMAT(a.afternoon_time_in, '%l:%i %p') AS afternoon_time_in_formatted,
    CASE 
        WHEN a.afternoon_trivia_time_in = '1900-01-01 00:00:00' THEN 'Missed'
        ELSE DATE_FORMAT(a.afternoon_trivia_time_in, '%l:%i %p')
    END AS afternoon_trivia_time_in_formatted,
    DATE_FORMAT(a.afternoon_time_out, '%l:%i %p') AS afternoon_time_out_formatted,

    a.remarks,
    a.absence_request,
    e.event_name,
    DATE_FORMAT(e.start_date_time, '%Y-%m-%d %l:%i %p') AS start_date_time_formatted,
    DATE_FORMAT(e.end_date_time, '%Y-%m-%d %l:%i %p') AS end_date_time_formatted,
    sr.request_id,
    sr.absence_requests_id,
    CASE sr.status
        WHEN 2 THEN 'Rejected'
        WHEN 1 THEN 'Approved'
        WHEN 0 THEN 'Pending'
        ELSE 'N/A'
    END AS request_status

FROM event_attendance a
JOIN events e ON a.id = e.id
LEFT JOIN students s ON a.student_id = s.student_id
LEFT JOIN student_request sr ON a.student_id = sr.student_id
WHERE a.student_id = ?
GROUP BY e.id`,
      [studentId]
    );

    res.json({ attendanceLogs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch attendance logs' });
  }
};

module.exports = {
  getAttendanceLogs,
  countStudents,
  registerStudent,
  getAllStudents,
  deactivateStudent,
  activateStudent,
  logoutStudent,
  updateStudent,
  changePassword,
  updateAuth,
  loginStudent,
  verifyTwoFA,
  resendTwoFactorCode,
};

