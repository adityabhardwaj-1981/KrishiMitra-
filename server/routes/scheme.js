const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/schemeController');

router.get('/', authenticate, ctrl.listSchemes);
router.get('/:id', authenticate, ctrl.getScheme);

module.exports = router;

