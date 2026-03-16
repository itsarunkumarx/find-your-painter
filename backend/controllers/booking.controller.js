import { Booking } from '../models/Booking.js';
import { Worker } from '../models/Worker.js';
import { createNotification } from './notification.controller.js';
// We need a way to emit socket events. 
// Ideally we pass io instance to controller or use a singleton/global.
// For simplicity in this structure, we'll assume we can't easily import `io` from server.js due to circular dependency.
// We will just implement the logic and leave the socket emit for the route or specific service function.
// Or we can attach io to req in server.js middleware!

export const createBooking = async (req, res) => {
    const { workerId, date, message, serviceType, location } = req.body;
    try {
        const booking = await Booking.create({
            user: req.user._id,
            worker: workerId,
            date,
            message,
            serviceType,
            location
        });

        const populatedBooking = await Booking.findById(booking._id)
            .populate('user', 'name')
            .populate('worker');

        // Notify Worker
        await createNotification({
            user: populatedBooking.worker.user,
            type: 'booking_new',
            title: 'New Booking Request',
            message: `${populatedBooking.user.name} has requested a new service: ${serviceType}`,
            link: '/worker-jobs',
            icon: '🎨',
            io: req.io
        });

        // Emit socket event if io is attached to req
        if (req.io) {
            req.io.emit('new_booking', populatedBooking);
            // In a real app, emit to specific worker room: req.io.to(workerId).emit(...)
        }

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyBookings = async (req, res) => {
    try {
        // Find bookings where user is me OR worker -> user is me
        // This is complex because Worker model links to User.
        // Simplified: User sees bookings they made. 
        // Workers need another endpoint or logic.
        const bookings = await Booking.find({ user: req.user._id })
            .populate({
                path: 'worker',
                populate: { path: 'user', select: 'name profileImage' }
            })
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getWorkerBookings = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user._id });
        if (!worker) return res.status(404).json({ message: 'Worker profile not found' });

        const bookings = await Booking.find({ worker: worker._id })
            .populate('user', 'name email phoneNumber profileImage')
            .populate({
                path: 'worker',
                populate: { path: 'user', select: 'name profileImage' }
            })
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateBookingStatus = async (req, res) => {
    const { status, subStatus, paymentStatus } = req.body;
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const oldStatus = booking.status;
        if (status) booking.status = status;
        if (subStatus) booking.subStatus = subStatus;
        if (paymentStatus) booking.paymentStatus = paymentStatus;

        await booking.save();

        // Notify user if status changed
        if (status && status !== oldStatus) {
            let title = 'Booking Update';
            let message = `Your booking status for ${booking.serviceType} has changed to ${status}.`;
            let type = 'system';

            if (status === 'accepted') {
                title = 'Booking Accepted!';
                message = `Great news! The painter has accepted your request.`;
                type = 'booking_accepted';
            } else if (status === 'completed') {
                title = 'Project Completed';
                message = `Your painting project has been marked as completed. Please leave a review!`;
                type = 'booking_completed';
            }

            await createNotification({
                user: booking.user,
                type,
                title,
                message,
                link: '/my-bookings',
                icon: '✅',
                io: req.io
            });
        }

        if (req.io) {
            req.io.emit('booking_status_update', { id: booking._id, status, subStatus, paymentStatus });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
