import express from 'express';
import { getLanguages, getLanguageByCode, upsertLanguage } from '../controllers/language.controller.js';
import { protect, adminObj } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(getLanguages)
    .post(protect, adminObj, upsertLanguage);

router.route('/:code')
    .get(getLanguageByCode);

export default router;
