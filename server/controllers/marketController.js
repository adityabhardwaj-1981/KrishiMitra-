/**
 * Market price controllers.
 * Only returns seed/recorded prices; never fabricates. Tracks trend by comparing records.
 */
const db = require('../config/db');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const listPrices = asyncHandler(async (req, res, next) => {
  const commodity = req.query.commodity;
  let rows;
  if (commodity) {
    rows = db.prepare('SELECT * FROM market_prices WHERE commodity LIKE ? ORDER BY price_date DESC').all(`%${commodity}%`);
  } else {
    rows = db.prepare('SELECT * FROM market_prices ORDER BY commodity, price_date DESC').all();
  }
  // Compute trends: compare latest vs previous record per commodity
  const commodities = db.prepare('SELECT DISTINCT commodity FROM market_prices').all();
  const trends = {};
  commodities.forEach((c) => {
    const recs = db.prepare('SELECT * FROM market_prices WHERE commodity = ? ORDER BY price_date DESC LIMIT 2').all(c.commodity);
    if (recs.length >= 2) {
      const delta = (recs[0].modal_price || 0) - (recs[1].modal_price || 0);
      trends[c.commodity] = { change: Math.round(delta * 100) / 100, direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable' };
    } else if (recs.length === 1) {
      trends[c.commodity] = { change: 0, direction: 'stable' };
    }
  });
  return success(res, { prices: rows, trends }, 'Market prices.');
});

const getCommodity = asyncHandler(async (req, res, next) => {
  const rows = db.prepare('SELECT * FROM market_prices WHERE commodity = ? ORDER BY price_date DESC').all(req.params.commodity);
  if (rows.length === 0) throw new AppError('No price records found for this commodity.', 404);
  return success(res, rows, 'Commodity price history.');
});

module.exports = { listPrices, getCommodity };

