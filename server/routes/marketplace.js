const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../config/upload');
const ctrl = require('../controllers/marketplaceController');

router.get('/', ctrl.listItems);
router.get('/mine', authenticate, ctrl.getMine);
router.get('/:id', ctrl.getItem);
router.post('/', authenticate, upload.single('image'), ctrl.createItem);
router.put('/:id', authenticate, ctrl.updateItem);
router.delete('/:id', authenticate, ctrl.deleteItem);

module.exports = router;

