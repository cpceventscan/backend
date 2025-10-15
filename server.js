const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv');
const db = require('./config/db');
const bcrypt = require('bcryptjs');
dotenv.config();



// Import route modules
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const yearLevelRoutes = require('./routes/yearLevelRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const twofaRoutes = require("./routes/twofaRoutes");
const AbsenceRequest  = require('./routes/absenceRoutes');
const faceRoutes = require('./routes/faceRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const updatesRoutes = require('./routes/updates');
const userRoutes = require('./routes/userRoutes');
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS configuration to allow PUT/DELETE from localhost:8100
const corsOptions = {
  origin: [
    // 'http://localhost:8100',     // local development
    'https://cpceventscan.com',  // your live domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session setup (note: no need to include CORS stuff here)
app.use(session({
  secret: 'simplekey123',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // should be true only in production with HTTPS
}));

// Mount API routes
app.use('/api/events', eventRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/year-level', yearLevelRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', volunteerRoutes);
app.use('/api/absence-request', AbsenceRequest);
app.use('/api/face', faceRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/twofa", twofaRoutes);
app.use('/api/trivia', require('./routes/triviaRoutes'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/users', userRoutes);
app.get('/api/check-admin-session', (req, res) => {
  if (req.session.admin) {
    res.json({ loggedIn: true, admin: req.session.admin });
  } else {
    res.json({ loggedIn: false });
  }
});

// ✅ Session check route
app.get('/api/protected', (req, res) => {
  if (req.session.student) {
    res.json({ message: 'Authenticated', student: req.session.student });
  } else {
    res.status(401).json({ message: 'Not Authenticated' });
  }
});

// ✅ Login route with session
// ✅ Login route with 2FA check
// app.post('/api/students/auth-login', async (req, res) => {
//   const { student_id, password } = req.body;

//   try {
//     const [rows] = await db.execute(`
//       SELECT 
//         s.*, 
//         c.course_code, 
//         sec.section_name, 
//         yl.year_level,
//         tf.status AS twofa_status
//       FROM 
//         students s
//       LEFT JOIN 
//         courses c ON s.course_id = c.course_id
//       LEFT JOIN 
//         sections sec ON s.section_id = sec.section_id
//       LEFT JOIN 
//         year_levels yl ON s.year_id = yl.year_id
//       LEFT JOIN 
//         two_factor tf ON s.student_id = tf.student_id
//       WHERE 
//         s.student_id = ?
//     `, [student_id]);

//     const student = rows[0];
//     if (!student) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const isMatch = await bcrypt.compare(password, student.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // ✅ If Two-Factor Authentication is enabled (status = 1)
//     if (student.twofa_status === 1) {
//       // Generate a random 6-digit code
//       const code = Math.floor(100000 + Math.random() * 900000);

//       // Save code and expiration (5 min) to session or DB
//       req.session.twofa = {
//         student_id: student.student_id,
//         email: student.email,
//         code,
//         expires: Date.now() + 5 * 60 * 1000
//       };

//       // Send code via nodemailer
//       const nodemailer = require('nodemailer');
//       const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS
//         }
//       });

//       await transporter.sendMail({
//         from: `"CPC Verification" <${process.env.EMAIL_USER}>`,
//         to: student.email,
//         subject: 'Your 2FA Verification Code',
//         html: `<p>Hello ${student.first_name},</p>
//                <p>Your verification code is:</p>
//                <h2>${code}</h2>
//                <p>This code expires in 5 minutes.</p>`
//       });

//       // ✅ Respond that 2FA is required
//       return res.json({
//         twofa_required: true,
//         student_id: student.student_id,
//         email: student.email
//       });
//     }

//     // ✅ Normal login if no 2FA enabled
//     req.session.student = student;

//     res.json({
//       message: 'Login successful',
//       student
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Start server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
