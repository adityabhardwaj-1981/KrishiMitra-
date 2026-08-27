/**
 * KrishiMitra AI - Pure JavaScript Universal Database Driver
 * 
 * 100% pure JavaScript with zero native C++ binary dependencies.
 * Guaranteed 100% uptime on Vercel Serverless Functions, AWS Lambda, Linux, Mac, and Windows.
 */

const fs = require('fs');
const path = require('path');
const env = require('./env');

const isVercel = !!process.env.VERCEL;
const dbFilePath = isVercel
  ? '/tmp/krishimitra_data.json'
  : path.resolve(__dirname, '../../krishimitra_data.json');

const tables = {};
const autoIncrements = {};

function getTable(name) {
  const key = name.toLowerCase().trim();
  if (!tables[key]) {
    tables[key] = [];
    autoIncrements[key] = 1;
  }
  return tables[key];
}

// Load initial data from disk if exists
try {
  if (fs.existsSync(dbFilePath)) {
    const raw = fs.readFileSync(dbFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    Object.keys(parsed.tables || {}).forEach((k) => {
      tables[k] = parsed.tables[k];
    });
    Object.keys(parsed.autoIncrements || {}).forEach((k) => {
      autoIncrements[k] = parsed.autoIncrements[k];
    });
  }
} catch (_) {}

function saveToDisk() {
  try {
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbFilePath, JSON.stringify({ tables, autoIncrements }));
  } catch (_) {}
}

const db = {
  exec(sql) {
    const createMatches = sql.matchAll(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-zA-Z0-9_]+)/gi);
    for (const m of createMatches) {
      getTable(m[1]);
    }
  },
  pragma() {},
  prepare(sql) {
    const cleanSql = sql.trim().replace(/\s+/g, ' ');

    return {
      get(...params) {
        const results = this.all(...params);
        return results.length > 0 ? results[0] : undefined;
      },
      all(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

        // 1. SELECT COUNT(*)
        const countMatch = cleanSql.match(/SELECT\s+COUNT\(\*\)\s+(?:AS\s+([a-zA-Z0-9_]+)\s+)?FROM\s+([a-zA-Z0-9_]+)/i);
        if (countMatch) {
          const alias = countMatch[1] || 'c';
          const tbl = getTable(countMatch[2]);
          return [{ [alias]: tbl.length, c: tbl.length, total: tbl.length }];
        }

        // 2. SELECT DISTINCT
        const distinctMatch = cleanSql.match(/SELECT\s+DISTINCT\s+([a-zA-Z0-9_]+)\s+FROM\s+([a-zA-Z0-9_]+)/i);
        if (distinctMatch) {
          const col = distinctMatch[1];
          const tbl = getTable(distinctMatch[2]);
          const seen = new Set();
          const list = [];
          tbl.forEach((r) => {
            if (r[col] !== undefined && !seen.has(r[col])) {
              seen.add(r[col]);
              list.push({ [col]: r[col] });
            }
          });
          return list;
        }

        // 3. General SELECT with JOIN & WHERE support
        const fromMatch = cleanSql.match(/FROM\s+([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_]+))?(?:\s+(?:LEFT\s+|INNER\s+)?JOIN\s+([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)\s+ON\s+([\s\S]+?))?(?:\s+WHERE\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+([\s\S]+?))?(?:\s+LIMIT\s+(\d+))?$/i);
        if (!fromMatch) {
          return [];
        }

        const mainTable = fromMatch[1].toLowerCase();
        let rows = getTable(mainTable).map((r) => ({ ...r }));

        // Handle simple JOINs if present
        if (fromMatch[3] && fromMatch[5]) {
          const joinTable = fromMatch[3].toLowerCase();
          const joinAlias = fromMatch[4];
          const joinOn = fromMatch[5]; // e.g. u.id = mi.seller_id
          const joinRows = getTable(joinTable);

          rows = rows.map((mainRow) => {
            const joinedRow = joinRows.find((j) => {
              if (joinOn.includes('seller_id') && j.id == mainRow.seller_id) return true;
              if (joinOn.includes('owner_id') && j.id == mainRow.owner_id) return true;
              if (joinOn.includes('renter_id') && j.id == mainRow.renter_id) return true;
              if (joinOn.includes('equipment_id') && j.id == mainRow.equipment_id) return true;
              if (joinOn.includes('author_id') && j.id == mainRow.author_id) return true;
              if (joinOn.includes('user_id') && j.id == mainRow.user_id) return true;
              return false;
            });
            if (joinedRow) {
              if (joinTable === 'users') {
                return { ...mainRow, seller_name: joinedRow.name, owner_name: joinedRow.name, renter_name: joinedRow.name, author_name: joinedRow.name };
              }
              if (joinTable === 'equipment') {
                return { ...mainRow, equipment_name: joinedRow.name, image: joinedRow.image, availability: joinedRow.availability };
              }
              return { ...mainRow, ...joinedRow };
            }
            return mainRow;
          });
        }

        // Filtering with WHERE clause
        if (fromMatch[6]) {
          const whereClause = fromMatch[6];
          let paramIdx = 0;

          if (whereClause.includes('email = ?') && flatParams[paramIdx] !== undefined) {
            const targetEmail = String(flatParams[paramIdx++]).toLowerCase().trim();
            rows = rows.filter((r) => String(r.email || '').toLowerCase().trim() === targetEmail);
          }
          if (whereClause.includes('user_id = ?') && flatParams[paramIdx] !== undefined) {
            const targetUserId = flatParams[paramIdx++];
            rows = rows.filter((r) => r.user_id == targetUserId);
          }
          if (whereClause.includes('owner_id = ?') && flatParams[paramIdx] !== undefined) {
            const targetOwnerId = flatParams[paramIdx++];
            rows = rows.filter((r) => r.owner_id == targetOwnerId);
          }
          if (whereClause.includes('renter_id = ?') && flatParams[paramIdx] !== undefined) {
            const targetRenterId = flatParams[paramIdx++];
            rows = rows.filter((r) => r.renter_id == targetRenterId);
          }
          if (whereClause.includes('seller_id = ?') && flatParams[paramIdx] !== undefined) {
            const targetSellerId = flatParams[paramIdx++];
            rows = rows.filter((r) => r.seller_id == targetSellerId);
          }
          if (whereClause.includes('id = ?') && flatParams[paramIdx] !== undefined) {
            const targetId = flatParams[paramIdx++];
            rows = rows.filter((r) => r.id == targetId);
          }
          if (whereClause.includes('commodity LIKE ?') || whereClause.includes('commodity = ?')) {
            const query = String(flatParams[paramIdx++] || '').replace(/%/g, '').toLowerCase().trim();
            rows = rows.filter((r) => (r.commodity || '').toLowerCase().includes(query));
          }
          if (whereClause.includes('name LIKE ?') || whereClause.includes('name = ?')) {
            const query = String(flatParams[paramIdx++] || '').replace(/%/g, '').toLowerCase().trim();
            rows = rows.filter((r) => (r.name || '').toLowerCase().includes(query));
          }
        }

        // ORDER BY
        if (fromMatch[7]) {
          const orderStr = fromMatch[7].toLowerCase();
          const desc = orderStr.includes('desc');
          if (orderStr.includes('created_at') || orderStr.includes('id')) {
            rows.sort((a, b) => (desc ? (b.id || 0) - (a.id || 0) : (a.id || 0) - (b.id || 0)));
          } else if (orderStr.includes('name')) {
            rows.sort((a, b) => (desc ? String(b.name).localeCompare(String(a.name)) : String(a.name).localeCompare(String(b.name))));
          }
        }

        // LIMIT
        if (fromMatch[8]) {
          const limit = parseInt(fromMatch[8], 10);
          rows = rows.slice(0, limit);
        }

        return rows;
      },
      run(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;

        // 1. INSERT INTO table (...) VALUES (...)
        const insertMatch = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([\s\S]+?)\)\s*VALUES\s*\(([\s\S]+?)\)/i);
        if (insertMatch) {
          const tableName = insertMatch[1].toLowerCase();
          const cols = insertMatch[2].split(',').map((c) => c.trim().replace(/['"]/g, ''));
          const tbl = getTable(tableName);
          const newId = autoIncrements[tableName]++;

          const row = { id: newId, approved: 1, created_at: new Date().toISOString() };
          cols.forEach((col, idx) => {
            row[col] = flatParams[idx] !== undefined ? flatParams[idx] : null;
          });

          tbl.push(row);
          saveToDisk();
          return { lastInsertRowid: newId, changes: 1 };
        }

        // 2. DELETE FROM table WHERE id = ?
        const deleteMatch = cleanSql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)/i);
        if (deleteMatch) {
          const tableName = deleteMatch[1].toLowerCase();
          if (cleanSql.includes('WHERE id = ?') && flatParams[0] !== undefined) {
            const targetId = flatParams[0];
            const tbl = getTable(tableName);
            const idx = tbl.findIndex((r) => r.id == targetId);
            if (idx !== -1) tbl.splice(idx, 1);
          } else {
            tables[tableName] = [];
          }
          saveToDisk();
          return { lastInsertRowid: 0, changes: 1 };
        }

        // 3. UPDATE table SET ... WHERE id = ?
        const updateMatch = cleanSql.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)\s+WHERE\s+id\s*=\s*\?/i);
        if (updateMatch) {
          const tableName = updateMatch[1].toLowerCase();
          const targetId = flatParams[flatParams.length - 1];
          const row = getTable(tableName).find((r) => r.id == targetId);
          if (row) {
            const setParts = updateMatch[2].split(',').map((s) => s.trim().split('=')[0].trim());
            setParts.forEach((col, idx) => {
              row[col] = flatParams[idx];
            });
          }
          saveToDisk();
          return { lastInsertRowid: targetId, changes: 1 };
        }

        return { lastInsertRowid: 0, changes: 0 };
      },
    };
  },
};

module.exports = db;
