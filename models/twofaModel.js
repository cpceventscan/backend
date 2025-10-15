const db = require("../config/db");

// Get all students with 2FA status
const getAll = async () => {
  const [rows] = await db.query(`
SELECT 
  students.*,
  CONCAT(students.first_name, ' ', students.middle_name, ' ', students.last_name) AS name,
  courses.course_code AS course,
  CONCAT(year_levels.year_level, ' - ', sections.section_name) AS year_section,
  two_factor.status AS twofa_status
FROM students
LEFT JOIN courses ON students.course_id = courses.course_id
LEFT JOIN year_levels ON students.year_id = year_levels.year_id
LEFT JOIN sections ON students.section_id = sections.section_id
LEFT JOIN two_factor ON students.student_id = two_factor.student_id;
  `);
  return rows;
};

// Update or insert 2FA status
const updateStatus = async (student_id, status) => {
  // Check if entry exists in two_factor
  const [existing] = await db.query(
    "SELECT * FROM two_factor WHERE student_id = ?",
    [student_id]
  );

  if (existing.length > 0) {
    // Update existing record
    await db.query(
      "UPDATE two_factor SET status = ? WHERE student_id = ?",
      [status, student_id]
    );
  } else {
    // Insert new record
    await db.query(
      "INSERT INTO two_factor (student_id, status) VALUES (?, ?)",
      [student_id, status]
    );
  }
};

module.exports = { getAll, updateStatus };
