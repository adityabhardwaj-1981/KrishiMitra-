const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../config/upload');
const ctrl = require('../controllers/detectionController');

router.post('/disease', authenticate, upload.single('image'), ctrl.detectDisease);
router.post('/pest', authenticate, upload.single('image'), ctrl.detectPest);
router.get('/history', authenticate, ctrl.getHistory);

module.exports = router;

