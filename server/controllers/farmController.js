/**
 * Farm records controllers: farms, activities, and income/expense records.
 */
const db = require('../config/db');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ---- Farms ----
const createFarm = asyncHandler(async (req, res, next) => {
  const { name, area_hectares, soil_type, location } = req.body;
  const result = db.prepare('INSERT INTO farms (user_id, name, area_hectares, soil_type, location) VALUES (?,?,?,?,?)')
    .run(req.user.id, name, area_hectares || 0, soil_type || null, location || null);
  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(result.lastInsertRowid);
  return success(res, farm, 'Farm added.', 201);
});

const getMyFarms = asyncHandler(async (req, res, next) => {
  const rows = db.prepare('SELECT * FROM farms WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  return success(res, rows, 'My farms.');
});

// ---- Activities ----
const addActivity = asyncHandler(async (req, res, next) => {
  const { farm_id, crop_id, activity_type, description, activity_date, quantity, cost, notes } = req.body;
  const result = db.prepare(
    `INSERT INTO farm_activities (user_id, farm_id, crop_id, activity_type, description, activity_date, quantity, cost, notes)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(req.user.id, farm_id || null, crop_id || null, activity_type, description || null, activity_date || new Date().toISOString().split('T')[0], quantity || null, cost || 0, notes || null);
  const act = db.prepare('SELECT fa.*, c.name AS crop_name FROM farm_activities fa LEFT JOIN crops c ON c.id = fa.crop_id WHERE fa.id = ?').get(result.lastInsertRowid);
  return success(res, act, 'Activity recorded.', 201);
});

const listActivities = asyncHandler(async (req, res, next) => {
  const rows = db.prepare('SELECT fa.*, f.name AS farm_name, c.name AS crop_name FROM farm_activities fa LEFT JOIN farms f ON f.id = fa.farm_id LEFT JOIN crops c ON c.id = fa.crop_id WHERE fa.user_id = ? ORDER BY fa.activity_date DESC').all(req.user.id);
  return success(res, rows, 'Farm activities.');
});

const deleteActivity = asyncHandler(async (req, res, next) => {
  const act = db.prepare('SELECT * FROM farm_activities WHERE id = ?').get(req.params.id);
  if (!act) throw new AppError('Activity not found.', 404);
  if (act.user_id !== req.user.id && req.user.role !== 'admin') throw new AppError('Not authorized.', 403);
  db.prepare('DELETE FROM farm_activities WHERE id = ?').run(act.id);
  return success(res, null, 'Activity deleted.');
});

// ---- Records (income/expense) ----
const addRecord = asyncHandler(async (req, res, next) => {
  const { farm_id, crop_id, record_type, category, title, amount, quantity, record_date, notes } = req.body;
  const result = db.prepare(
    `INSERT INTO farm_records (user_id, farm_id, crop_id, record_type, category, title, amount, quantity, record_date, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(req.user.id, farm_id || null, crop_id || null, record_type, category || null, title, amount || 0, quantity || null, record_date || new Date().toISOString().split('T')[0], notes || null);
  const rec = db.prepare('SELECT fr.*, c.name AS crop_name FROM farm_records fr LEFT JOIN crops c ON c.id = fr.crop_id WHERE fr.id = ?').get(result.lastInsertRowid);
  return success(res, rec, 'Record saved.', 201);
});

const listRecords = asyncHandler(async (req, res, next) => {
  const type = req.query.type;
  let sql = 'SELECT fr.*, c.name AS crop_name, f.name AS farm_name FROM farm_records fr LEFT JOIN crops c ON c.id = fr.crop_id LEFT JOIN farms f ON f.id = fr.farm_id WHERE fr.user_id = ?';
  const params = [req.user.id];
  if (type) { sql += ' AND fr.record_type = ?'; params.push(type); }
  sql += ' ORDER BY fr.record_date DESC';
  const rows = db.prepare(sql).all(...params);
  return success(res, rows, 'Farm records.');
});

const deleteRecord = asyncHandler(async (req, res, next) => {
  const rec = db.prepare('SELECT * FROM farm_records WHERE id = ?').get(req.params.id);
  if (!rec) throw new AppError('Record not found.', 404);
  if (rec.user_id !== req.user.id && req.user.role !== 'admin') throw new AppError('Not authorized.', 403);
  db.prepare('DELETE FROM farm_records WHERE id = ?').run(rec.id);
  return success(res, null, 'Record deleted.');
});

module.exports = { createFarm, getMyFarms, addActivity, listActivities, deleteActivity, addRecord, listRecords, deleteRecord };

