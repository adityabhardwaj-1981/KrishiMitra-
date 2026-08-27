/**
 * JWT helpers.
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signToken(user) {
  const secret = env.JWT_SECRET || 'krishimitra_production_secret_key_8f7b2c9d1e4a50617283940516273849';
  const expiresIn = env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    secret,
    { expiresIn }
  );
}

module.exports = { signToken };

