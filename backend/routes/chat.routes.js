import express from 'express';
import { getChatHistory, sendMessage, getConversations, deleteMessage, markAsRead, getUnreadCount } from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.get('/:bookingId', protect, getChatHistory);
router.post('/', protect, sendMessage);
router.put('/:bookingId/read', protect, markAsRead);
router.delete('/:messageId', protect, deleteMessage);

export default router;
