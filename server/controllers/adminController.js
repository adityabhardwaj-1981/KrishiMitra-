/**
 * Admin controllers for managing users, crops, schemes, and moderating content.
 */
const db = require('../config/db');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ---- Users ----
const listUsers = asyncHandler(async (req, res, next) => {
  const rows = db.prepare('SELECT id, name, email, role, phone, location, approved, created_at FROM users ORDER BY created_at DESC').all();
  return success(res, rows, 'Users list.');
});

const toggleUserStatus = asyncHandler(async (req, res, next) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  if (user.id === req.user.id) throw new AppError('You cannot change your own status.', 400);
  const approved = req.body.approved ? 1 : 0;
  db.prepare('UPDATE users SET approved = ? WHERE id = ?').run(approved, user.id);
  return success(res, { id: user.id, approved: !!approved }, 'User status updated.');
});

const setUserRole = asyncHandler(async (req, res, next) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  const role = req.body.role;
  if (!['farmer', 'admin'].includes(role)) throw new AppError('Invalid role.', 400);
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, user.id);
  return success(res, { id: user.id, role }, 'User role updated.');
});

// ---- Crops ----
const createCrop = asyncHandler(async (req, res, next) => {
  const { name, season, soil_type, water_requirement, duration_days, avg_yield, description } = req.body;
  const result = db.prepare('INSERT INTO crops (name, season, soil_type, water_requirement, duration_days, avg_yield, description) VALUES (?,?,?,?,?,?,?)')
    .run(name, season || null, soil_type || null, water_requirement || null, duration_days || null, avg_yield || null, description || null);
  const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(result.lastInsertRowid);
  return success(res, crop, 'Crop added.', 201);
});

const updateCrop = asyncHandler(async (req, res, next) => {
  const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(req.params.id);
  if (!crop) throw new AppError('Crop not found.', 404);
  const { name, season, soil_type, water_requirement, duration_days, avg_yield, description } = req.body;
  db.prepare('UPDATE crops SET name=?, season=?, soil_type=?, water_requirement=?, duration_days=?, avg_yield=?, description=? WHERE id=?')
    .run(name || crop.name, season ?? crop.season, soil_type ?? crop.soil_type, water_requirement ?? crop.water_requirement, duration_days ?? crop.duration_days, avg_yield ?? crop.avg_yield, description ?? crop.description, crop.id);
  const updated = db.prepare('SELECT * FROM crops WHERE id = ?').get(crop.id);
  return success(res, updated, 'Crop updated.');
});

const deleteCrop = asyncHandler(async (req, res, next) => {
  const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(req.params.id);
  if (!crop) throw new AppError('Crop not found.', 404);
  db.prepare('DELETE FROM crops WHERE id = ?').run(crop.id);
  return success(res, null, 'Crop deleted.');
});

// ---- Schemes (admin CRUD) ----
const createScheme = asyncHandler(async (req, res, next) => {
  const { name, ministry, description, eligibility, benefits, documents_required, how_to_apply, source } = req.body;
  const result = db.prepare('INSERT INTO schemes (name, ministry, description, eligibility, benefits, documents_required, how_to_apply, source) VALUES (?,?,?,?,?,?,?,?)')
    .run(name, ministry || null, description || null, eligibility || null, benefits || null, documents_required || null, how_to_apply || null, source || 'Admin entry');
  const scheme = db.prepare('SELECT * FROM schemes WHERE id = ?').get(result.lastInsertRowid);
  return success(res, scheme, 'Scheme added.', 201);
});

const deleteScheme = asyncHandler(async (req, res, next) => {
  const scheme = db.prepare('SELECT * FROM schemes WHERE id = ?').get(req.params.id);
  if (!scheme) throw new AppError('Scheme not found.', 404);
  db.prepare('DELETE FROM schemes WHERE id = ?').run(scheme.id);
  return success(res, null, 'Scheme deleted.');
});

// ---- Moderation ----
const moderatePost = asyncHandler(async (req, res, next) => {
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id);
  if (!post) throw new AppError('Post not found.', 404);
  const status = req.body.status === 'hidden' ? 'hidden' : 'active';
  db.prepare('UPDATE community_posts SET status = ? WHERE id = ?').run(status, post.id);
  return success(res, { id: post.id, status }, 'Post status updated.');
});

const moderateListing = asyncHandler(async (req, res, next) => {
  const item = db.prepare('SELECT * FROM marketplace_items WHERE id = ?').get(req.params.id);
  if (!item) throw new AppError('Listing not found.', 404);
  const status = ['active', 'sold', 'removed'].includes(req.body.status) ? req.body.status : 'active';
  db.prepare('UPDATE marketplace_items SET status = ? WHERE id = ?').run(status, item.id);
  return success(res, { id: item.id, status }, 'Listing status updated.');
});

// ---- Dashboard stats ----
const getStats = asyncHandler(async (req, res, next) => {
  const users = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const posts = db.prepare('SELECT COUNT(*) AS c FROM community_posts').get().c;
  const listings = db.prepare('SELECT COUNT(*) AS c FROM marketplace_items').get().c;
  const equipment = db.prepare('SELECT COUNT(*) AS c FROM equipment').get().c;
  const detections = db.prepare('SELECT COUNT(*) AS c FROM detections').get().c;
  const recentUsers = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5').all();
  return success(res, { stats: { users, posts, listings, equipment, detections }, recentUsers }, 'Admin stats.');
});

module.exports = { listUsers, toggleUserStatus, setUserRole, createCrop, updateCrop, deleteCrop, createScheme, deleteScheme, moderatePost, moderateListing, getStats };
