import { Router } from 'express';
import { getPosts, createPost, toggleLikePost, createComment } from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Routes
router.get('/', getPosts);
router.post('/', protect, createPost);
router.put('/:id/like', protect, toggleLikePost);
router.post('/:id/comment', protect, createComment);

export default router;
