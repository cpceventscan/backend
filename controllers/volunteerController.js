const volunteerModel = require('../models/volunteerModel');
const db = require('../config/db');
const { insertStudentRequest } = require('../models/studentModel');

const submitVolunteerApplication = async (req, res) => {
  try {
    const studentId = req.session?.student?.student_id;
    if (!studentId) return res.status(401).json({ message: 'Unauthorized: No student session found' });

    const {
      role,
      motivation,
      motivationOther,
      volunteeredBefore,
      pastRole,
      skills,
      skillsOther,
      available,
      team_preference,
      teamOther,
      agreement,
      event_id,
    } = req.body;

    // Insert into volunteer table
    const result = await volunteerModel.createVolunteer({
      studentId,
      role,
      motivation,
      motivationOther,
      volunteeredBefore,
      pastRole,
      skills,
      skillsOther,
      available,
      team_preference,
      teamOther,
      agreement,
      event_id,
    });

    // Insert into student_request table
    await insertStudentRequest({
      student_id: studentId,
      volunteered_id: result.insertId,
      absence_requests_id: null,
      date_requested: new Date(),
      event_id: event_id
    });

    res.status(201).json({
      message: 'Volunteer application submitted successfully',
      id: result.insertId,
    });
  } catch (error) {
    console.error('❌ Error submitting volunteer application:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// ✅ Get all volunteer applications with event details
const getVolunteers = async (req, res) => {
  try {
    const sql = `
      SELECT v.id, v.student_id, v.role, v.motivation, v.skills, v.available,
             v.team_preference, v.agreement, v.created_at, v.status,
             e.id AS event_id, e.event_name, e.start_date_time, e.end_date_time
      FROM volunteers v
      JOIN events e ON v.id = e.id
      ORDER BY v.created_at DESC
    `;

    const [rows] = await db.query(sql); // ✅ mysql2/promise syntax
    res.json(rows);

  } catch (err) {
    console.error("❌ Error fetching volunteers:", err);
    res.status(500).json({ error: err.message });
  }
};
// volunteerController.js
const cancelVolunteerApplication = async (req, res) => {
  const { id } = req.params;

  if (!id || id === 'undefined') {
    return res.status(400).json({ success: 0, message: 'Missing or invalid application ID' });
  }

  try {
    const result = await volunteerModel.deleteVolunteer(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: 0, message: 'Application not found' });
    }

    res.json({ success: 1, message: 'Volunteer application cancelled' });
  } catch (err) {
    console.error('❌ Error cancelling volunteer application:', err);
    res.status(500).json({ success: 0, message: 'Server error' });
  }
};

const getMyVolunteers = async (req, res) => {
  try {
    const studentId = req.session?.student?.student_id;
    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized: No student session found' });
    }

    const sql = `
      SELECT sr.id AS student_request_id,
       sr.student_id,
       sr.volunteered_id,
       sr.status,
       sr.date_requested,
       v.role,
       v.motivation,
       v.skills,
       v.available,
       v.team_preference,
       v.agreement,
       v.status AS volunteer_status,
       v.created_at AS volunteer_created_at,
       e.id AS event_id,
       e.event_name,
       e.start_date_time,
       e.end_date_time
FROM student_request sr
LEFT JOIN volunteers v ON sr.volunteered_id = v.volunteered_id
LEFT JOIN events e ON v.id = e.id
WHERE sr.student_id = ?
  AND sr.volunteered_id IS NOT NULL
ORDER BY sr.date_requested DESC;
    `;

    const [rows] = await db.query(sql, [studentId]);
    res.json(rows);

  } catch (err) {
    console.error("❌ Error fetching student volunteers:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  submitVolunteerApplication,
  getVolunteers,
  cancelVolunteerApplication,
  getMyVolunteers
};
