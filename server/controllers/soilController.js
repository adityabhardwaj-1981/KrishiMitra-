/**
 * Soil health controllers.
 */
const db = require('../config/db');
const aiService = require('../services/aiEngine');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const analyze = asyncHandler(async (req, res, next) => {
  const body = req.body || {};
  const result = aiService.analyzeSoil(body);

  db.prepare(
    `INSERT INTO soil_records (user_id, ph, nitrogen, phosphorus, potassium, organic_carbon, soil_type, location, summary)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(
    req.user.id,
    body.ph || null,
    body.nitrogen || null,
    body.phosphorus || null,
    body.potassium || null,
    body.organic_carbon || null,
    body.soil_type || null,
    body.location || null,
    result.summary
  );
  return success(res, result, 'Soil analysis complete.');
});

const getHistory = asyncHandler(async (req, res, next) => {
  const rows = db.prepare('SELECT * FROM soil_records WHERE user_id = ? ORDER BY id DESC LIMIT 20').all(req.user.id);
  return success(res, rows, 'Soil analysis history.');
});

module.exports = { analyze, getHistory };

