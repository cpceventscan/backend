const cors = require('cors');
const session = require('express-session');
const dotenv = require('dotenv');
const MySQLStore = require('express-mysql-session')(session);
const db = require('./config/db');
const bcrypt = require('bcryptjs');
const express = require('express');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   ✅ HTTPS Proxy (Render)
   ========================= */
app.set('trust proxy', 1);

/* =========================
   ✅ CORS Configuration
   ========================= */
const corsOptions = {
  origin: [
    'https://cpceventscan.com',
    'https://www.cpceventscan.com'
  ],
  credentials: true, // allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'] // Safari requires this for cookies
};
app.use(cors(corsOptions));

/* =========================
   ✅ Express Middleware
   ========================= */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* =========================
   ✅ Session Configuration
   ========================= */
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use(session({
  secret: 'simplekey123',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  proxy: true, // important for secure cookies on Render
  cookie: {
    secure: true,        // HTTPS only
    httpOnly: true,
    sameSite: 'none',    // allow cross-subdomain (needed for Safari)
    domain: '.cpceventscan.com', // production domain
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  },
}));

/* =========================
   ✅ Static folder for uploads
   ========================= */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =========================
   ✅ API Routes
   ========================= */
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/year-level', require('./routes/yearLevelRoutes'));
app.use('/api/sections', require('./routes/sectionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/volunteers', require('./routes/volunteerRoutes'));
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
   ✅ Default route
   ========================= */
app.get('/', (req, res) => {
  res.send('🚀 CPC EventScan Backend running on Render');
});

/* =========================
   ✅ Start server
   ========================= */
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
