import { Router } from 'express';
import { getChatUsers, getMessages, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/users', protect, getChatUsers);
router.get('/:userId', protect, getMessages);
router.post('/', protect, sendMessage);

export default router;
