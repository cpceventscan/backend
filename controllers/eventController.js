const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Event = require('../models/event');
const db = require('../config/db');

const eventModel = new Event(db);

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

module.exports = { createEvent, getAllEvents };
