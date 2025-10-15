const express = require('express');
const router = express.Router();
const { registerFace, verifyFace, checkFace, listFaces, deleteFace, detectFace } = require('../controllers/faceController');

router.post('/register', registerFace);
router.post('/verify', verifyFace);
router.get('/check', checkFace);
router.get('/list', listFaces);
router.post('/delete', deleteFace); 
router.post('/detect', detectFace);

module.exports = router;
