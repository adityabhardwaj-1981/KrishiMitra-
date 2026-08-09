/**
 * Crop recommendation & crop catalogue controllers.
 */
const db = require('../config/db');
const aiService = require('../services/aiEngine');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const recommend = asyncHandler(async (req, res, next) => {
  const { soil_type, season, water_availability, location, previous_crop } = req.body || {};
  const result = aiService.recommendCrops({
    soil_type,
    season,
    water_availability,
    location,
    previous_crop,
  });
  return success(res, result, 'Crop recommendations generated.');
});

const listCrops = asyncHandler(async (req, res, next) => {
  const rows = db.prepare('SELECT * FROM crops ORDER BY name').all();
  return success(res, rows, 'Crop catalogue.');
});

const getCrop = asyncHandler(async (req, res, next) => {
  const row = db.prepare('SELECT * FROM crops WHERE id = ?').get(req.params.id);
  if (!row) throw new AppError('Crop not found.', 404);
  return success(res, row, 'Crop details.');
});

module.exports = { recommend, listCrops, getCrop };

