/**
 * KrishiMitra AI - Application entry point.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const env = require('./config/env');
const { initDb } = require('./db/init');
const { seedIfEmpty } = require('./db/seedData');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---- Security & middleware ----
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static uploads
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// ---- API routes ----
app.use('/api', routes);

// ---- 404 & error handling ----
app.use(notFound);
app.use(errorHandler);

// ---- Startup ----
initDb();
seedIfEmpty();

app.listen(env.PORT, () => {
  console.log('==========================================');
  console.log('  KrishiMitra AI backend running');
  console.log(`  API:     ${env.API_URL}`);
  console.log(`  Port:    ${env.PORT}`);
  console.log(`  DB:      ${env.DB_PATH}`);
  console.log(`  AI mode: ${env.AI_PROVIDER || 'mock-engine (offline)'}`);
  console.log('==========================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

