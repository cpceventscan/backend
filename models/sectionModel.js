const db = require('../config/db');

const SectionModel = {
    createSection: async (courseId, yearId, sectionName) => {
        const [result] = await db.execute(
        'INSERT INTO sections (course_id, year_id, section_name) VALUES (?, ?, ?)',
        [courseId, yearId, sectionName]
        );
        return result;
    },

    getSections: async () => {
        const [rows] = await db.execute(`
        SELECT s.section_id, c.course_code, c.course_id, y.year_id, y.year_level, s.section_name
        FROM sections s
        JOIN courses c ON s.course_id = c.course_id
        JOIN year_levels y ON s.year_id = y.year_id
        `);
        return rows;
    },

    updateSection: async (sectionId, courseId, yearId, sectionName) => {
        const [result] = await db.execute(
            'UPDATE sections SET course_id = ?, year_id = ?, section_name = ? WHERE section_id = ?',
            [courseId, yearId, sectionName, sectionId]
        );
        return result;
    },

};

module.exports = SectionModel;