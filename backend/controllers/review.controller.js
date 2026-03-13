import { Review } from '../models/Review.js';
import { Worker } from '../models/Worker.js';

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res) => {
    const { workerId, bookingId, rating, comment } = req.body;

    try {
        const review = await Review.create({
            user: req.user._id,
            worker: workerId,
            booking: bookingId,
            rating,
            comment
        });

        // Update worker rating
        const reviews = await Review.find({ worker: workerId });
        const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

        await Worker.findByIdAndUpdate(workerId, {
            rating: avgRating,
            reviewCount: reviews.length
        });

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reviews for a worker
// @route   GET /api/reviews/worker/:workerId
// @access  Public
export const getWorkerReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ worker: req.params.workerId })
            .populate('user', 'name profileImage')
            .sort('-createdAt');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reviews by current user
// @route   GET /api/reviews/my-reviews
// @access  Private
export const getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user._id })
            .populate('worker', 'user')
            .populate({
                path: 'worker',
                populate: { path: 'user', select: 'name profileImage' }
            })
            .sort('-createdAt');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
