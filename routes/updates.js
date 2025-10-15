const express = require('express');
const router = express.Router();
const db = require('../config/db'); // promise-based pool

// Get all updates
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM updates ORDER BY created_at DESC');
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get single update by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db.query('SELECT * FROM updates WHERE update_id = ?', [id]);
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Create new update
router.post('/', async (req, res) => {
  const { name, description, status } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO updates (name, description, status) VALUES (?, ?, ?)',
      [name, description, status || 'Inactive']
    );
    res.json({ id: result.insertId, name, description, status: status || 'Inactive' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update an update
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  try {
    await db.query(
      'UPDATE updates SET name = ?, description = ?, status = ? WHERE update_id = ?',
      [name, description, status, id]
    );
    res.json({ id, name, description, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete an update
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Backend received ID:', id);
  try {
    const [result] = await db.query(
      'DELETE FROM updates WHERE update_id = ?', 
      [id]
    );
    console.log('DB result:', result);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No update found with that ID.' });
    }
    res.json({ message: 'Update deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
