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

    // Handle base64 event program file upload if sent
    if (eventData.event_program_attachment_base64) {
      const uploadDir = path.join(__dirname, '../uploads/events');
      const savedFilePath = saveBase64File(eventData.event_program_attachment_base64, uploadDir, `event-program-${eventId}`);
      // Store relative path for frontend usage
      eventData.event_program_attachment = savedFilePath.replace(path.join(__dirname, '../'), '/');
    }

    await eventModel.update(eventId, eventData);

    // Regenerate QR code if option is automatic
    if (eventData.qr_code_option === 'automatic') {
      try {
        const qrFolderPath = path.join(__dirname, '../uploads/qr');

        if (!fs.existsSync(qrFolderPath)) {
          console.log('QR folder does not exist. Creating...');
          fs.mkdirSync(qrFolderPath, { recursive: true });
        }

        const qrImagePath = path.join(qrFolderPath, `event-${eventId}.png`);
        console.log('Generating QR code at:', qrImagePath);

        await QRCode.toFile(qrImagePath, `${eventId}`);
        console.log('QR code generated successfully.');

        const qrCodeImagePath = `/uploads/qr/event-${eventId}.png`;
        await eventModel.updateQRCodePath(eventId, qrCodeImagePath);
        console.log('QR code path updated in DB:', qrCodeImagePath);

      } catch (qrErr) {
        console.error('Error generating QR code during update:', qrErr);
      }
    }

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
};

module.exports = { createEvent, getAllEvents, deleteEvent, updateEvent };
