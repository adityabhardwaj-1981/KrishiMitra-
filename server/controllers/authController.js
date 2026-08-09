/**
 * Authentication controllers: register, login, me.
 */
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');

const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, location, farm_name, language } = req.body;
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) throw new AppError('An account with this email already exists.', 400);

  const hash = await bcrypt.hash(password, 10);
  const result = db
    .prepare(
      'INSERT INTO users (name, email, password, phone, location, farm_name, language, role) VALUES (?,?,?,?,?,?,?, \'farmer\')'
    )
    .run(name, email, hash, phone || null, location || null, farm_name || null, language || 'en');

  const user = db.prepare('SELECT id, name, email, role, phone, location, farm_name, language, approved FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = signToken(user);
  return success(res, { token, user }, 'Account created successfully. Welcome to KrishiMitra AI!', 201);
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) throw new AppError('Invalid email or password.', 401);

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new AppError('Invalid email or password.', 401);
  if (user.approved === 0) throw new AppError('Your account is not approved. Contact an administrator.', 403);

  const token = signToken(user);
  const safe = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, location: user.location, farm_name: user.farm_name, language: user.language };
  return success(res, { token, user: safe }, 'Logged in successfully.');
});

const me = asyncHandler(async (req, res, next) => {
  const user = db.prepare('SELECT id, name, email, role, phone, location, farm_name, language, avatar, approved, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) throw new AppError('User not found.', 404);
  return success(res, user, 'User profile.');
});

module.exports = { register, login, me };

