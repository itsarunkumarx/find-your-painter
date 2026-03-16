import express from 'express';
import { getCallHistory } from '../controllers/call.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/history', protect, getCallHistory);

export default router;
