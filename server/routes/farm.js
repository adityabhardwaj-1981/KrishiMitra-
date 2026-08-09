const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/farmController');

router.post('/', authenticate, ctrl.createFarm);
router.get('/', authenticate, ctrl.getMyFarms);

router.post('/activities', authenticate, ctrl.addActivity);
router.get('/activities', authenticate, ctrl.listActivities);
router.delete('/activities/:id', authenticate, ctrl.deleteActivity);

router.post('/records', authenticate, ctrl.addRecord);
router.get('/records', authenticate, ctrl.listRecords);
router.delete('/records/:id', authenticate, ctrl.deleteRecord);

module.exports = router;

