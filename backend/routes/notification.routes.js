import express from 'express';
import { 
    getNotifications, 
    getUnreadCount, 
    markAllRead, 
    markOneRead, 
    deleteNotification, 
    subscribe,
    unsubscribe,
    sendMessageNotification
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.post('/subscribe', protect, subscribe);
router.post('/unsubscribe', protect, unsubscribe);
router.post('/test-push', protect, async (req, res) => {
    try {
        await sendMessageNotification(req.user.id, 'FYP Command', 'This is a test signal. Push Intelligence active.', 'test');
        res.json({ message: 'Test signal dispatched' });
    } catch (error) {
        console.error('Test push error:', error);
        res.status(500).json({ message: 'Failed to dispatch test signal' });
    }
});
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markOneRead);
router.delete('/:id', protect, deleteNotification);

export default router;
