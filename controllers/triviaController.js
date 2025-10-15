const db = require('../config/db');

exports.addTrivia = async (req, res) => {
  try {
    const { event_id, time_period, question, option1, option2, correct_answer } = req.body;

    if (!event_id || !time_period || !question || !option1 || !option2 || !correct_answer) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Ensure only one trivia per event per period
    const [existing] = await db.query(
      'SELECT * FROM event_trivia WHERE event_id = ? AND time_period = ?',
      [event_id, time_period]
    );

    await db.query(
      'INSERT INTO event_trivia (event_id, time_period, question, option1, option2, correct_answer) VALUES (?, ?, ?, ?, ?, ?)',
      [event_id, time_period, question, option1, option2, correct_answer]
    );

    res.status(200).json({ success: true, message: 'Trivia created successfully.' });
  } catch (err) {
    console.error('❌ Error adding trivia:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTriviaByEventAndPeriod = async (req, res) => {
  try {
    const { event_id, period } = req.params;

    const [rows] = await db.query(
      'SELECT * FROM event_trivia WHERE event_id = ? AND time_period = ?',
      [event_id, period]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'No trivia found for this period.' });
    }

    res.json({ success: true, trivia: rows });
  } catch (err) {
    console.error('❌ Error fetching trivia:', err);
    res.status(500).json({ error: 'Failed to fetch trivia.' });
  }
};
