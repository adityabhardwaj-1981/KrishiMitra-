const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../config/upload');
const ctrl = require('../controllers/equipmentController');

router.get('/', ctrl.listEquipment);
router.get('/mine', authenticate, ctrl.getMine);
router.post('/', authenticate, upload.single('image'), ctrl.createEquipment);
router.post('/rent', authenticate, ctrl.requestRental);
router.put('/:id/status', authenticate, ctrl.setStatus);
router.get('/rentals/mine', authenticate, ctrl.myRentals);

module.exports = router;

