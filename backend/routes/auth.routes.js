import express from 'express';
import { registerUser, loginUser, googleAuthUser } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuthUser);

export default router;

