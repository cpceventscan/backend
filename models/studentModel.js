const db = require('../config/db');

const createStudent = async (student) => {
  const sql = `
    INSERT INTO students
    (student_id, last_name, first_name, middle_name, birthday, sex, age, course_id, year_id, section_id, email, password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(sql, [
    student.student_id,
    student.last_name,
    student.first_name,
    student.middle_name,
    student.birthday,
    student.sex,
    student.age,
    student.courseId,
    student.yearLevelId,
    student.sectionID,
    student.email,
    student.password,
  ]);
  return result.insertId;
};

const getAllStudents = async () => {
  const [rows] = await db.query('SELECT * FROM students JOIN courses ON students.course_id = courses.course_id JOIN year_levels ON students.year_id = year_levels.year_id JOIN sections ON students.section_id = sections.section_id; ');
  return rows;
};

const deactivateStudent = async (studentId) => {
  const [result] = await db.query('UPDATE students SET status = 1 WHERE id = ?', [studentId]);
  return result;
};

const updateStatus = async (studentId, status) => {
  const sql = 'UPDATE students SET status = ? WHERE id = ?';
  await db.query(sql, [status, studentId]);
};

const updateStudent = async (studentId, updatedFields) => {
  const allowedFields = [
    'student_id', 'first_name', 'middle_name', 'last_name', 'email',
    'course_id', 'year_id', 'section_id', 'phone', 'sex', 'birthday',
    'age', 'password', 'status', 'address'
  ];

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updatedFields)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    throw new Error('No valid fields provided for update.');
  }

  const sql = `UPDATE students SET ${fields.join(', ')} WHERE id = ?`;
  values.push(studentId);

  const [result] = await db.query(sql, values);
  return result;
};

const getPasswordByStudentId = async (studentId) => {
  const [rows] = await db.query(
    'SELECT password FROM students WHERE student_id = ? LIMIT 1',
    [studentId]
  );
  if (rows.length === 0) return null;
  return rows[0].password;
};

const updatePassword = async (studentId, hashedPassword) => {
  const [result] = await db.query(
    'UPDATE students SET password = ? WHERE student_id = ?',
    [hashedPassword, studentId]
  );
  return result;
};

const updateAuthStudent = async (id, auth) => {
  const [result] = await db.query(
    'UPDATE students SET auth = ? WHERE student_id  = ?',
    [auth, id]
  );
  return result;
};

const getStudentById = async (student_id) => {
  const [rows] = await db.execute('SELECT * FROM students WHERE student_id = ?', [student_id]);
  return rows[0];
};
const insertStudentRequest = async ({ student_id, volunteered_id, absence_requests_id, date_requested, event_id }) => {
  const [result] = await db.query(
    `INSERT INTO student_request (student_id, volunteered_id, absence_requests_id, date_requested, id)
     VALUES (?, ?, ?, ?, ?)`,
    [student_id, volunteered_id, absence_requests_id, date_requested, event_id]
  );
  return result;
};


module.exports = {
  createStudent,
  insertStudentRequest,
  getAllStudents,
  deactivateStudent,
  updateStatus,
  updateStudent,
  getPasswordByStudentId,
  updatePassword,
  updateAuthStudent,
  getStudentById
};
