const db = require('../config/db');

// Get all student requests (existing)
const getAllStudentRequests = async (req, res) => {
  try {
    // Fetch all absence requests
    const [absences] = await db.query(`
      SELECT 
        sr.absence_requests_id AS reqIDID,
        s.first_name,
        s.middle_name,
        s.last_name AS studNameName,
        CONCAT(c.course_code, ' ', y.year_level, sct.section_name) AS eprogYearSec,
        'Absence' AS reqType,
        ar.submission_date AS reqDate,
        ar.*,
        sr.status AS reqstats,
        sr.id AS eventID,
        sr.request_id
      FROM student_request sr
      JOIN absence_requests ar 
          ON sr.absence_requests_id = ar.absence_requests_id
      JOIN students s 
          ON sr.student_id = s.student_id
      JOIN courses c 
          ON s.course_id = c.course_id
      JOIN year_levels y
          ON s.year_id = y.year_id
      JOIN sections sct
          ON s.section_id = sct.section_id
    `);

    // Fetch all volunteer requests
    const [volunteers] = await db.query(`
      SELECT 
        sr.volunteered_id AS reqIDID,
        s.first_name,
        s.middle_name,
        s.last_name AS studNameName,
        CONCAT(c.course_code, ' ', y.year_level, sct.section_name) AS eprogYearSec,
        'Volunteer' AS reqType,
        v.created_at AS reqDate,
        v.*,
        sr.status AS reqstats,
        sr.id AS eventID,
        sr.request_id
      FROM student_request sr
      JOIN volunteers v 
          ON sr.volunteered_id = v.volunteered_id
      JOIN students s 
          ON sr.student_id = s.student_id
      JOIN courses c 
          ON s.course_id = c.course_id
      JOIN year_levels y
          ON s.year_id = y.year_id
      JOIN sections sct
          ON s.section_id = sct.section_id
    `);

    const allRequests = [...absences, ...volunteers].sort(
      (a,b) => new Date(b.reqDate) - new Date(a.reqDate)
    );

    res.json(allRequests);
  } catch (error) {
    console.error('❌ Error fetching student requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateRequestStatus = async (req, res) => {
  const { request_id } = req.params; // matches your route: /requests/:request_id
  const { reqstats } = req.body;     // could be string or number

  try {
    let statusNum;
    let statusText;

    switch(reqstats) {
      case 'Approved':
      case 1:
        statusNum = 1;
        statusText = 'approved';
        break;
      case 'Rejected':
      case 2:
        statusNum = 2;
        statusText = 'rejected';
        break;
      default:
        statusNum = 0;
        statusText = 'pending';
    }

    const sql = `UPDATE student_request SET status = ? WHERE request_id = ?`;
    const [result] = await db.query(sql, [statusNum, request_id]);

    if(result.affectedRows === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ message: `Request ${statusText} successfully.` });
  } catch (error) {
    console.error('❌ Error updating request status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllStudentRequests,
  updateRequestStatus
};
