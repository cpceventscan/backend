const db = require('../config/db');

// Save feedback
const saveFeedback = async (studentId, eventId, notes) => {
  // If id is AUTO_INCREMENT, don't pass eventId as id
  const query = `INSERT INTO feedback (student_id, id, notes) VALUES (?, ?, ?)`;
  const [result] = await db.execute(query, [studentId, eventId, notes]);
  return result;
};

// Get all feedback for an event
const getFeedbackByEventtitle = async (eventId) => {
  const query = `
    SELECT 
    f.*, 
    s.first_name, 
    s.last_name,
    c.course_id AS course_id,
    c.course_code AS course_code,
    sec.section_id,
    sec.section_name AS section_name,
    y.year_id AS year_id,
    y.year_level AS year_name,
    e.id AS event_id,
    e.*,
    e.event_name AS event_name,
    (
      SELECT COUNT(*) 
      FROM feedback f2 
      WHERE f2.id = e.id
    ) AS total_feedback_for_event
FROM feedback f
JOIN students s ON s.student_id = f.student_id
JOIN courses c ON c.course_id = s.course_id
JOIN sections sec ON sec.section_id = s.section_id
JOIN year_levels y ON y.year_id = s.year_id
JOIN events e ON e.id = f.id
LEFT JOIN feedback f2 ON f2.id = e.id
WHERE f.id = ?
GROUP BY e.id
ORDER BY f.created_at DESC;
  `;
  const [rows] = await db.execute(query, [eventId]);
  return rows;
};
const getFeedbackByEvent = async (eventId) => {
  const query = `
   SELECT 
    f.*,
    s.first_name,
    s.last_name,
    c.course_id,
    c.course_code,
    sec.section_id,
    sec.section_name,
    y.year_id,
    y.year_level AS year_name,
    e.id AS event_id,
    e.event_name,
    e.start_date_time,
    e.end_date_time,
    e.event_location,
    (
        SELECT COUNT(*) 
        FROM feedback f2 
        WHERE f2.id = e.id
    ) AS total_feedback_for_event
FROM feedback f
JOIN students s ON s.student_id = f.student_id
JOIN courses c ON c.course_id = s.course_id
JOIN sections sec ON sec.section_id = s.section_id
JOIN year_levels y ON y.year_id = s.year_id
JOIN events e ON e.id = f.id
WHERE f.id = ?
GROUP BY f.feedback_id
ORDER BY f.created_at DESC;
  `;
  const [rows] = await db.execute(query, [eventId]);
  return rows;
};

const getAllFeedback = async () => {
  const query = `
    SELECT 
      f.*, 
      s.first_name, 
      s.last_name,
      c.course_id, 
      c.course_code,
      sec.section_id,
      sec.section_name,
      y.year_id,
      y.year_level AS year_name,
      e.id AS event_id,
      e.event_name,
      e.*,
      (
        SELECT COUNT(*) 
        FROM feedback f2 
        WHERE f2.id = e.id
      ) AS total_feedback_for_event
    FROM feedback f
    JOIN students s ON s.student_id = f.student_id
    JOIN courses c ON c.course_id = s.course_id
    JOIN sections sec ON sec.section_id = s.section_id
    JOIN year_levels y ON y.year_id = s.year_id
    JOIN events e ON e.id = f.id
    GROUP BY e.id
    ORDER BY f.created_at DESC;
  `;
  const [rows] = await db.execute(query);
  return rows;
};

module.exports = { saveFeedback, getFeedbackByEvent, getAllFeedback, getFeedbackByEventtitle  };

