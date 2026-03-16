import express from 'express';
import { getChatHistory, sendMessage, getConversations, deleteMessage, markAsRead, getUnreadCount, toggleReaction, initiateConversation } from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.get('/initiate/:workerId', protect, initiateConversation);
router.get('/:bookingId', protect, getChatHistory);
router.post('/', protect, sendMessage);
router.post('/:messageId/reaction', protect, toggleReaction);
router.put('/:bookingId/read', protect, markAsRead);
router.delete('/:messageId', protect, deleteMessage);

export default router;
