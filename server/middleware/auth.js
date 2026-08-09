/**
 * Authentication & authorization middleware.
 */
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Verifies the Bearer token and attaches the current user to req.user.
 */
function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AppError('Authentication required. Please log in.', 401);

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = db
      .prepare('SELECT id, name, email, role, approved, phone, location, farm_name FROM users WHERE id = ?')
      .get(decoded.id);

    if (!user) throw new AppError('User account not found.', 401);
    if (user.approved === 0) throw new AppError('Account is not approved.', 403);

    req.user = user;
    return next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }
}

/**
 * Restricts access to one or more roles.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Authentication required.', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };

