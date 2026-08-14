import express from 'express';
import { Booking } from '../models/Booking.js';
import { protect } from '../middleware/auth.middleware.js';
import { createNotification } from '../controllers/notification.controller.js';

const router = express.Router();

// @desc    Simulate payment success
// @route   POST /api/payments/verify
// @access  Private
router.post('/verify', protect, async (req, res) => {
    try {
        const { bookingId, paymentId } = req.body;
        const booking = await Booking.findById(bookingId).populate('worker', 'user');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.paymentStatus = 'paid';
        booking.subStatus = 'ready-to-start';
        await booking.save();

        // Notify Worker
        await createNotification({
            user: booking.worker.user,
            type: 'payment',
            title: 'Payment Received',
            message: `Payment of ₹${booking.amount || 0} has been confirmed for project: ${booking.serviceType}.`,
            icon: '💰',
            io: req.io
        });

        res.json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Select Pay After Work (Cash)
// @route   POST /api/payments/select-post-paid
// @access  Private
router.post('/select-post-paid', protect, async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId).populate('worker', 'user');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.paymentMethod = 'cash';
        booking.paymentStatus = 'post_paid_pending';
        // When selecting cash, it's ready to start if it was pending payment
        if (booking.subStatus === 'not_started') {
            booking.subStatus = 'ready-to-start';
        }
        await booking.save();

        // Notify Worker
        await createNotification({
            user: booking.worker.user,
            type: 'payment',
            title: 'Payment Method: Cash',
            message: `User ${req.user.name} selected 'Pay After Work' for project: ${booking.serviceType}.`,
            icon: '💵',
            io: req.io
        });

        res.json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Worker confirms cash payment received
// @route   POST /api/payments/confirm-cash-payment
// @access  Private
router.post('/confirm-cash-payment', protect, async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId).populate('user');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Ensure only the assigned worker can confirm
        if (booking.worker.toString() !== req.user.id && req.user.role !== 'admin') {
            const worker = await mongoose.model('Worker').findOne({ user: req.user.id });
            if (!worker || booking.worker.toString() !== worker._id.toString()) {
                return res.status(403).json({ message: 'Unauthorized to confirm this payment' });
            }
        }

        booking.paymentStatus = 'paid';
        await booking.save();

        // Notify User
        await createNotification({
            user: booking.user._id,
            type: 'payment',
            title: 'Payment Confirmed',
            message: `Worker has confirmed receipt of your cash payment for ${booking.serviceType}.`,
            icon: '✅',
            io: req.io
        });

        res.json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
