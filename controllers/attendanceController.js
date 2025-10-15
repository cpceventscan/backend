const attendanceModel = require('../models/attendanceModel');

// ✅ Create a new attendance (if needed)
exports.create = async (req, res) => {
  try {
    const { studentId, eventId } = req.body;
    if (!studentId || !eventId) {
      return res.status(400).json({ error: 'studentId and eventId are required' });
    }

    const [existing] = await attendanceModel.getByEvent(eventId, studentId);
    if (existing.length > 0) {
      return res.status(200).json({ message: 'Attendance already exists', attendance: existing[0] });
    }

    const [result] = await attendanceModel.createAttendance(studentId, eventId);
    res.json({ message: 'Attendance created', attendanceId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Time in
exports.timeIn = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { studentId } = req.body;

    const [records] = await attendanceModel.getByEvent(event_id, studentId);
    if (records.length === 0) return res.status(404).json({ error: 'Attendance not found' });

    const attendanceId = records[0].attendance_id;
    await attendanceModel.updateTimeIn(attendanceId);
    res.json({ message: 'Time in updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Trivia time in
exports.triviaTimeIn = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { studentId } = req.body;

    const [records] = await attendanceModel.getByEvent(event_id, studentId);
    if (records.length === 0) return res.status(404).json({ error: 'Attendance not found' });

    const attendanceId = records[0].attendance_id;
    await attendanceModel.updateTriviaTimeIn(attendanceId);
    res.json({ message: 'Trivia time in updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Time out
exports.timeOut = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { studentId } = req.body;

    const [records] = await attendanceModel.getByEvent(event_id, studentId);
    if (records.length === 0) return res.status(404).json({ error: 'Attendance not found' });

    const attendanceId = records[0].attendance_id;
    await attendanceModel.updateTimeOut(attendanceId);
    res.json({ message: 'Time out updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Check attendance
exports.checkAttendance = async (req, res) => {
  try {
    const { event_id } = req.params;
    // Assuming req.session contains logged-in student info
    const studentId = req.session?.student?.student_id

    if (!studentId || !event_id) {
      return res.status(400).json({ error: 'Missing event_id or student not logged in' });
    }

    const [records] = await attendanceModel.getBystudEvent(event_id, studentId);
    if (records.length === 0) return res.status(404).json({ error: 'Attendance not found' });

    res.json({ attendance: records[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all attendance for event
exports.getByEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const [records] = await attendanceModel.getByEvent(id);
    res.json({ attendance: records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
exports.getMyAttendance = async (req, res) => {
  try {
    if (!req.session.student) {
      return res.status(401).json({ error: 'Not logged in' });
    }

    const studentId = req.session.student.student_id ;
    const [records] = await attendanceModel.getByStudent(studentId);
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
exports.getEventAttendanceSummary = async (req, res) => {
  try {
    const [records] = await attendanceModel.getEventAttendanceSummary();
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
exports.getEventDetails = async (req, res) => {
  try {
    const { event_id } = req.params; // correct parameter name
    const [records] = await attendanceModel.getEventDetails(event_id);

    if (records.length === 0) {
      return res.status(404).json({ message: 'No attendance records found for this event.' });
    }

    res.json({ attendanceDetails: records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
exports.settleAttendance = async (req, res) => {
  try {
    const { attendance_id } = req.params;
    if (!attendance_id) {
      return res.status(400).json({ error: 'attendance_id required' });
    }

    await attendanceModel.settleAttendance(attendance_id);
    res.json({ message: 'Attendance settled successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
exports.getAttendanceControls = async (req, res) => {
  try {
    const [records] = await attendanceModel.getAllAttendanceControls();

    const controls = records.map(r => ({
      controlID: r.controlID,
      eventID: r.event_id,
      eventName: r.eventName,
      eventDate: r.eventDate,
      enabledControl: [
        r.morning_time_in ? 'Morning Time In' : null,
        r.morning_mid_event ? 'Morning Mid Event' : null,
        r.morning_time_out ? 'Morning Time Out' : null,
        r.afternoon_time_in ? 'Afternoon Time In' : null,
        r.afternoon_mid_event ? 'Afternoon Mid Event' : null,
        r.afternoon_time_out ? 'Afternoon Time Out' : null,
        r.feedback_form ? 'Feedback Form' : null
      ].filter(Boolean).join(', '),
      settings: {   // <<< add this
        morning_time_in: r.morning_time_in,
        morning_mid_event: r.morning_mid_event,
        morning_time_out: r.morning_time_out,
        afternoon_time_in: r.afternoon_time_in,
        afternoon_mid_event: r.afternoon_mid_event,
        afternoon_time_out: r.afternoon_time_out,
        feedback_form: r.feedback_form
      }
    }));

    res.json({ attendanceControls: controls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAttendanceControlsbyevent = async (req, res) => {
  try {
    const { eventID } = req.params;

    if (!eventID) {
      return res.status(400).json({ error: 'Missing event_id parameter' });
    }

    const [records] = await attendanceModel.getAttendanceControlsByEvent(eventID);

    if (!records.length) {
      return res.status(404).json({ message: 'No attendance controls found for this event' });
    }

    const controls = records.map(r => ({
      controlID: r.controlID,
      eventID: r.event_id,
      eventName: r.eventName,
      eventDate: r.eventDate,
      enabledControl: [
        r.morning_time_in ? 'Morning Time In' : null,
        r.morning_mid_event ? 'Morning Mid Event' : null,
        r.morning_time_out ? 'Morning Time Out' : null,
        r.afternoon_time_in ? 'Afternoon Time In' : null,
        r.afternoon_mid_event ? 'Afternoon Mid Event' : null,
        r.afternoon_time_out ? 'Afternoon Time Out' : null,
        r.feedback_form ? 'Feedback Form' : null
      ].filter(Boolean).join(', '),
      settings: {
        morning_time_in: r.morning_time_in,
        morning_mid_event: r.morning_mid_event,
        morning_time_out: r.morning_time_out,
        afternoon_time_in: r.afternoon_time_in,
        afternoon_mid_event: r.afternoon_mid_event,
        afternoon_time_out: r.afternoon_time_out,
        feedback_form: r.feedback_form
      }
    }));

    res.json({ attendanceControls: controls });
  } catch (err) {
    console.error('Error fetching attendance controls:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateControls = async (req, res) => {
  try {
    const { eventID } = req.params;
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ message: 'Invalid settings payload' });
    }

    await attendanceModel.updateAttendanceControls(eventID, settings);
    res.json({ message: 'Attendance controls updated successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
// ✅ Afternoon time in
exports.afternoonTimeIn = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { studentId } = req.body;

    const [records] = await attendanceModel.getByEvent(event_id, studentId);
    if (records.length === 0) return res.status(404).json({ error: 'Attendance not found' });

    const attendanceId = records[0].attendance_id;
    await attendanceModel.updateAfternoonTimeIn(attendanceId);
    res.json({ message: 'Afternoon time in updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Afternoon trivia time in
exports.afternoonTrivia = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { studentId } = req.body;

    const [records] = await attendanceModel.getByEvent(event_id, studentId);
    if (records.length === 0) return res.status(404).json({ error: 'Attendance not found' });

    const attendanceId = records[0].attendance_id;
    await attendanceModel.updateAfternoonTriviaTimeIn(attendanceId);
    res.json({ message: 'Afternoon trivia time in updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Afternoon time out
exports.afternoonTimeOut = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { studentId } = req.body;

    const [records] = await attendanceModel.getByEvent(event_id, studentId);
    if (records.length === 0) return res.status(404).json({ error: 'Attendance not found' });

    const attendanceId = records[0].attendance_id;
    await attendanceModel.updateAfternoonTimeOut(attendanceId);
    res.json({ message: 'Afternoon time out updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Mark trivia as missed (only for this student)
exports.markTriviaMissed = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { studentId, period } = req.body; // period = 'morning' or 'afternoon'

    if (!studentId || !event_id || !period) {
      return res.status(400).json({ error: 'Missing event_id, studentId, or period' });
    }

    const [records] = await attendanceModel.getByEvent(event_id, studentId);
    if (records.length === 0) {
      return res.status(404).json({ error: 'Attendance not found for this student.' });
    }

    const attendanceId = records[0].attendance_id;

    if (period === 'morning') {
      await attendanceModel.updateMorningTriviaMissed(attendanceId);
    } else if (period === 'afternoon') {
      await attendanceModel.updateAfternoonTriviaMissed(attendanceId);
    } else {
      return res.status(400).json({ error: 'Invalid period value' });
    }

    res.json({ message: `Trivia marked as missed for ${period} period (student ${studentId}).` });
  } catch (err) {
    console.error('❌ Error marking trivia missed:', err);
    res.status(500).json({ error: err.message });
  }
};


