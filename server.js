const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
const db = require('./config/db');
const Event = require('./models/event');
const eventRoutes = require('./routes/eventRoutes');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const yearLevelRoutes = require('./routes/yearLevelRoutes');
const sectionRoutes = require('./routes/sectionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const eventModel = new Event(db);

app.use(cors());
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.send('API server is running');
});
app.use('/api/events', eventRoutes);
app.post('/api/events', async (req, res) => {
  try {
    const eventData = req.body;
    const eventId = await eventModel.create(eventData);
    
    let qrCodeImagePath = null;

    if (eventData.qr_code_option === 'automatic') {
      const qrData = `Event: ${eventData.eventName}`;
      const qrFolderPath = path.join(__dirname, 'uploads/qr');
      if (!fs.existsSync(qrFolderPath)) {
        fs.mkdirSync(qrFolderPath, { recursive: true });
      }
      const qrImagePath = path.join(qrFolderPath, `event-${eventId}.png`);
      await QRCode.toFile(qrImagePath, qrData);
      qrCodeImagePath = `/uploads/qr/event-${eventId}.png`;
      await eventModel.updateQRCodePath(eventId, qrCodeImagePath);
      console.log('QR code generated at:', qrImagePath);
    }
    res.status(201).json({ id: eventId, qr_code_image: qrCodeImagePath });
  } catch (error) {
    console.error('Error in event creation:', error);
    res.status(500).json({ 
      message: 'Failed to create event',
      error: error.message
    });
  }
});
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/year-level', yearLevelRoutes)
app.use('/api/sections', sectionRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
