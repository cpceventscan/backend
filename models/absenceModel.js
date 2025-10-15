const db = require('../config/db');

const createAbsenceRequest = async ({
  event_id,
  student_id,
  reason,
  documentation,
  parent_name,
  contact_info,
  agreement
}) => {
  const sql = `
    INSERT INTO absence_requests
      (id, student_id, reason, documentation, submission_date, parent_name, contact_info, agreement, created_at)
    VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, NOW())
  `;

  const [result] = await db.query(sql, [
    event_id,
    student_id,
    reason,
    documentation,
    parent_name,
    contact_info,
    agreement ? 1 : 0
  ]);

  return result;
};

const Absence = {
  async getAbsencesByStudent(studentId) {
    const query = `
      SELECT 
        ar.absence_requests_id,
        ar.id AS request_id,
        ar.student_id,
        ar.full_name AS student_name,
        ar.department,
        ar.year_section,
        ar.reason,
        ar.documentation,
        ar.submission_date,
        e.id AS event_id,
        e.event_name,
        e.start_date_time,
        e.end_date_time
      FROM absence_requests ar
      JOIN students s ON ar.student_id = s.student_id
      JOIN events e ON ar.id = e.id  -- keep this as-is for now per your request
      WHERE ar.student_id = ?
      ORDER BY ar.submission_date DESC
    `;
    const [rows] = await db.query(query, [studentId]);
    return rows;
  }
};

async function deleteAbsenceRequest(absenceRequestId) {
  if (!absenceRequestId) throw new Error('Volunteer ID is required');

  const connection = await db.getConnection();
  try {
    console.log('🔹 Starting deletion for volunteer id:', absenceRequestId);
    await connection.beginTransaction();

    // Delete from student_request
    const [srResult] = await connection.query(
      'DELETE FROM student_request WHERE absence_requests_id = ?',
      [absenceRequestId]
    );

    // Delete from volunteers
    const [vResult] = await connection.query(
      'DELETE FROM absence_requests WHERE absence_requests_id = ?',
      [absenceRequestId]
    );

    await connection.commit();
    return vResult;
  } catch (err) {
    await connection.rollback();
    console.error('❌ Error deleting volunteer:', err);
    throw err;
  } finally {
    connection.release();
  }
}
const insertStudentRequest = async ({ student_id, volunteered_id = null, absence_requests_id = null, date_requested }) => {
  const sql = `
    INSERT INTO student_request 
      (student_id, volunteered_id, absence_requests_id, date_requested)
    VALUES (?, ?, ?, ?)
  `;
  const params = [student_id, volunteered_id, absence_requests_id, date_requested];
  return db.query(sql, params);
};

module.exports = { createAbsenceRequest, Absence, deleteAbsenceRequest, insertStudentRequest };
