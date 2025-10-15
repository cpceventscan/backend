const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Event = require('../models/event');
const db = require('../config/db');

const eventModel = new Event(db);

// Save base64 media file
const saveBase64File = (base64String, uploadFolder, fileName) => {
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid base64 string');

  const ext = matches[1].split('/')[1]; // get file extension
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');

  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
  }

  const filePath = path.join(uploadFolder, `${fileName}.${ext}`);
  fs.writeFileSync(filePath, buffer);

  // Return relative path for database
  return path.relative(path.join(__dirname, '../'), filePath).replace(/\\/g, '/');
};

// --- CREATE EVENT ---
const createEvent = async (req, res) => {
  try {
    const eventData = req.body;
    const eventId = await eventModel.create(eventData);

    // Handle media upload
    if (eventData.event_program_attachment_base64) {
      const uploadDir = path.join(__dirname, '../uploads/events');
      const savedFilePath = saveBase64File(
        eventData.event_program_attachment_base64,
        uploadDir,
        `event-program-${eventId}`
      );

      // Merge with existing data to prevent NULL fields
      const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [eventId]);
      if (!rows[0]) throw new Error('Event not found');

      const updatedEventData = {
        ...rows[0],
        event_program_attachment: savedFilePath
      };

      await eventModel.update(eventId, updatedEventData);
    }

    // Generate QR code if automatic
    if (eventData.qr_code_option === 'automatic') {
      const qrFolderPath = path.join(__dirname, '../uploads/qr');
      if (!fs.existsSync(qrFolderPath)) fs.mkdirSync(qrFolderPath, { recursive: true });

      const qrImagePath = path.join(qrFolderPath, `event-${eventId}.png`);
      await QRCode.toFile(qrImagePath, `${eventId}`);
      const qrCodeImagePath = `/uploads/qr/event-${eventId}.png`;

      await eventModel.updateQRCodePath(eventId, qrCodeImagePath);
    }

    res.status(201).json({
      id: eventId,
      qr_code_image: eventData.qr_code_option === 'automatic' ? `/uploads/qr/event-${eventId}.png` : null
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
};

// --- GET ALL EVENTS ---
const getAllEvents = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM events');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

// --- DELETE EVENT ---
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await eventModel.delete(id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};

// --- UPDATE EVENT ---
const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventData = req.body;

    // Fetch current event to merge fields
    const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!rows[0]) throw new Error('Event not found');
    const currentEventData = rows[0];

    // Handle new media upload
    if (eventData.event_program_attachment_base64) {
      const uploadDir = path.join(__dirname, '../uploads/events');
      const savedFilePath = saveBase64File(
        eventData.event_program_attachment_base64,
        uploadDir,
        `event-program-${eventId}`
      );

      // Delete old file if exists
      if (currentEventData.event_program_attachment) {
        const oldPath = path.join(__dirname, '../', currentEventData.event_program_attachment);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      eventData.event_program_attachment = `uploads/events/${path.basename(savedFilePath)}`;
    }

    // Merge with existing data
    const updatedEventData = { ...currentEventData, ...eventData };

    await eventModel.update(eventId, updatedEventData);

    // QR code handling
    const qrFolderPath = path.join(__dirname, '../uploads/qr');
    const qrImagePath = path.join(qrFolderPath, `event-${eventId}.png`);
    const qrCodeImagePath = `/uploads/qr/event-${eventId}.png`;

    if (updatedEventData.qr_code_option === 'automatic') {
      if (!fs.existsSync(qrFolderPath)) fs.mkdirSync(qrFolderPath, { recursive: true });
      await QRCode.toFile(qrImagePath, `${eventId}`);
      await eventModel.updateQRCodePath(eventId, qrCodeImagePath);
    } else if (updatedEventData.qr_code_option === 'no_qr') {
      if (fs.existsSync(qrImagePath)) fs.unlinkSync(qrImagePath);
      await eventModel.updateQRCodePath(eventId, null);
    }

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
}
const getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;
    const [rows] = await db.execute('SELECT * FROM events WHERE id = ?', [eventId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching event by ID:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createEvent, getAllEvents, deleteEvent, updateEvent, getEventById };
