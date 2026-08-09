/**
 * Government schemes controller. Admin manages; users browse/search.
 * Content is only from seeded verifiable data — never invented.
 */
const db = require('../config/db');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const listSchemes = asyncHandler(async (req, res, next) => {
  const q = req.query.q;
  let rows;
  if (q) {
    rows = db.prepare('SELECT * FROM schemes WHERE name LIKE ? OR description LIKE ? OR ministry LIKE ? ORDER BY name').all(`%${q}%`, `%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare('SELECT * FROM schemes ORDER BY name').all();
  }
  return success(res, rows, 'Government schemes.');
});

const getScheme = asyncHandler(async (req, res, next) => {
  const row = db.prepare('SELECT * FROM schemes WHERE id = ?').get(req.params.id);
  if (!row) throw new AppError('Scheme not found.', 404);
  return success(res, row, 'Scheme details.');
});

module.exports = { listSchemes, getScheme };

