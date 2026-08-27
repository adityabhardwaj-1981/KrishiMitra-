/**
 * KrishiMitra AI - Express App Setup
 * Exports the Express app instance for both standalone Node servers and Vercel serverless functions.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const env = require('./config/env');
const { initDb } = require('./db/init');
const { seedIfEmpty } = require('./db/seedData');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---- Database Initialization with Async Safety ----
let isDbReady = false;
let dbInitPromise = null;

async function ensureDb() {
  if (isDbReady) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        initDb();
        await seedIfEmpty();
        isDbReady = true;
      } catch (err) {
        console.error('[DB Setup Error]:', err);
      }
    })();
  }
  return dbInitPromise;
}

// Trigger initialization on startup
ensureDb();

// ---- Security & Middleware ----
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Ensure DB is seeded before processing incoming API requests
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/chat')) {
    await ensureDb();
  }
  next();
});

// Static uploads folder
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// ---- API Routes (Mounted at both /api and / for serverless compatibility) ----
app.use('/api', routes);
app.use('/', routes);

// ---- Static Assets & Frontend Routing ----
const clientDistPath = path.resolve(__dirname, '../client/dist');
const landingPagePath = path.resolve(__dirname, '../index.html');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath, { index: false }));
}

// 1. Landing page route (/ and /landing)
app.get(['/', '/landing'], (req, res) => {
  if (fs.existsSync(landingPagePath)) {
    return res.sendFile(landingPagePath);
  }
  return res.sendFile(path.join(clientDistPath, 'index.html'));
});

// 2. React SPA fallback for all application routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }

  const clientIndexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(clientIndexPath)) {
    return res.sendFile(clientIndexPath);
  }

  if (fs.existsSync(landingPagePath)) {
    return res.sendFile(landingPagePath);
  }

  return res.status(404).send('Application build not found. Please run "npm run build".');
});

// ---- 404 & Error Handling for API routes ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
