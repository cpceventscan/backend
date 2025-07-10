const SectionModel = require('../models/sectionModel');

const SectionController = {
  createSection: async (req, res) => {
    const { courseId, yearId, sectionName } = req.body;
    try {
      const result = await SectionModel.createSection(courseId, yearId, sectionName);
      res.json({ message: 'Section created successfully.', id: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create section.' });
    }
  },

  getSections: async (_req, res) => {
    try {
      const sections = await SectionModel.getSections();
      res.json({ sections });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch sections.' });
    }
  },

    updateSection: async (req, res) => {
        const { sectionId } = req.params;
        const { courseId, yearId, sectionName } = req.body;

        try {
            await SectionModel.updateSection(sectionId, courseId, yearId, sectionName);
            res.status(200).json({ message: 'Section updated successfully.' });
        } catch (error) {
            console.error('Error updating section:', error);
            res.status(500).json({ message: 'Failed to update section.' });
        }
    }
};

module.exports = SectionController;
