const pool = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const tableName = 'user';

// --- GET all users ---
const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM ${tableName} where status = 1 or status = 2`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- GET user by ID ---
const getUserById = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE user_id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- CREATE user ---
const createUser = async (req, res) => {
  try {
    const { f_name, m_name, l_name, email, password, role, status } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(`INSERT INTO ${tableName} (f_name, m_name, l_name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [f_name, m_name, l_name, email, hashedPassword, role, status]
    );
    res.json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- UPDATE user ---
const updateUser = async (req, res) => {
  try {
    const { f_name, m_name, l_name, email, password, role, status } = req.body;

    let query = `UPDATE ${tableName} SET f_name=?, m_name=?, l_name=?, email=?, role=?, status=?`;
    const params = [f_name, m_name, l_name, email, role, status];

    let newHashedPassword = null;
    if (password) {
      newHashedPassword = await bcrypt.hash(password, 10);
      query += `, password=?`;
      params.push(newHashedPassword);
    }

    query += ` WHERE user_id=?`;
    params.push(req.params.id);

    await pool.query(query, params);

    // ✅ Update session if this is the logged-in admin
    if (req.session.admin && req.session.admin.user_id === parseInt(req.params.id)) {
      req.session.admin.f_name = f_name;
      req.session.admin.m_name = m_name;
      req.session.admin.l_name = l_name;
      req.session.admin.email = email;
      if (newHashedPassword) req.session.admin.password = newHashedPassword;
      req.session.admin.role = role;
      req.session.admin.status = status;
    }

    res.json({ message: 'User updated successfully', admin: req.session.admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// --- DELETE user ---
const deleteUser = async (req, res) => {
  try {
    await pool.query(`DELETE FROM ${tableName} WHERE user_id=?`, [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- LOGIN user ---
const loginUser = async (req, res) => {
const { email, password } = req.body;

try {
    const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE email=?`, [email]);

    if (rows.length === 0) {
    return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ✅ Save user to session
    req.session.admin = {
    user_id: user.user_id,
    f_name: user.f_name,
    m_name: user.m_name,
    l_name: user.l_name,
    email: user.email,
    role: user.role,
    password: user.password,
    status: user.status
    };

    console.log('Admin logged in, session created:', req.session.admin);

    res.json({
    message: 'Login successful',
    user: { ...user, password: undefined }
    });

} catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
}
};



module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, loginUser };
