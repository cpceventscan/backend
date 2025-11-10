const db = require('../config/db');

const SectionModel = {
    createSection: async (sectionName) => {
        const [result] = await db.execute(
        'INSERT INTO sections (section_name) VALUES (?)',
        [sectionName]
        );
        return result;
    },

    getSections: async () => {
        const [rows] = await db.execute(`
        SELECT s.section_id, s.section_name
        FROM sections s
        `);
        return rows;
    },

    updateSection: async (sectionId, sectionName) => {
        const [result] = await db.execute(
            'UPDATE sections SET section_name = ? WHERE section_id = ?',
            [sectionName, sectionId]
        );
        return result;
    },

};

module.exports = SectionModel;