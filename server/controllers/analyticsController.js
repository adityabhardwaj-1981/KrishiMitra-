/**
 * Analytics controller - derives dashboards from farm records.
 */
const db = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getAnalytics = asyncHandler(async (req, res, next) => {
  const uid = req.user.id;

  // Income & expense totals
  const income = db.prepare('SELECT COALESCE(SUM(amount),0) AS total FROM farm_records WHERE user_id = ? AND record_type = ?').get(uid, 'income').total;
  const expense = db.prepare('SELECT COALESCE(SUM(amount),0) AS total FROM farm_records WHERE user_id = ? AND record_type = ?').get(uid, 'expense').total;
  const profit = income - expense;

  // Monthly breakdown for trends
  const monthly = db.prepare(
    `SELECT strftime('%Y-%m', record_date) AS month, record_type, SUM(amount) AS total
     FROM farm_records WHERE user_id = ? GROUP BY month, record_type ORDER BY month`
  ).all(uid);

  const months = [...new Set(monthly.map((m) => m.month))];
  const incomeSeries = months.map((m) => monthly.find((r) => r.month === m && r.record_type === 'income')?.total || 0);
  const expenseSeries = months.map((m) => monthly.find((r) => r.month === m && r.record_type === 'expense')?.total || 0);

  // Crop performance
  const cropPerf = db.prepare(
    `SELECT COALESCE(c.name, 'Other') AS crop,
       SUM(CASE WHEN fr.record_type = 'income' THEN fr.amount ELSE 0 END) AS income,
       SUM(CASE WHEN fr.record_type = 'expense' THEN fr.amount ELSE 0 END) AS expense
     FROM farm_records fr LEFT JOIN crops c ON c.id = fr.crop_id
     WHERE fr.user_id = ? GROUP BY crop ORDER BY income DESC`
  ).all(uid);

  // Activity summary
  const activitySummary = db.prepare(
    `SELECT activity_type, COUNT(*) AS count, COALESCE(SUM(cost),0) AS cost
     FROM farm_activities WHERE user_id = ? GROUP BY activity_type`
  ).all(uid);

  // Expense by category
  const expenseByCategory = db.prepare(
    `SELECT category, COALESCE(SUM(amount),0) AS total FROM farm_records WHERE user_id = ? AND record_type = 'expense' GROUP BY category ORDER BY total DESC`
  ).all(uid);

  // Production trend (quantity by month)
  const productionTrend = db.prepare(
    `SELECT strftime('%Y-%m', record_date) AS month, COALESCE(SUM(quantity),0) AS quantity
     FROM farm_records WHERE user_id = ? AND record_type = 'income' GROUP BY month ORDER BY month`
  ).all(uid);

  return success(res, {
    summary: { income, expense, profit },
    monthly: { months, income: incomeSeries, expense: expenseSeries },
    cropPerformance: cropPerf,
    activitySummary,
    expenseByCategory,
    productionTrend,
  }, 'Analytics generated.');
});

module.exports = { getAnalytics };
