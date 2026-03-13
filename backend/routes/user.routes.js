import express from 'express';
import { updateProfile, updatePreferences, getProfile, toggleSaveWorker, getSavedWorkers, getUserStats, addToRecentlyViewed, getRecentlyViewed } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/profile').get(protect, getProfile).put(protect, updateProfile);
router.route('/preferences').put(protect, updatePreferences);
router.get('/saved-painters', protect, getSavedWorkers);
router.put('/save-painter/:workerId', protect, toggleSaveWorker);
router.get('/stats', protect, getUserStats);

router.get('/recently-viewed', protect, getRecentlyViewed);
router.put('/recently-viewed/:workerId', protect, addToRecentlyViewed);

export default router;
