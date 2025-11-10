const db = require('../config/db');

const createYearLevel = async (yearLevel) => {
  const [result] = await db.execute(
    'INSERT INTO year_levels ( year_level) VALUES (?)',
    [yearLevel]
  );
  return result;
};

const getAllYearLevels = async () => {
  const [rows] = await db.execute(`
    SELECT y.year_id AS YearID, y.year_level AS YearLvl
    FROM year_levels y
  `);
  return rows;
};

const updateYearLevel = async (yearID, yearLvl) => {
  const [result] = await db.query(
    'UPDATE year_levels SET year_level  = ? WHERE year_id  = ?',
    [yearLvl, yearID]
  );
  return result;
};
module.exports = { createYearLevel, getAllYearLevels, updateYearLevel};
