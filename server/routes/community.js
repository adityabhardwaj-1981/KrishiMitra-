const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/communityController');

router.get('/', ctrl.listPosts);
router.get('/:id', ctrl.getPost);
router.post('/', authenticate, ctrl.createPost);
router.post('/:id/like', authenticate, ctrl.likePost);
router.post('/:id/comment', authenticate, ctrl.addComment);
router.delete('/:id', authenticate, ctrl.deletePost);

module.exports = router;

