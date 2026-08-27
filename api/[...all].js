/**
 * Vercel Serverless Function Catch-All Handler for /api/*
 */
const app = require('../server/app');

module.exports = (req, res) => {
  return app(req, res);
};
