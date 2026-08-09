/**
 * AI Chat controller. Stores chat history and generates responses via the AI layer.
 */
const db = require('../config/db');
const aiService = require('../services/aiEngine');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const sendMessage = asyncHandler(async (req, res, next) => {
  const { message, context } = req.body;
  if (!message || !message.trim()) throw new AppError('Message is required.', 400);

  db.prepare('INSERT INTO chat_messages (user_id, role, content, context) VALUES (?,?,?,?)').run(
    req.user.id, 'user', message, context ? JSON.stringify(context) : null
  );

  // Build recent history (last 10) for context
  const history = db
    .prepare('SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT 10')
    .all(req.user.id)
    .reverse();

  const response = await aiService.chat(
    { history, latest: message },
    { user_id: req.user.id, ...(context || {}) }
  );

  db.prepare('INSERT INTO chat_messages (user_id, role, content, context) VALUES (?,?,?,?)').run(
    req.user.id, 'assistant', response.content, response.provider || null
  );

  return success(res, { reply: response.content, provider: response.provider }, 'Reply generated.');
});

const getHistory = asyncHandler(async (req, res, next) => {
  const rows = db.prepare('SELECT id, role, content, created_at FROM chat_messages WHERE user_id = ? ORDER BY id').all(req.user.id);
  return success(res, rows, 'Chat history.');
});

const clearHistory = asyncHandler(async (req, res, next) => {
  db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(req.user.id);
  return success(res, null, 'Chat history cleared.');
});

module.exports = { sendMessage, getHistory, clearHistory };

