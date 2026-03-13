import express from 'express';
import { createBooking, getMyBookings, updateBookingStatus, getWorkerBookings } from '../controllers/booking.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/worker-bookings', protect, getWorkerBookings);
router.put('/:id/status', protect, updateBookingStatus);

export default router;
