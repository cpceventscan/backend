const { createAbsenceRequest } = require('../models/absenceModel');
const { Absence } = require('../models/absenceModel');
const { deleteAbsenceRequest } = require('../models/absenceModel');
const { insertStudentRequest } = require('../models/studentModel');
const { getAllAbsences } = require('../models/absenceModel');
const db = require('../config/db'); // Adjust path if needed


// controller
const submitAbsenceRequest = async (req, res) => {
  try {
    const studentId = req.session?.student?.student_id;
    if (!studentId) {
      return res.status(401).json({ success: 0, message: 'Unauthorized: No student session found' });
    }

    const {
      event_id,
      reason,
      parent_name,
      contact_info,
      agreement
    } = req.body;

    if (!event_id || !reason || !parent_name || !contact_info || agreement === undefined) {
      return res.status(400).json({ success: 0, message: 'Missing required fields' });
    }

    const documentation = req.file ? req.file.filename : null;

    // ✅ Create absence request
    const result = await createAbsenceRequest({
      event_id,
      student_id: studentId,
      reason,
      documentation,
      parent_name,
      contact_info,
      agreement
    });

    // ✅ Insert into student_request
    await insertStudentRequest({
      student_id: studentId,
      volunteered_id: null,
      absence_requests_id: result.insertId,
      date_requested: new Date(),
      event_id
    });

    res.status(201).json({
      success: 1,
      message: 'Absence request submitted successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('❌ Error submitting absence request:', error);
    res.status(500).json({ success: 0, message: 'Server error' });
  }
};

const getMyabsense= async (req, res) => {
  try {
    const studentId = req.session?.student?.student_id;
    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized: No student session found' });
    }

    const sql = `
      SELECT sr.id AS student_request_id,
       sr.student_id,
       sr.absence_requests_id,
       sr.status,
       sr.date_requested,
       e.id AS event_id,
       e.event_name,
       e.start_date_time,
       e.end_date_time,
       ab.*
FROM student_request sr
LEFT JOIN absence_requests ab ON sr.absence_requests_id = ab.absence_requests_id
LEFT JOIN events e ON ab.id = e.id
WHERE sr.student_id = ?
  AND sr.absence_requests_id IS NOT NULL
ORDER BY sr.date_requested DESC;
    `;

    const [rows] = await db.query(sql, [studentId]);
    res.json(rows);

  } catch (err) {
    console.error("❌ Error fetching student volunteers:", err);
    res.status(500).json({ error: err.message });
  }
};

const absenceController = {
  async getStudentAbsences(req, res) {
    try {
      const studentId = req.session?.student?.student_id; // from login session

      if (!studentId) {
        return res.status(401).json({ message: 'Not logged in' });
      }

      const absences = await Absence.getAbsencesByStudent(studentId);
      res.json(absences);

    } catch (error) {
      console.error('❌ Error fetching absences:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
};
const cancelAbsenceRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: 0, message: 'Missing request ID' });
    }

    const result = await deleteAbsenceRequest(id);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: 0, message: 'Request not found' });
    }

    res.json({ success: 1, message: 'Absence request cancelled' });
  } catch (error) {
    console.error('Error cancelling absence request:', error);
    res.status(500).json({ success: 0, message: 'Server error' });
  }
};

module.exports = { submitAbsenceRequest, absenceController, cancelAbsenceRequest, getMyabsense };
