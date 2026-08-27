/**
 * SQLite database connection using better-sqlite3.
 * Configured with automatic /tmp path fallback for Vercel serverless functions.
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const env = require('./env');

const isVercel = !!process.env.VERCEL;

let dbPath;
if (env.DB_PATH === ':memory:') {
  dbPath = ':memory:';
} else if (isVercel) {
  dbPath = '/tmp/krishimitra.sqlite';
} else {
  dbPath = path.resolve(__dirname, '..', env.DB_PATH);
}

if (dbPath !== ':memory:') {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

const db = new Database(dbPath);

try {
  db.pragma('journal_mode = WAL');
} catch (e) {
  try {
    db.pragma('journal_mode = DELETE');
  } catch (_) {}
}

db.pragma('foreign_keys = ON');

module.exports = db;


