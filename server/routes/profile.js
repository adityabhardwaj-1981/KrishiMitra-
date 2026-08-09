const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/profileController');

router.put('/', authenticate, ctrl.updateProfile);
router.put('/password', authenticate, ctrl.changePassword);
router.get('/settings', authenticate, ctrl.getSettings);

module.exports = router;

