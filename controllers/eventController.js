const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Event = require('../models/event');
const db = require('../config/db');

const eventModel = new Event(db);

// --- CREATE EVENT ---
const createEvent = async (req, res) => {
  try {
    const eventData = req.body;
    const eventId = await eventModel.create(eventData);

    // Handle media upload
    if (eventData.event_program_attachment && eventData.event_program_attachment.startsWith('data:')) {
      const uploadDir = path.join(__dirname, '../uploads/events');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const matches = eventData.event_program_attachment.match(/^data:(.+);base64,(.+)$/);
      if (!matches) throw new Error('Invalid base64 string');
      const ext = matches[1].split('/')[1];
      const buffer = Buffer.from(matches[2], 'base64');

      const fileName = `event-program-${eventId}.${ext}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      const relativePath = `uploads/events/${fileName}`;
      await eventModel.update(eventId, { event_program_attachment: relativePath });
    }

    // QR code generation if automatic
    if (eventData.qr_code_option === 'automatic') {
      const qrFolder = path.join(__dirname, '../uploads/qr');
      if (!fs.existsSync(qrFolder)) fs.mkdirSync(qrFolder, { recursive: true });

      const qrPath = path.join(qrFolder, `event-${eventId}.png`);
      await QRCode.toFile(qrPath, `${eventId}`);
      await eventModel.updateQRCodePath(eventId, `/uploads/qr/event-${eventId}.png`);
    }

    res.status(201).json({ id: eventId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
};

// --- UPDATE EVENT ---
const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventData = req.body;

    // Fetch current event
    const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!rows[0]) return res.status(404).json({ message: 'Event not found' });
    const current = rows[0];

    // --- Handle new program file ---
    let programPath = current.event_program_attachment; // default to current

    if (eventData.event_program_attachment && eventData.event_program_attachment.startsWith('data:')) {
      const uploadDir = path.join(__dirname, '../uploads/events');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const matches = eventData.event_program_attachment.match(/^data:(.+);base64,(.+)$/);
      if (!matches) throw new Error('Invalid base64 string');

      const ext = matches[1].split('/')[1];
      const buffer = Buffer.from(matches[2], 'base64');

      // Delete old file if exists
      if (current.event_program_attachment) {
        const oldPath = path.join(__dirname, '../', current.event_program_attachment);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      // Save new file
      const fileName = `event-program-${eventId}.${ext}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      programPath = `uploads/events/${fileName}`;
    }

    // --- Prepare updated data ---
    const updatedEventData = {
      event_name: eventData.event_name || current.event_name,
      event_description: eventData.event_description || current.event_description,
      event_location: eventData.event_location || current.event_location,
      start_date_time: eventData.start_date_time || current.start_date_time,
      end_date_time: eventData.end_date_time || current.end_date_time,
      selection_mode: eventData.selection_mode || current.selection_mode,
      selected_course: eventData.selected_course ?? current.selected_course,
      selected_students: eventData.selected_students
        ? JSON.stringify(eventData.selected_students)
        : current.selected_students,
      event_program_attachment: programPath,
      event_note: eventData.event_note ?? current.event_note,
      event_reminder: eventData.event_reminder ?? current.event_reminder,
      call_to_action_buttons_instruction: eventData.call_to_action_buttons_instruction ?? current.call_to_action_buttons_instruction,
      volunteer_application: eventData.volunteer_application ?? current.volunteer_application,
      absence_request: eventData.absence_request ?? current.absence_request,
      attendance_controls: eventData.attendance_controls ?? current.attendance_controls,
      custom_notification: eventData.custom_notification ?? current.custom_notification,
      mid_event_check: eventData.mid_event_check ?? current.mid_event_check,
      qr_code_option: eventData.qr_code_option || current.qr_code_option,
      location_perimeter: eventData.location_perimeter ?? current.location_perimeter,
      latitude: eventData.latitude ?? current.latitude,
      longitude: eventData.longitude ?? current.longitude
    };

    // --- Update database ---
    await eventModel.update(eventId, updatedEventData);

    // --- Handle QR code if automatic ---
    if (updatedEventData.qr_code_option === 'automatic') {
      const qrFolder = path.join(__dirname, '../uploads/qr');
      if (!fs.existsSync(qrFolder)) fs.mkdirSync(qrFolder, { recursive: true });

      const qrPath = path.join(qrFolder, `event-${eventId}.png`);
      await QRCode.toFile(qrPath, `${eventId}`);
      await eventModel.updateQRCodePath(eventId, `/uploads/qr/event-${eventId}.png`);
    }

    res.json({
      message: 'Event updated successfully',
      event_program_attachment: programPath
    });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Failed to update event', error: err.message });
  }
};


// --- GET ALL EVENTS ---
const getAllEvents = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM events');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch events', error: err.message });
  }
};

// --- GET EVENT BY ID ---
const getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;
    const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!rows[0]) return res.status(404).json({ message: 'Event not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch event', error: err.message });
  }
};

// --- DELETE EVENT ---
const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const [current] = await db.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (current[0] && current[0].event_program_attachment) {
      const oldPath = path.join(__dirname, '../', current[0].event_program_attachment);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await eventModel.delete(eventId);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete event', error: err.message });
  }
};

module.exports = {
  createEvent,
  updateEvent,
  getAllEvents,
  getEventById,
  deleteEvent
};
