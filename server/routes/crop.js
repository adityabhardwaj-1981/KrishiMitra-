const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/cropController');

router.post('/recommend', authenticate, ctrl.recommend);
router.get('/', ctrl.listCrops);
router.get('/:id', ctrl.getCrop);

module.exports = router;

