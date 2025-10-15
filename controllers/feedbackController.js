const { saveFeedback, getFeedbackByEvent, getAllFeedback, getFeedbackByEventtitle } = require('../models/feedbackModel');
const db = require('../config/db');

// POST /api/feedback/add
// const addFeedback = async (req, res) => {
//   try {
//     const { student_id, event_id, notes } = req.body;

//     if (!student_id || !event_id || !notes) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     await saveFeedback(student_id, event_id, notes); // must await
//     return res.status(200).json({ success: true, message: 'Feedback submitted successfully' });
//   } catch (err) {
//     console.error("❌ Error in addFeedback:", err);
//     return res.status(500).json({ error: 'Failed to save feedback' });
//   }
// };

const addFeedback = async (req, res) => {
  try {
    const { student_id, event_id, notes } = req.body;

    if (!student_id || !event_id || !notes) {
      console.log("⚠️ Missing required fields");
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [existing] = await db.query(
      'SELECT feedback_id FROM feedback WHERE student_id = ? AND id = ?',
      [student_id, event_id]
    );

    if (existing.length > 0) {
      console.log("🚫 Duplicate feedback detected for student:", student_id, "event:", event_id);
      return res.status(400).json({
        success: false,
        error: 'You have already submitted feedback for this event.'
      });
    }

    await saveFeedback(student_id, event_id, notes);

    return res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (err) {
    console.error("❌ Error in addFeedback:", err);
    return res.status(500).json({ error: 'Failed to save feedback' });
  }
};

// GET /api/feedback/:eventId
const getFeedback = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const feedbackList = await getFeedbackByEvent(eventId);
    res.json({feedback: feedbackList });
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
};
const getFeedbacktitle = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const feedbackList = await getFeedbackByEventtitle(eventId);
    res.json({feedback: feedbackList });
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
};

const getAllFeedbackEvent = async (req, res) => {
  try {
    const feedbackList = await getAllFeedback (); // call without parameter
    res.json({ feedbackList });
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
};

module.exports = { addFeedback, getFeedback, getAllFeedbackEvent, getFeedbacktitle };
