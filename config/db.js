const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u704382877_cpcevents',
  password: process.env.DB_PASSWORD || 'un54agS3pYw@.EK',
  database: process.env.DB_NAME || 'u704382877_cpcevents',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
