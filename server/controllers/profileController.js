/**
 * User profile & settings controllers.
 */
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, phone, location, farm_name, language } = req.body;
  db.prepare('UPDATE users SET name=?, phone=?, location=?, farm_name=?, language=? WHERE id=?')
    .run(name || req.user.name, phone ?? req.user.phone, location ?? req.user.location, farm_name ?? req.user.farm_name, language || req.user.language || 'en', req.user.id);
  const user = db.prepare('SELECT id, name, email, role, phone, location, farm_name, language, avatar FROM users WHERE id = ?').get(req.user.id);
  return success(res, user, 'Profile updated.');
});

const changePassword = asyncHandler(async (req, res, next) => {
  const { current_password, new_password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const ok = await bcrypt.compare(current_password, user.password);
  if (!ok) throw new AppError('Current password is incorrect.', 400);
  const hash = await bcrypt.hash(new_password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);
  return success(res, null, 'Password changed successfully.');
});

const getSettings = asyncHandler(async (req, res, next) => {
  const user = db.prepare('SELECT id, name, email, role, phone, location, farm_name, language FROM users WHERE id = ?').get(req.user.id);
  return success(res, user, 'Settings.');
});

module.exports = { updateProfile, changePassword, getSettings };
