/**
 * Wraps async route handlers to forward errors to the central error handler,
 * removing repetitive try/catch blocks in controllers.
 */
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

