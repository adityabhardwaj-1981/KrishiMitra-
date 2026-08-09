/**
 * SQLite database connection using better-sqlite3 (synchronous, zero-config).
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const env = require('./env');

// Ensure the database directory exists
const dbDir = path.resolve(__dirname, '..', env.DB_PATH.includes('/') ? env.DB_PATH.split('/')[0] + '' : 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath =
  env.DB_PATH === ':memory:'
    ? ':memory:'
    : path.resolve(__dirname, '..', env.DB_PATH);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;

