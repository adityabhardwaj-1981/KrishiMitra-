const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  let dbStatus = 'ok';
  try {
    db.prepare('SELECT 1').get();
  } catch (e) {
    dbStatus = 'error';
  }
  res.json({
    success: true,
    status: 'healthy',
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

