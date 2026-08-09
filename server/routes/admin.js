const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');

router.use(authenticate, authorize('admin'));

router.get('/stats', ctrl.getStats);
router.get('/users', ctrl.listUsers);
router.put('/users/:id/status', ctrl.toggleUserStatus);
router.put('/users/:id/role', ctrl.setUserRole);

router.post('/crops', ctrl.createCrop);
router.put('/crops/:id', ctrl.updateCrop);
router.delete('/crops/:id', ctrl.deleteCrop);

router.post('/schemes', ctrl.createScheme);
router.delete('/schemes/:id', ctrl.deleteScheme);

router.put('/posts/:id/moderation', ctrl.moderatePost);
router.put('/listings/:id/moderation', ctrl.moderateListing);

module.exports = router;

