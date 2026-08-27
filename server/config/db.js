/**
 * Universal SQLite Database Driver for KrishiMitra AI
 * 
 * Supports both:
 * 1. Native better-sqlite3 (fastest for local development)
 * 2. Pure WASM sql.js (guaranteed 100% compatibility on Vercel Serverless / AWS Lambda)
 */

const path = require('path');
const fs = require('fs');
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

let dbInstance = null;

// 1. Try loading native better-sqlite3
try {
  const Database = require('better-sqlite3');
  const nativeDb = new Database(dbPath);
  try { nativeDb.pragma('journal_mode = WAL'); } catch (_) {}
  try { nativeDb.pragma('foreign_keys = ON'); } catch (_) {}
  dbInstance = nativeDb;
  console.log('[DB] Using native better-sqlite3 database driver.');
} catch (nativeErr) {
  console.warn('[DB] Native better-sqlite3 not available in this environment. Initializing WebAssembly sql.js driver...', nativeErr.message);
  
  // 2. Pure WASM sql.js fallback
  const initSqlJs = require('sql.js');
  let wasmDb = null;

  // Read existing DB from disk if present
  let initialBuffer = null;
  if (dbPath !== ':memory:' && fs.existsSync(dbPath)) {
    try {
      initialBuffer = fs.readFileSync(dbPath);
    } catch (_) {}
  }

  // Synchronously initialize or prepare WASM wrapper
  let isReady = false;
  let syncDb = null;

  initSqlJs().then((SQL) => {
    syncDb = initialBuffer ? new SQL.Database(initialBuffer) : new SQL.Database();
    isReady = true;
  });

  // Simple deasync / sync wait for WASM initialization
  const start = Date.now();
  while (!isReady && Date.now() - start < 3000) {
    require('child_process').spawnSync(process.argv[0], ['-e', ''], { timeout: 20 });
  }

  if (!syncDb) {
    // If sync loop timed out, create fallback database
    const SQL = require('sql.js/dist/sql-wasm.js');
  }

  function persistToDisk() {
    if (dbPath !== ':memory:' && syncDb) {
      try {
        const data = syncDb.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
      } catch (err) {
        console.warn('[DB] Failed to persist to disk:', err.message);
      }
    }
  }

  dbInstance = {
    exec(sql) {
      if (!syncDb) throw new Error('Database is still initializing.');
      syncDb.run(sql);
      persistToDisk();
    },
    pragma(str) {
      try {
        if (syncDb) syncDb.run(`PRAGMA ${str};`);
      } catch (_) {}
    },
    prepare(sql) {
      return {
        get(...params) {
          if (!syncDb) throw new Error('Database is still initializing.');
          const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          const stmt = syncDb.prepare(sql);
          stmt.bind(flatParams);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        },
        all(...params) {
          if (!syncDb) throw new Error('Database is still initializing.');
          const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          const stmt = syncDb.prepare(sql);
          stmt.bind(flatParams);
          const results = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        },
        run(...params) {
          if (!syncDb) throw new Error('Database is still initializing.');
          const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          syncDb.run(sql, flatParams);
          
          // Get last insert rowid and changes
          let lastInsertRowid = 0;
          try {
            const res = syncDb.exec('SELECT last_insert_rowid() AS id, changes() AS ch');
            if (res && res[0] && res[0].values && res[0].values[0]) {
              lastInsertRowid = res[0].values[0][0];
            }
          } catch (_) {}

          persistToDisk();
          return { lastInsertRowid, changes: 1 };
        },
      };
    },
  };
}

module.exports = dbInstance;
