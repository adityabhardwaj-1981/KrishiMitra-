const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/soilController');

router.post('/analyze', authenticate, ctrl.analyze);
router.get('/history', authenticate, ctrl.getHistory);

module.exports = router;

