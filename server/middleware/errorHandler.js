/**
 * Central error handling middleware.
 * Catches all errors and returns a consistent JSON response.
 */
const AppError = require('../utils/AppError');
const env = require('../config/env');

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
  }

  // SQLite constraint / syntax errors
  if (err.name === 'SqliteError') {
    statusCode = 400;
    message = err.message.includes('UNIQUE')
      ? 'This value already exists.'
      : 'Database error: ' + err.message;
  }

  const body = {
    success: false,
    message,
    ...(details ? { details } : {}),
  };
  if (env.NODE_ENV === 'development' && statusCode >= 500) {
    body.stack = err.stack;
  }
  return res.status(statusCode).json(body);
}

module.exports = { notFound, errorHandler };

