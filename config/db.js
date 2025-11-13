const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'srv1858.hstgr.io',
  user: process.env.DB_USER || 'u704382877_cpc',
  password: process.env.DB_PASSWORD || 'CPCeventscan2005.',
  database: process.env.DB_NAME || 'u704382877_cpcevent',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.on('connection', async (connection) => {
  await connection.query("SET time_zone = '+08:00'");
});

module.exports = pool;
