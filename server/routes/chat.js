const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/chatController');

router.post(
  '/',
  authenticate,
  validate([body('message').trim().notEmpty().withMessage('Message is required.')]),
  ctrl.sendMessage
);
router.get('/history', authenticate, ctrl.getHistory);
router.delete('/history', authenticate, ctrl.clearHistory);

module.exports = router;

