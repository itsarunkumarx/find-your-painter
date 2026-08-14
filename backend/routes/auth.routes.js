import express from 'express';
import { registerUser, loginUser, googleAuthUser, getSupportAdmin } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuthUser);
router.get('/support-admin', protect, getSupportAdmin);

export default router;

