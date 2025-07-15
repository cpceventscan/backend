class Event {
  constructor(db) {
    this.db = db;
  }

  async create(eventData) {
    const query = `
      INSERT INTO events (
        event_name, event_description, event_location, start_date_time, end_date_time,
        selection_mode, selected_course, selected_students, event_program_attachment,
        event_note, event_reminder, call_to_action_buttons_instruction,
        volunteer_application, absence_request, attendance_controls, custom_notification,
        mid_event_check, qr_code_option, location_perimeter
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      eventData.eventName,
      eventData.event_description,
      eventData.event_location,
      eventData.start_date_time,
      eventData.end_date_time,
      eventData.selection_mode,
      eventData.selected_course,
      eventData.selected_students ? JSON.stringify(eventData.selected_students) : null,
      eventData.event_program_attachment,
      eventData.event_note,
      eventData.event_reminder,
      eventData.call_to_action_buttons_instruction,
      eventData.volunteer_application,
      eventData.absence_request,
      eventData.attendance_controls,
      eventData.custom_notification,
      eventData.mid_event_check,
      eventData.qr_code_option,
      eventData.location_perimeter || null
    ];

    const [result] = await this.db.query(query, values);
    return result.insertId;
  }

  async updateQRCodePath(eventId, qrPath) {
    const query = `UPDATE events SET qr_code_image = ? WHERE id = ?`;
    await this.db.query(query, [qrPath, eventId]);
  }
  async delete(eventId) {
    const query = 'DELETE FROM events WHERE id = ?';
    const [result] = await this.db.query(query, [eventId]);
    return result;
  }

  async update(eventId, eventData) {
    const query = `
      UPDATE events SET
        event_name = ?,
        event_description = ?,
        event_location = ?,
        start_date_time = ?,
        end_date_time = ?,
        selection_mode = ?,
        selected_course = ?,
        selected_students = ?,
        event_program_attachment = ?,
        event_note = ?,
        event_reminder = ?,
        call_to_action_buttons_instruction = ?,
        volunteer_application = ?,
        absence_request = ?,
        attendance_controls = ?,
        custom_notification = ?,
        mid_event_check = ?,
        qr_code_option = ?
      WHERE id = ?
    `;

    const values = [
      eventData.event_name,
      eventData.event_description,
      eventData.event_location,
      eventData.start_date_time,
      eventData.end_date_time,
      eventData.selection_mode,
      eventData.selected_course,
      eventData.selected_students || null, // <--- FIXED
      eventData.event_program_attachment,
      eventData.event_note,
      eventData.event_reminder,
      eventData.call_to_action_buttons_instruction,
      eventData.volunteer_application,
      eventData.absence_request,
      eventData.attendance_controls,
      eventData.custom_notification,
      eventData.mid_event_check,
      eventData.qr_code_option,
      eventId
    ];

    const [result] = await this.db.query(query, values);

    if (result.affectedRows === 0) {
      throw new Error(`No event updated. Event ID ${eventId} may not exist.`);
    }

    return result;
  }


}

module.exports = Event;

   