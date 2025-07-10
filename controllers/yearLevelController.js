const YearLevelModel = require('../models/yearLevelModel');

const addYearLevel = async (req, res) => {
  const { courseId, yearLevel } = req.body;

  if (!courseId || !yearLevel) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await YearLevelModel.createYearLevel(courseId, yearLevel);
    res.json({ message: 'Year level added successfully', result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

const getAllYears = async (req, res) => {
  try {
    const yearLevels = await YearLevelModel.getAllYearLevels();
    res.json({ yearLevels });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database Error' });
  }
};

const updateYearLevel = async (req, res) => {
  const yearID = req.params.yearID;
  const { courseId, yearLevel } = req.body;

  if (!yearID || !courseId || !yearLevel) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await YearLevelModel.updateYearLevel(yearID, courseId, yearLevel);
    res.json({ message: 'Year level updated successfully', result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update year level' });
  }
};
module.exports = { addYearLevel, getAllYears, updateYearLevel };
