const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   ✅ CORS Configuration
   ========================= */
const corsOptions = {
  origin: ['https://cpceventscan.com'], // production domain
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

/* =========================
   ✅ Express Middleware
   ========================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/* =========================
   ✅ Session Configuration
   ========================= */
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || 'srv1858.hstgr.io',
  user: process.env.DB_USER || 'u704382877_cpc',
  password: process.env.DB_PASSWORD || 'CPCeventscan2005.',
  database: process.env.DB_NAME || 'u704382877_cpcevent',
});

app.use(
  session({
    secret: 'simplekey123',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

/* =========================
   ✅ Import Routes
   ========================= */
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const yearLevelRoutes = require('./routes/yearLevelRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const twofaRoutes = require('./routes/twofaRoutes');
const AbsenceRequest = require('./routes/absenceRoutes');
const faceRoutes = require('./routes/faceRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const updatesRoutes = require('./routes/updates');
const userRoutes = require('./routes/userRoutes');

/* =========================
   ✅ API Routes
   ========================= */
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
app.use('/api/twofa', twofaRoutes);
app.use('/api/trivia', require('./routes/triviaRoutes'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/users', userRoutes);

/* =========================
   ✅ Session Check Routes
   ========================= */
app.get('/api/check-admin-session', (req, res) => {
  if (req.session.admin) {
    res.json({ loggedIn: true, admin: req.session.admin });
  } else {
    res.json({ loggedIn: false });
  }
});

app.get('/api/protected', (req, res) => {
  if (req.session.student) {
    res.json({ message: 'Authenticated', student: req.session.student });
  } else {
    res.status(401).json({ message: 'Not Authenticated' });
  }
});

/* =========================
   ✅ Default Route
   ========================= */
app.get('/', (req, res) => {
  res.send('CPC EventScan Backend Running 🚀');
});

/* =========================
   ✅ Start Server
   ========================= */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
