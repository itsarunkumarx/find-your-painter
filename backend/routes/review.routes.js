import express from 'express';
import { createReview, getWorkerReviews, getUserReviews } from '../controllers/review.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createReview);

router.route('/worker/:workerId')
    .get(getWorkerReviews);

router.get('/my-reviews', protect, getUserReviews);

export default router;
