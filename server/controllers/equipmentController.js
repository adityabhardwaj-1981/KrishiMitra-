/**
 * Equipment rental controllers.
 */
const db = require('../config/db');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const createEquipment = asyncHandler(async (req, res, next) => {
  const { name, category, description, hourly_rate, daily_rate, location } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  const result = db.prepare(
    `INSERT INTO equipment (owner_id, name, category, description, hourly_rate, daily_rate, location, image)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(req.user.id, name, category || null, description || null, hourly_rate || 0, daily_rate || 0, location || null, image);
  const eq = db.prepare('SELECT * FROM equipment WHERE id = ?').get(result.lastInsertRowid);
  return success(res, eq, 'Equipment listed.', 201);
});

const listEquipment = asyncHandler(async (req, res, next) => {
  const { category, q } = req.query;
  let sql = 'SELECT e.*, u.name AS owner_name, u.phone FROM equipment e JOIN users u ON u.id = e.owner_id WHERE e.availability = ?';
  const params = ['available'];
  if (category) { sql += ' AND e.category = ?'; params.push(category); }
  if (q) { sql += ' AND e.name LIKE ?'; params.push(`%${q}%`); }
  sql += ' ORDER BY e.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  return success(res, rows, 'Available equipment.');
});

const getMine = asyncHandler(async (req, res, next) => {
  const rows = db.prepare('SELECT * FROM equipment WHERE owner_id = ? ORDER BY created_at DESC').all(req.user.id);
  return success(res, rows, 'My equipment.');
});

const requestRental = asyncHandler(async (req, res, next) => {
  const { equipment_id, start_date, end_date, total_cost } = req.body;
  const eq = db.prepare('SELECT * FROM equipment WHERE id = ?').get(equipment_id);
  if (!eq) throw new AppError('Equipment not found.', 404);
  if (eq.owner_id === req.user.id) throw new AppError('You cannot rent your own equipment.', 400);
  if (eq.availability !== 'available') throw new AppError('Equipment is not available.', 400);
  const result = db.prepare(
    'INSERT INTO rentals (equipment_id, renter_id, start_date, end_date, total_cost) VALUES (?,?,?,?,?)'
  ).run(equipment_id, req.user.id, start_date, end_date, total_cost || 0);
  const rental = db.prepare('SELECT r.*, e.name AS equipment_name, e.image FROM rentals r JOIN equipment e ON e.id = r.equipment_id WHERE r.id = ?').get(result.lastInsertRowid);
  return success(res, rental, 'Rental requested. Owner will confirm.', 201);
});

const setStatus = asyncHandler(async (req, res, next) => {
  const rental = db.prepare('SELECT * FROM rentals WHERE id = ?').get(req.params.id);
  if (!rental) throw new AppError('Rental not found.', 404);
  const status = req.body.status;
  const allowed = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
  if (!allowed.includes(status)) throw new AppError('Invalid status.', 400);
  const eq = db.prepare('SELECT * FROM equipment WHERE id = ?').get(rental.equipment_id);
  // Owners can approve/reject; renters can cancel
  if (eq.owner_id !== req.user.id && rental.renter_id !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('Not authorized.', 403);
  }
  if (['approved', 'rejected'].includes(status) && eq.owner_id !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('Only the equipment owner can approve or reject.', 403);
  }
  db.prepare('UPDATE rentals SET status = ? WHERE id = ?').run(status, rental.id);
  if (status === 'approved') db.prepare("UPDATE equipment SET availability = 'rented' WHERE id = ?").run(rental.equipment_id);
  if (['completed', 'cancelled', 'rejected'].includes(status)) db.prepare("UPDATE equipment SET availability = 'available' WHERE id = ?").run(rental.equipment_id);
  const updated = db.prepare('SELECT r.*, e.name AS equipment_name, e.availability FROM rentals r JOIN equipment e ON e.id = r.equipment_id WHERE r.id = ?').get(rental.id);
  return success(res, updated, 'Rental status updated.');
});

const myRentals = asyncHandler(async (req, res, next) => {
  const asRenter = db.prepare('SELECT r.*, e.name AS equipment_name, e.image, u.name AS owner_name FROM rentals r JOIN equipment e ON e.id = r.equipment_id JOIN users u ON u.id = e.owner_id WHERE r.renter_id = ? ORDER BY r.created_at DESC').all(req.user.id);
  const asOwner = db.prepare('SELECT r.*, e.name AS equipment_name, e.image, u.name AS renter_name FROM rentals r JOIN equipment e ON e.id = r.equipment_id JOIN users u ON u.id = r.renter_id WHERE e.owner_id = ? ORDER BY r.created_at DESC').all(req.user.id);
  return success(res, { as_renter: asRenter, as_owner: asOwner }, 'Rental records.');
});

module.exports = { createEquipment, listEquipment, getMine, requestRental, setStatus, myRentals };

