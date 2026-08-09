const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/analyticsController');

router.get('/', authenticate, ctrl.getAnalytics);

module.exports = router;

