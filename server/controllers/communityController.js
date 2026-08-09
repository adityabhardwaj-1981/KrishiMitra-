/**
 * Community controllers: posts, likes, comments.
 */
const db = require('../config/db');
const { success } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const createPost = asyncHandler(async (req, res, next) => {
  const { title, content, category, tags } = req.body;
  const result = db.prepare(
    'INSERT INTO community_posts (author_id, title, content, category, tags) VALUES (?,?,?,?,?)'
  ).run(req.user.id, title, content, category || null, tags ? JSON.stringify(tags) : null);
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(result.lastInsertRowid);
  return success(res, post, 'Post created.', 201);
});

const listPosts = asyncHandler(async (req, res, next) => {
  const { category, q } = req.query;
  let sql = 'SELECT p.*, u.name AS author_name, u.avatar, (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count FROM community_posts p JOIN users u ON u.id = p.author_id WHERE p.status = ?';
  const params = ['active'];
  if (category) { sql += ' AND p.category = ?'; params.push(category); }
  if (q) { sql += ' AND (p.title LIKE ? OR p.content LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY p.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  return success(res, rows, 'Community posts.');
});

const getPost = asyncHandler(async (req, res, next) => {
  const post = db.prepare('SELECT p.*, u.name AS author_name FROM community_posts p JOIN users u ON u.id = p.author_id WHERE p.id = ?').get(req.params.id);
  if (!post) throw new AppError('Post not found.', 404);
  const comments = db.prepare('SELECT c.*, u.name AS user_name FROM comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.created_at').all(post.id);
  return success(res, { ...post, comments }, 'Post details.');
});

const likePost = asyncHandler(async (req, res, next) => {
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id);
  if (!post) throw new AppError('Post not found.', 404);
  db.prepare('UPDATE community_posts SET likes = likes + 1 WHERE id = ?').run(post.id);
  const updated = db.prepare('SELECT likes FROM community_posts WHERE id = ?').get(post.id);
  return success(res, updated, 'Post liked.');
});

const addComment = asyncHandler(async (req, res, next) => {
  const { content } = req.body;
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id);
  if (!post) throw new AppError('Post not found.', 404);
  const result = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?,?,?)').run(post.id, req.user.id, content);
  const comment = db.prepare('SELECT c.*, u.name AS user_name FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?').get(result.lastInsertRowid);
  return success(res, comment, 'Comment added.', 201);
});

const deletePost = asyncHandler(async (req, res, next) => {
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id);
  if (!post) throw new AppError('Post not found.', 404);
  if (post.author_id !== req.user.id && req.user.role !== 'admin') throw new AppError('Not authorized.', 403);
  db.prepare('DELETE FROM comments WHERE post_id = ?').run(post.id);
  db.prepare('DELETE FROM community_posts WHERE id = ?').run(post.id);
  return success(res, null, 'Post deleted.');
});

module.exports = { createPost, listPosts, getPost, likePost, addComment, deletePost };

