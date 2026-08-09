const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/marketController');

router.get('/', authenticate, ctrl.listPrices);
router.get('/:commodity', authenticate, ctrl.getCommodity);

module.exports = router;

