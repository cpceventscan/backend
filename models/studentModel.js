const db = require('../config/db');

const createStudent = async (student) => {
  const sql = `
    INSERT INTO students
    (student_id, last_name, first_name, middle_name, birthday, sex, age, course, year_level, section, email, password)
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
    student.course,
    student.year_level,
    student.section,
    student.email,
    student.password,
  ]);
  return result.insertId;
};

const getAllStudents = async () => {
  const [rows] = await db.query('SELECT * FROM students');
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


module.exports = { createStudent, getAllStudents, deactivateStudent, updateStatus };
