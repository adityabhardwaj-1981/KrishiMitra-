/**
 * Vercel Serverless Function Entry Point
 * Exports the Express app instance to handle serverless requests on Vercel.
 */
const app = require('../server/app');

module.exports = app;
