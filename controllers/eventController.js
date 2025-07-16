const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Event = require('../models/event');
const db = require('../config/db');

const eventModel = new Event(db);
const saveBase64File = (base64String, uploadFolder, fileName) => {
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid base64 string');

  const ext = matches[1].split('/')[1];
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');

  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
  }

  const filePath = path.join(uploadFolder, `${fileName}.${ext}`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
};
const createEvent = async (req, res) => {
  try {
    const eventData = req.body;
    const eventId = await eventModel.create(eventData);

    let qrCodeImagePath = null;

    if (eventData.qr_code_option === 'automatic') {
      const qrData = `${eventId}`;
      const qrFolderPath = path.join(__dirname, '../uploads/qr');

      if (!fs.existsSync(qrFolderPath)) {
        fs.mkdirSync(qrFolderPath, { recursive: true });
      }

      const qrImagePath = path.join(qrFolderPath, `event-${eventId}.png`);
      await QRCode.toFile(qrImagePath, qrData);
      qrCodeImagePath = `/uploads/qr/event-${eventId}.png`;
      await eventModel.updateQRCodePath(eventId, qrCodeImagePath);
    }

    res.status(201).json({ id: eventId, qr_code_image: qrCodeImagePath });
  } catch (error) {
    console.error('Error in event creation:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM events');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch eventss' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await eventModel.delete(id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};
const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventData = req.body;

    // Save event program base64 file if present
    if (eventData.event_program_attachment_base64) {
      const uploadDir = path.join(__dirname, '../uploads/events');
      const savedFilePath = saveBase64File(
        eventData.event_program_attachment_base64,
        uploadDir,
        `event-program-${eventId}`
      );
      eventData.event_program_attachment = savedFilePath.replace(
        path.join(__dirname, '../'),
        '/'
      );
    }

    // Update main event data
    await eventModel.update(eventId, eventData);

    const qrFolderPath = path.join(__dirname, '../uploads/qr');
    const qrImagePath = path.join(qrFolderPath, `event-${eventId}.png`);
    const qrCodeImagePath = `/uploads/qr/event-${eventId}.png`;

    if (eventData.qr_code_option === 'automatic') {
      // Ensure QR folder exists
      if (!fs.existsSync(qrFolderPath)) {
        fs.mkdirSync(qrFolderPath, { recursive: true });
      }

      // Generate new QR code image
      await QRCode.toFile(qrImagePath, `${eventId}`);
      console.log(`QR Code generated: ${qrImagePath}`);

      // Update image path in DB
      await eventModel.updateQRCodePath(eventId, qrCodeImagePath);
    } else if (eventData.qr_code_option === 'no_qr') {
      // Remove QR image file if exists
      if (fs.existsSync(qrImagePath)) {
        fs.unlinkSync(qrImagePath);
        console.log(`QR Code deleted: ${qrImagePath}`);
      }

      // Clear image path in DB
      await eventModel.updateQRCodePath(eventId, null);
    }

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
};

module.exports = { createEvent, getAllEvents, deleteEvent, updateEvent };
