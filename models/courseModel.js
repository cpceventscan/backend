const db = require('../config/db');  

const createCourse = async (course) => {
  const [result] = await db.execute(
    'INSERT INTO courses (course_code, course_name) VALUES (?, ?)',
    [course.course_code, course.course_name]
  );
  return result.insertId;
};

const getAllCourses = async () => {
  const [rows] = await db.execute('SELECT * FROM courses');
  return rows;
};

const updateCourse = async (id, courseData) => {
  const [result] = await db.execute(
    'UPDATE courses SET course_code = ?, course_name = ? WHERE course_id = ?',
    [courseData.CourseCode, courseData.CourseName, id]
  );
  return result;
};

module.exports = {
  createCourse,
  getAllCourses,
  updateCourse
};
