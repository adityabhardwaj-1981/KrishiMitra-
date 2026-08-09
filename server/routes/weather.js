const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/weatherController');

// Weather can be public-ish but we keep it authenticated for consistency
router.get('/', authenticate, ctrl.getWeather);

module.exports = router;

