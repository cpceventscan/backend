const { saveFaceImage, getFaceImageByStudentId, getAllFaces, deleteFaceByStudentId } = require('../models/faceModel');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const LUXAND_API_KEY = '39a93e5b3b2f4769ba3b69b14c79c53c'; // Your API Key

// 🟢 Register new face (save + enroll to Luxand)
const registerFace = async (req, res) => {
  try {
    const studentId = req.query.student_id || req.session?.student?.student_id;
    const imageBase64 = req.body.image_base64;
    if (!studentId || !imageBase64) {
      return res.status(400).json({ error: 'Missing studentId or image' });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    const fileName = `${studentId}.jpg`;
    const filePath = path.join(uploadsDir, fileName);
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    fs.writeFileSync(filePath, imageBuffer);

    const formData = new FormData();
    formData.append('name', studentId);
    formData.append('photos', imageBuffer, { filename: fileName });
    formData.append('store', '1');

    const luxRes = await fetch('https://api.luxand.cloud/v2/person', {
      method: 'POST',
      headers: { token: LUXAND_API_KEY, ...formData.getHeaders() },
      body: formData,
    });
    const luxData = await luxRes.json();
    console.log('Luxand register response:', luxData);

    if (!luxData.uuid) {
      return res.status(400).json({ error: 'Luxand enrollment failed', details: luxData });
    }

    const dbId = await saveFaceImage(studentId, fileName, luxData.uuid);
    return res.json({ success: true, luxandUUID: luxData.uuid, localFile: filePath, dbId });
  } catch (err) {
    console.error('registerFace error:', err);
    return res.status(500).json({ error: 'Failed to register face', details: err.message });
  }
};

// 🟡 Detect face (for live box overlay)
const detectFace = async (req, res) => {
  try {
    const { image_base64 } = req.body;
    if (!image_base64) return res.status(400).json({ error: 'Missing image_base64' });

    const imageBuffer = Buffer.from(image_base64, 'base64');
    const formData = new FormData();
    formData.append('photo', imageBuffer, { filename: 'detect.jpg' });

    const luxRes = await fetch('https://api.luxand.cloud/photo/detect', {
      method: 'POST',
      headers: { token: LUXAND_API_KEY, ...formData.getHeaders() },
      body: formData,
    });

    const text = await luxRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Luxand detect non-JSON:', text);
      return res.status(500).json({ error: 'Invalid Luxand detect response', details: text.slice(0, 200) });
    }

    if (Array.isArray(data) && data.length > 0) {
      return res.json(data);
    } else {
      return res.json([]);
    }
  } catch (err) {
    console.error('detectFace error:', err);
    return res.status(500).json({ error: 'Luxand detection failed', details: err.message });
  }
};

// 🔵 Verify face (compare against saved Luxand ID)
// const verifyFace = async (req, res) => {
//   try {
//     const { studentId, image_base64 } = req.body;
//     if (!studentId || !image_base64)
//       return res.status(400).json({ error: 'Missing studentId or image' });

//     const imageBuffer = Buffer.from(image_base64, 'base64');
//     const stored = await getFaceImageByStudentId(studentId);
//     if (!stored || !stored.luxand_id)
//       return res.status(404).json({ error: 'Student not registered in Luxand' });

//     const luxandUUID = stored.luxand_id;
//     const formData = new FormData();
//     formData.append('photo', imageBuffer, { filename: 'verify.jpg' });
//     formData.append('all', '1');

//     const luxRes = await fetch('https://api.luxand.cloud/photo/search/v2', {
//       method: 'POST',
//       headers: { token: LUXAND_API_KEY, ...formData.getHeaders() },
//       body: formData,
//     });

//     const text = await luxRes.text();
//     let data;
//     try {
//       data = JSON.parse(text);
//     } catch (e) {
//       console.error('Luxand verify non-JSON:', text);
//       return res.status(500).json({ error: 'Invalid Luxand verify response', details: text.slice(0, 200) });
//     }

//     if (Array.isArray(data)) {
//       const match = data.find((p) => p.uuid === luxandUUID);
//       const confidence = match?.probability ?? 0;
//       if (match && confidence >= 0.6) {
//         return res.json({ verified: true, confidence });
//       }
//     }

//     return res.status(400).json({ verified: false, confidence: 0 });
//   } catch (err) {
//     console.error('verifyFace error:', err);
//     return res.status(500).json({ error: 'Luxand verification failed', details: err.message });
//   }
// };
// const detectFace = async (req, res) => {
//   try {
//     const { image_base64 } = req.body;
//     const buffer = Buffer.from(image_base64, "base64");

//     const form = new FormData();
//     form.append("photo", buffer, { filename: "detect.jpg" });

//     const luxRes = await fetch("https://api.luxand.cloud/photo/detect", {
//       method: "POST",
//       headers: { token: LUXAND_API_KEY, ...form.getHeaders() },
//       body: form,
//     });

//     const text = await luxRes.text();
//     let data = [];
//     try { data = JSON.parse(text); } catch (e) { return res.json([]); }

//     res.json(data);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };

// Verify face
const verifyFace = async (req, res) => {
  try {
    const { studentId, image_base64 } = req.body;
    const stored = await getFaceImageByStudentId(studentId);
    if (!stored || !stored.luxand_id) return res.status(404).json({ error: "Face not registered" });

    const buffer = Buffer.from(image_base64, "base64");
    const form = new FormData();
    form.append("photo", buffer, { filename: "verify.jpg" });
    form.append("all", "1");

    const luxRes = await fetch("https://api.luxand.cloud/photo/search/v2", {
      method: "POST",
      headers: { token: LUXAND_API_KEY, ...form.getHeaders() },
      body: form,
    });

    const text = await luxRes.text();
    let data = [];
    try { data = JSON.parse(text); } catch (e) { return res.status(500).json({ error: "Luxand parse error" }); }

    const match = data.find(p => p.uuid === stored.luxand_id);
    const confidence = match?.probability ?? 0;

    if (match && confidence >= 0.9) res.json({ verified: true, confidence });
    else res.status(400).json({ verified: false, confidence });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const checkFace = async (req, res) => {
  try {
    const studentId = req.query.student_id || req.session?.student?.student_id;
    if (!studentId) return res.status(400).json({ error: 'Missing studentId' });
    const stored = await getFaceImageByStudentId(studentId);
    return res.json({ registered: !!stored, data: stored });
  } catch (err) {
    console.error('checkFace error:', err);
    return res.status(500).json({ error: 'Failed to check face' });
  }
};

const listFaces = async (req, res) => {
  try {
    const faces = await getAllFaces();
    return res.json({ faces });
  } catch (err) {
    console.error('listFaces error:', err);
    return res.status(500).json({ error: 'Failed to fetch faces' });
  }
};

const deleteFace = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'Missing studentId' });
    const deleted = await deleteFaceByStudentId(studentId);
    if (deleted) {
      return res.json({ success: true, message: 'Face ID deleted successfully' });
    } else {
      return res.status(404).json({ error: 'Face ID not found' });
    }
  } catch (err) {
    console.error('deleteFace error:', err);
    return res.status(500).json({ error: 'Failed to delete Face ID' });
  }
};

module.exports = {
  registerFace,
  detectFace,
  verifyFace,
  checkFace,
  listFaces,
  deleteFace,
};
