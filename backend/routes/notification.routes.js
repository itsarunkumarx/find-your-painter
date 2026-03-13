import express from 'express';
import { getNotifications, getUnreadCount, markAllRead, markOneRead, deleteNotification, subscribe } from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.post('/subscribe', protect, subscribe);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markOneRead);
router.delete('/:id', protect, deleteNotification);

export default router;
