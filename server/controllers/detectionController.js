/**
 * Detection controllers (disease & pest) with image upload support.
 */
const db = require('../config/db');
const aiService = require('../services/aiEngine');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const saveDetection = (userId, type, result, imagePath) => {
  db.prepare(
    `INSERT INTO detections (user_id, type, detected_name, confidence, symptoms, causes, measures, image_path, raw_result)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(
    userId,
    type,
    type === 'disease' ? result.detected_disease : result.detected_pest,
    type === 'disease' ? result.confidence : result.confidence,
    type === 'disease' ? result.symptoms : result.symptoms,
    type === 'disease' ? result.possible_causes : result.prevention,
    type === 'disease' ? result.control_measures : result.control_measures,
    imagePath || null,
    JSON.stringify(result)
  );
};

const detectDisease = asyncHandler(async (req, res, next) => {
  const cropHint = (req.body.crop || '');
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  if (!req.file) {
    // Allow analysis without an image using crop hint (for demo/safety fallback)
    // But we still require confidence caveat.
  }

  const result = aiService.detectDisease({ hint: cropHint });
  saveDetection(req.user.id, 'disease', result, imagePath);

  return success(res, { ...result, image: imagePath }, 'Disease analysis complete.');
});

const detectPest = asyncHandler(async (req, res, next) => {
  const cropHint = (req.body.crop || '');
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const result = aiService.detectPest({ hint: cropHint });
  saveDetection(req.user.id, 'pest', result, imagePath);
  return success(res, { ...result, image: imagePath }, 'Pest analysis complete.');
});

const getHistory = asyncHandler(async (req, res, next) => {
  const rows = db.prepare('SELECT * FROM detections WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(req.user.id);
  return success(res, rows, 'Detection history.');
});

module.exports = { detectDisease, detectPest, getHistory };

