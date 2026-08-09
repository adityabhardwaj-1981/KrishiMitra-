/**
 * Marketplace controllers for listing & browsing products.
 */
const db = require('../config/db');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const createItem = asyncHandler(async (req, res, next) => {
  const { title, description, category, price, quantity, unit, location } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const result = db.prepare(
    `INSERT INTO marketplace_items (seller_id, title, description, category, price, quantity, unit, location, image)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(req.user.id, title, description || null, category || null, price || 0, quantity || null, unit || null, location || null, image);
  const item = db.prepare('SELECT * FROM marketplace_items WHERE id = ?').get(result.lastInsertRowid);
  return success(res, item, 'Listing created.', 201);
});

const listItems = asyncHandler(async (req, res, next) => {
  const { category, q } = req.query;
  let sql = 'SELECT mi.*, u.name AS seller_name, u.location AS seller_location FROM marketplace_items mi JOIN users u ON u.id = mi.seller_id WHERE mi.status = ?';
  const params = ['active'];
  if (category) { sql += ' AND mi.category = ?'; params.push(category); }
  if (q) { sql += ' AND mi.title LIKE ?'; params.push(`%${q}%`); }
  sql += ' ORDER BY mi.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  return success(res, rows, 'Marketplace listings.');
});

const getItem = asyncHandler(async (req, res, next) => {
  const row = db.prepare('SELECT mi.*, u.name AS seller_name FROM marketplace_items mi JOIN users u ON u.id = mi.seller_id WHERE mi.id = ?').get(req.params.id);
  if (!row) throw new AppError('Listing not found.', 404);
  return success(res, row, 'Listing details.');
});

const getMine = asyncHandler(async (req, res, next) => {
  const rows = db.prepare('SELECT * FROM marketplace_items WHERE seller_id = ? ORDER BY created_at DESC').all(req.user.id);
  return success(res, rows, 'My listings.');
});

const updateItem = asyncHandler(async (req, res, next) => {
  const item = db.prepare('SELECT * FROM marketplace_items WHERE id = ?').get(req.params.id);
  if (!item) throw new AppError('Listing not found.', 404);
  if (item.seller_id !== req.user.id && req.user.role !== 'admin') throw new AppError('Not authorized.', 403);
  const { title, description, category, price, status } = req.body;
  db.prepare('UPDATE marketplace_items SET title=?, description=?, category=?, price=?, status=? WHERE id=?')
    .run(title || item.title, description ?? item.description, category || item.category, price ?? item.price, status || item.status, item.id);
  const updated = db.prepare('SELECT * FROM marketplace_items WHERE id = ?').get(item.id);
  return success(res, updated, 'Listing updated.');
});

const deleteItem = asyncHandler(async (req, res, next) => {
  const item = db.prepare('SELECT * FROM marketplace_items WHERE id = ?').get(req.params.id);
  if (!item) throw new AppError('Listing not found.', 404);
  if (item.seller_id !== req.user.id && req.user.role !== 'admin') throw new AppError('Not authorized.', 403);
  db.prepare('DELETE FROM marketplace_items WHERE id = ?').run(item.id);
  return success(res, null, 'Listing deleted.');
});

module.exports = { createItem, listItems, getItem, getMine, updateItem, deleteItem };

