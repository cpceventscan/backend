const db = require('../config/db');

const createVolunteer = async (data) => {
  const {
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
  } = data;

  const [result] = await db.query(
    `INSERT INTO volunteers 
      (student_id, role, motivation, motivation_other, volunteered_before, past_role, skills, skills_other, available, team_preference, team_other, agreement, id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
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
    ]
  );

  return result;
};

// Get all volunteer applications by student
function getVolunteersByStudent(studentId) {
  return db.query(
    `SELECT v.*, e.event_name, e.start_date_time, e.end_date_time
     FROM volunteers v
     JOIN events e ON v.id = e.id
     WHERE v.student_id = ? ORDER BY v.created_at DESC`,
    [studentId]
  );
}


async function deleteVolunteer(id) {
  if (!id) throw new Error('Volunteer ID is required');

  const connection = await db.getConnection();
  try {
    console.log('🔹 Starting deletion for volunteer id:', id);
    await connection.beginTransaction();

    // Delete from student_request
    const [srResult] = await connection.query(
      'DELETE FROM student_request WHERE volunteered_id = ?',
      [id]
    );

    // Delete from volunteers
    const [vResult] = await connection.query(
      'DELETE FROM volunteers WHERE volunteered_id = ?',
      [id]
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

module.exports = {
  createVolunteer,
  getVolunteersByStudent,
  deleteVolunteer
};
