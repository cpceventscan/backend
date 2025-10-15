const db = require('../config/db');

const saveFaceImage = async (studentId, image, luxandId = null) => {
  try {
    const sql = `
      INSERT INTO face_images (student_id, image, luxand_id)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE image = VALUES(image), luxand_id = VALUES(luxand_id)
    `;
    console.log('Running SQL:', sql);
    console.log('With params:', [studentId, image, luxandId]);

    const [result] = await db.query(sql, [studentId, image, luxandId]);
    console.log('Database result:', result);
    return result.insertId;
  } catch (err) {
    console.error('Database error:', err);
    throw err;
  }
};


const getFaceImageByStudentId = async (studentId) => {
  const sql = `SELECT image, luxand_id FROM face_images WHERE student_id = ? LIMIT 1`;
  const [rows] = await db.query(sql, [studentId]);
  if (!rows.length) return null;
  return rows[0]; // return both image and luxand_id
};

const getAllFaces = async () => {
  const sql = `
    SELECT 
      f.id,
      f.student_id,
      f.image,
      f.created_at,
      s.*,
      c.course_code AS course,
      CONCAT(y.year_level, ' ', sec.section_name) AS yearSection
    FROM face_images f
    INNER JOIN students s ON f.student_id = s.student_id
    LEFT JOIN courses c ON s.course_id = c.course_id
    LEFT JOIN year_levels y ON s.year_id = y.year_id
    LEFT JOIN sections sec ON s.section_id = sec.section_id
    ORDER BY f.created_at DESC
  `;
  const [rows] = await db.query(sql);
  return rows;
};

// New: Delete face by student ID
const deleteFaceByStudentId = async (studentId) => {
  const sql = `DELETE FROM face_images WHERE student_id = ?`;
  const [result] = await db.query(sql, [studentId]);
  return result.affectedRows;
};

module.exports = { saveFaceImage, getFaceImageByStudentId, getAllFaces, deleteFaceByStudentId };
