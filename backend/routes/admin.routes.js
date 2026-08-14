import express from 'express';
import {
    createWorker, sendGlobalNotification, getAllUsers, getAdminBookings,
    toggleWorkerBlock, toggleUserSuspension, deleteUser, toggleWorkerSuspension,
    deleteWorker, getAdminStats, getPlatformRevenueData, getServiceTypeBreakdown,
    getAllWorkersAdmin, toggleUserBlock, updatePlatformSettings, getAuditLogs, getPlatformSettings
} from '../controllers/admin.controller.js';
import { verifyWorker, getPendingWorkers } from '../controllers/worker.controller.js';
import { protect, adminObj } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/stats', protect, adminObj, getAdminStats);
router.get('/revenue', protect, adminObj, getPlatformRevenueData);
router.get('/service-breakdown', protect, adminObj, getServiceTypeBreakdown);
router.get('/audit-logs', protect, adminObj, getAuditLogs);
router.get('/users', protect, adminObj, getAllUsers);
router.get('/workers', protect, adminObj, getAllWorkersAdmin);
router.get('/bookings', protect, adminObj, getAdminBookings);
router.put('/users/:id/block', protect, adminObj, toggleUserBlock);
router.put('/users/:id/suspend', protect, adminObj, toggleUserSuspension);
router.delete('/users/:id', protect, adminObj, deleteUser);

router.put('/workers/:id/block', protect, adminObj, toggleWorkerBlock);
router.put('/workers/:id/suspend', protect, adminObj, toggleWorkerSuspension);
router.delete('/workers/:id', protect, adminObj, deleteWorker);

router.get('/workers/pending', protect, adminObj, getPendingWorkers);
router.put('/workers/:id/verify', protect, adminObj, verifyWorker);
router.post('/workers', protect, adminObj, createWorker);
router.post('/notify', protect, adminObj, sendGlobalNotification);
router.get('/settings', protect, adminObj, getPlatformSettings);
router.put('/settings', protect, adminObj, updatePlatformSettings);

export default router;
