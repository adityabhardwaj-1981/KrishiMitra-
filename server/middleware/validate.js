/**
 * Express-validator based validation middleware.
 * Runs the provided validation chain and returns the first validation error.
 */
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

function validate(rules) {
  return [
    ...rules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (errors.isEmpty()) return next();
      const first = errors.array()[0];
      return next(new AppError(first.msg, 400, { field: first.param, value: first.value }));
    },
  ];
}

module.exports = { validate };

