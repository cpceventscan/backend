const courseModel = require('../models/courseModel');
const db = require('../config/db');

const registerCourse = async (req, res) => {
  try {
    const { course_code, course_name } = req.body;
    const id = await courseModel.createCourse({ course_code, course_name });
    res.status(201).json({ message: 'Course registered successfully', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register course' });
  }
};

const getCourses = async (req, res) => {
  try {
    const courses = await courseModel.getAllCourses();
    res.json({ courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { CourseCode, CourseName } = req.body;

  if (!CourseCode || !CourseName) {
    return res.status(400).json({ error: 'Both fields are required' });
  }

  try {
    const result = await courseModel.updateCourse(id, { CourseCode, CourseName });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ error: 'Database Error' });
  }
};

// Count total courses
const countCourses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM courses');
    res.json({ total: rows[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error counting courses' });
  }
};


module.exports = {
  countCourses,
  registerCourse,
  getCourses,
  updateCourse
};
