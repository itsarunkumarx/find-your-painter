import express from 'express';
import {
    getWorkers, getWorkerById, updateWorkerProfile, applyToBecomeWorker,
    verifyWorker, getPendingWorkers, toggleAvailability, getMyProfile,
    getWorkerStats, getWorkerEarnings, addPortfolioImage, deletePortfolioImage, updatePaymentDetails,
    togglePortfolioFeatured
} from '../controllers/worker.controller.js';
import { protect, adminObj } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getWorkers);
router.get('/stats', protect, getWorkerStats);
router.get('/earnings', protect, getWorkerEarnings);
router.post('/apply', protect, applyToBecomeWorker);
router.get('/pending', protect, adminObj, getPendingWorkers);
router.get('/profile', protect, getMyProfile);
router.put('/profile', protect, updateWorkerProfile);
router.put('/availability', protect, toggleAvailability);
router.put('/payment-details', protect, updatePaymentDetails);
router.post('/portfolio', protect, addPortfolioImage);
router.delete('/portfolio/:imgId', protect, deletePortfolioImage);
router.put('/portfolio/:imgId/featured', protect, togglePortfolioFeatured);
router.put('/:id/verify', protect, adminObj, verifyWorker);
router.get('/:id', protect, getWorkerById);

export default router;
