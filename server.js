const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./config/db');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   ✅ Trust HTTPS proxy (Render)
   ========================= */
app.set('trust proxy', 1);

/* =========================
   ✅ CORS Configuration (Safari-safe)
   ========================= */
const FRONTEND_ORIGIN = 'https://cpceventscan.com';

const corsOptions = {
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle Safari preflight

/* =========================
   ✅ Body Parsing
   ========================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* =========================
   ✅ Session Store & Cookie
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
    proxy: true, // <-- ensures Express respects trust proxy for secure cookies
    cookie: {
      secure: true,           // HTTPS only
      httpOnly: true,
      sameSite: 'none',       // Required for cross-site (Safari fix)
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

/* =========================
   ✅ Routes
   ========================= */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/year-level', require('./routes/yearLevelRoutes'));
app.use('/api/sections', require('./routes/sectionRoutes'));
app.use('/api', require('./routes/volunteerRoutes'));
app.use('/api/absence-request', require('./routes/absenceRoutes'));
app.use('/api/face', require('./routes/faceRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/twofa', require('./routes/twofaRoutes'));
app.use('/api/trivia', require('./routes/triviaRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/updates', require('./routes/updates'));
app.use('/api/users', require('./routes/userRoutes'));

/* =========================
   ✅ Session Check
   ========================= */
app.get('/api/check-admin-session', (req, res) => {
  if (req.session.admin) {
    return res.json({ loggedIn: true, admin: req.session.admin });
  }
  res.json({ loggedIn: false });
});

app.get('/api/protected', (req, res) => {
  if (req.session.student) {
    return res.json({ message: 'Authenticated', student: req.session.student });
  }
  res.status(401).json({ message: 'Not Authenticated' });
});

/* =========================
   ✅ Root & Fallback
   ========================= */
app.get('/', (req, res) => {
  res.send('🚀 CPC EventScan Backend running on Render');
});

/* =========================
   ✅ Start Server
   ========================= */
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
