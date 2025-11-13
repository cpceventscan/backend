const moment = require('moment-timezone');
const db = require('../config/db');

function getPHTime() {
  return moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');
}

// Create attendance record
function createAttendance(student_id, event_id) {
  return db.execute(
    'INSERT INTO event_attendance (student_id, id) VALUES (?, ?)',
    [student_id, event_id]
  );
}

// Update time in
function updateTimeIn(attendance_id) {
  const phTime = getPHTime();
  return db.execute(
    'UPDATE event_attendance SET time_in = ? WHERE attendance_id = ?',
    [phTime, attendance_id]
  );
}

// Update trivia time in
function updateTriviaTimeIn(attendance_id) {
  const phTime = getPHTime();
  return db.execute(
    'UPDATE event_attendance SET trivia_time_in = ? WHERE attendance_id = ?',
    [phTime, attendance_id]
  );
}

// Update time out
function updateTimeOut(attendance_id) {
  const phTime = getPHTime();
  return db.execute(
    'UPDATE event_attendance SET time_out = ? WHERE attendance_id = ?',
    [phTime, attendance_id]
  );
}

// Update afternoon time in
function updateAfternoonTimeIn(attendance_id) {
  const phTime = getPHTime();
  return db.execute(
    'UPDATE event_attendance SET afternoon_time_in = ? WHERE attendance_id = ?',
    [phTime, attendance_id]
  );
}

// Update afternoon trivia time in
function updateAfternoonTriviaTimeIn(attendance_id) {
  const phTime = getPHTime();
  return db.execute(
    'UPDATE event_attendance SET afternoon_trivia_time_in = ? WHERE attendance_id = ?',
    [phTime, attendance_id]
  );
}

// Update afternoon time out
function updateAfternoonTimeOut(attendance_id) {
  const phTime = getPHTime();
  return db.execute(
    'UPDATE event_attendance SET afternoon_time_out = ? WHERE attendance_id = ?',
    [phTime, attendance_id]
  );
}
// Get attendance by event and optional student
function getByEvent(event_id, student_id = null) {
  let sql = 'SELECT * FROM event_attendance WHERE id = ?';
  const params = [event_id];
  if (student_id) {
    sql += ' AND student_id = ?';
    params.push(student_id);
  }
  return db.execute(sql, params);
}

function getBystudEvent(event_id, student_id) {
  if (!event_id || !student_id) {
    return Promise.reject(new Error('Missing event_id or student_id'));
  }

  const sql = 'SELECT * FROM event_attendance WHERE student_id = ? AND id = ?';
  return db.execute(sql, [student_id, event_id]);
}

function getByStudent(student_id) {
  return db.execute(
    `SELECT ea.attendance_id, e.event_name AS eventName, DATE_FORMAT(e.start_date_time, '%b %d, %Y') AS date,
            ea.time_in AS timeIn, ea.time_out AS timeOut, ea.remarks,
            CASE ea.status
                WHEN 1 THEN 'cleared'
                ELSE 'unsettled'
            END AS status
     FROM event_attendance ea
     JOIN events e ON ea.id = e.id
     WHERE ea.student_id = ?`,
    [student_id]
  );
}

function getEventAttendanceSummary() {
  return db.execute(
    `SELECT 
    e.id AS eventID,
    e.event_name AS eventName,
    DATE_FORMAT(e.start_date_time, '%Y-%m-%d') AS eventDate,
    e.start_date_time,
    e.end_date_time,

    CASE 
        WHEN NOW() > e.end_date_time THEN 'Completed'
        WHEN NOW() BETWEEN e.start_date_time AND e.end_date_time THEN 'Ongoing'
        ELSE 'Upcoming'
    END AS eventStats,

    -- ✅ Total students who have attendance or absence record
    COUNT(DISTINCT ea.student_id) AS totalAttendees,

    -- ✅ Complete attendance: all times present
    SUM(CASE 
        WHEN ea.time_in IS NOT NULL 
         AND ea.time_out IS NOT NULL 
         AND ea.trivia_time_in IS NOT NULL 
        THEN 1 
        ELSE 0 
    END) AS completeAttendance,

    -- ✅ Incomplete attendance: partial attendance
    SUM(CASE 
        WHEN (ea.time_in IS NOT NULL OR ea.time_out IS NOT NULL OR ea.trivia_time_in IS NOT NULL)
         AND NOT (ea.time_in IS NOT NULL 
              AND ea.time_out IS NOT NULL 
              AND ea.trivia_time_in IS NOT NULL)
        THEN 1 
        ELSE 0 
    END) AS incompleteAttendance,

    -- ✅ Absence: no attendance record AND (optional) absence request logic
    SUM(CASE 
        WHEN ea.attendance_id IS NULL 
             AND sr.request_id IS NULL 
        THEN 0  -- No attendance and no absence request → not counted
        WHEN ea.attendance_id IS NULL 
             AND sr.request_id IS NOT NULL 
        THEN 1  -- Absence request exists → count as absence
        WHEN ea.time_in IS NULL 
             AND ea.time_out IS NULL 
             AND ea.trivia_time_in IS NULL 
        THEN 1  -- No check-ins → absence
        ELSE 0 
    END) AS totalAbsences,

    COUNT(ea.attendance_id) AS totalRecords

FROM events e
LEFT JOIN event_attendance ea 
    ON ea.id = e.id
LEFT JOIN student_request sr 
    ON sr.id = e.id 
   AND sr.status IN (0, 1, 2)  -- Pending, Approved, or Rejected (adjust as needed)
GROUP BY e.id, e.event_name, e.start_date_time, e.end_date_time
ORDER BY e.start_date_time DESC;;
`
  );
}

function getEventDetails(event_id) {
  return db.execute(
    `SELECT 
    ea.attendance_id,
    ev.*,
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS studName,
    CONCAT(c.course_code, ' ', y.year_level, ' ', sec.section_name) AS progYearSec,

    -- Morning times
    DATE_FORMAT(ea.time_in, '%h:%i %p') AS timeIn,
    CASE 
        WHEN ea.trivia_time_in = '1900-01-01 00:00:00' THEN 'Missed'
        ELSE DATE_FORMAT(ea.trivia_time_in, '%h:%i %p')
    END AS midEventcheck,
    DATE_FORMAT(ea.time_out, '%h:%i %p') AS timeOut,

    -- Afternoon times
    DATE_FORMAT(ea.afternoon_time_in, '%h:%i %p') AS afternoontimeIn,
    CASE 
        WHEN ea.afternoon_trivia_time_in = '1900-01-01 00:00:00' THEN 'Missed'
        ELSE DATE_FORMAT(ea.afternoon_trivia_time_in, '%h:%i %p')
    END AS afternoonmidEventcheck,
    DATE_FORMAT(ea.afternoon_time_out, '%h:%i %p') AS afternoontimeOut,

    -- Absence request status
    CASE 
        WHEN sr.absence_requests_id IS NOT NULL THEN
            CASE sr.status
                WHEN 2 THEN 'Rejected'
                WHEN 1 THEN 'Approved'
                WHEN 0 THEN 'Pending'
                ELSE 'N/A'
            END
        ELSE 'N/A'
    END AS absenceReqStatus,

    -- Volunteer application status
    CASE 
        WHEN sr.volunteered_id IS NOT NULL THEN
            CASE sr.status
                WHEN 2 THEN 'Rejected'
                WHEN 1 THEN 'Approved'
                WHEN 0 THEN 'Pending'
                ELSE 'N/A'
            END
        ELSE 'N/A'
    END AS volunteerReqStatus,

    sr.volunteered_id AS volunteerAppId,
    sr.absence_requests_id AS absence_requests_id,

    -- Remarks logic with absence request override
    CASE 
        WHEN sr.absence_requests_id IS NOT NULL AND sr.status = 1 THEN 'Excused'
        WHEN ea.time_in IS NOT NULL 
         AND ea.trivia_time_in IS NOT NULL 
         AND ea.time_out IS NOT NULL 
         AND ea.afternoon_time_in IS NOT NULL 
         AND ea.afternoon_trivia_time_in IS NOT NULL 
         AND ea.afternoon_time_out IS NOT NULL 
        THEN 'Present'
        WHEN ev.end_date_time < NOW() 
         AND ea.time_in IS NULL 
         AND ea.trivia_time_in IS NULL 
         AND ea.time_out IS NULL 
         AND ea.afternoon_time_in IS NULL 
         AND ea.afternoon_trivia_time_in IS NULL 
         AND ea.afternoon_time_out IS NULL 
        THEN 'Missed'
        ELSE ea.remarks
    END AS remarks,

    -- Attendance Status with absence request override
    CASE 
        WHEN sr.absence_requests_id IS NOT NULL AND sr.status = 1 THEN 'Settled'
        WHEN ea.status = 1 THEN 'Settled'
        WHEN ea.status = 2 THEN 'Excused'
        ELSE 'Unsettled'
    END AS attendanceStats,

    CASE
        WHEN ea.status != 1 THEN 1
        ELSE 0
    END AS canSettle

FROM event_attendance ea
JOIN students s ON ea.student_id = s.student_id
LEFT JOIN courses c ON s.course_id = c.course_id
LEFT JOIN year_levels y ON s.year_id = y.year_id
LEFT JOIN sections sec ON s.section_id = sec.section_id
JOIN events ev ON ea.id = ev.id
LEFT JOIN student_request sr 
       ON ea.student_id = sr.student_id 
WHERE ea.id = ?
GROUP BY ea.student_id;
;
`,
    [event_id]
  );
}
function settleAttendance(attendance_id) {
  return db.execute(
    'UPDATE event_attendance SET status = 1 WHERE attendance_id = ?',
    [attendance_id]
  );
}
function getAllAttendanceControls() {
  return db.execute(
    `SELECT 
        ac.id AS controlID,
        ac.event_id,
        e.event_name AS eventName,
        DATE_FORMAT(e.start_date_time, '%Y-%m-%d') AS eventDate,
        ac.morning_time_in,
        ac.morning_mid_event,
        ac.morning_time_out,
        ac.afternoon_time_in,
        ac.afternoon_mid_event,
        ac.afternoon_time_out,
        ac.feedback_form
     FROM attendance_controls ac
     JOIN events e ON ac.event_id = e.id
     ORDER BY e.start_date_time DESC`
  );
}

function getAttendanceControlsByEvent(event_id) {
  return db.execute(
    `SELECT 
        ac.id AS controlID,
        ac.event_id,
        e.event_name AS eventName,
        DATE_FORMAT(e.start_date_time, '%Y-%m-%d') AS eventDate,
        ac.morning_time_in,
        ac.morning_mid_event,
        ac.morning_time_out,
        ac.afternoon_time_in,
        ac.afternoon_mid_event,
        ac.afternoon_time_out,
        ac.feedback_form
     FROM attendance_controls ac
     JOIN events e ON ac.event_id = e.id
     WHERE e.id = ?
     ORDER BY e.start_date_time DESC`,
    [event_id]
  );
}

function updateAttendanceControls(eventID, settings) {
  // settings already have keys like 'morning_time_in', 'morning_mid_event'
  const mappedSettings = {
    morning_time_in: settings.morning_time_in ? 1 : 0,
    morning_mid_event: settings.morning_mid_event ? 1 : 0,
    morning_time_out: settings.morning_time_out ? 1 : 0,
    afternoon_time_in: settings.afternoon_time_in ? 1 : 0,
    afternoon_mid_event: settings.afternoon_mid_event ? 1 : 0,
    afternoon_time_out: settings.afternoon_time_out ? 1 : 0,
    feedback_form: settings.feedback_form ? 1 : 0,
  };
  

  return db.execute(
    `UPDATE attendance_controls SET 
       morning_time_in = ?, 
       morning_mid_event = ?, 
       morning_time_out = ?, 
       afternoon_time_in = ?, 
       afternoon_mid_event = ?, 
       afternoon_time_out = ?, 
       feedback_form = ? 
     WHERE event_id = ?`,
    [
      mappedSettings.morning_time_in,
      mappedSettings.morning_mid_event,
      mappedSettings.morning_time_out,
      mappedSettings.afternoon_time_in,
      mappedSettings.afternoon_mid_event,
      mappedSettings.afternoon_time_out,
      mappedSettings.feedback_form,
      eventID
    ]
  );
}
// Mark morning trivia as missed for a specific student
function updateMorningTriviaMissed(attendanceId) {
  return db.execute(
    "UPDATE event_attendance SET trivia_time_in = '1900-01-01 00:00:00' WHERE attendance_id = ?",
    [attendanceId]
  );
}

// Mark afternoon trivia as missed for a specific student
function updateAfternoonTriviaMissed(attendanceId) {
  return db.execute(
    "UPDATE event_attendance SET afternoon_trivia_time_in = '1900-01-01 00:00:00' WHERE attendance_id = ?",
    [attendanceId]
  );
}

module.exports = {
  createAttendance,
  updateTimeIn,
  updateTriviaTimeIn,
  updateTimeOut,
  getByEvent,
  getByStudent,
  getEventAttendanceSummary,
  getEventDetails,
  settleAttendance,
  getBystudEvent,
  getAllAttendanceControls,
  updateAttendanceControls,
  updateAfternoonTimeIn,
  updateAfternoonTriviaTimeIn,
  updateAfternoonTimeOut,
  getAttendanceControlsByEvent,
  updateMorningTriviaMissed,
  updateAfternoonTriviaMissed
};

