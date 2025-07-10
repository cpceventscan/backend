const db = require('../config/db');

const createYearLevel = async (courseId, yearLevel) => {
  const [result] = await db.execute(
    'INSERT INTO year_levels (course_id, year_level) VALUES (?, ?)',
    [courseId, yearLevel]
  );
  return result;
};

const getAllYearLevels = async () => {
  const [rows] = await db.execute(`
    SELECT y.year_id AS YearID, c.course_id AS CourseID, c.course_code AS CourseCode, y.year_level AS YearLvl
    FROM year_levels y
    JOIN courses c ON y.course_id = c.course_id;
  `);
  return rows;
};

const updateYearLevel = async (yearID, courseID, yearLvl) => {
  const [result] = await db.query(
    'UPDATE year_levels SET course_id  = ?, year_level  = ? WHERE year_id  = ?',
    [courseID, yearLvl, yearID]
  );
  return result;
};
module.exports = { createYearLevel, getAllYearLevels, updateYearLevel};
