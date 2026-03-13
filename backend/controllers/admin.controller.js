import { User } from '../models/User.js';
import { Worker } from '../models/Worker.js';
import { Booking } from '../models/Booking.js';
import { Review } from '../models/Review.js';
import { Notification } from '../models/Notification.js';

export const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalWorkers = await Worker.countDocuments({ isVerified: true });
        const pendingVerifications = await Worker.countDocuments({ verificationStatus: 'pending' });
        const activeBookings = await Booking.countDocuments({ status: 'accepted' });

        // Sum all price * completed jobs for total economic activity
        const completedBookings = await Booking.find({ status: 'completed' }).populate('worker', 'price');
        const totalEconomicValue = completedBookings.reduce((sum, b) => sum + (b.worker?.price || 0), 0);

        res.json({
            users: totalUsers,
            workers: totalWorkers,
            pending: pendingVerifications,
            activeJobs: activeBookings,
            totalValue: totalEconomicValue
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllWorkersAdmin = async (req, res) => {
    try {
        const workers = await Worker.find()
            .populate('user', 'name email profileImage')
            .select('+idProof')
            .sort({ createdAt: -1 });
        res.json(workers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAdminBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('user', 'name email')
            .populate('worker', 'user price')
            .populate({
                path: 'worker',
                populate: { path: 'user', select: 'name' }
            })
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleWorkerBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const worker = await Worker.findById(id).populate('user');
        if (!worker) return res.status(404).json({ message: 'Worker not found' });

        const user = await User.findById(worker.user._id);
        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, isBlocked: user.isBlocked });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleUserBlock = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isBlocked = !user.isBlocked;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPlatformRevenueData = async (req, res) => {
    try {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            last7Days.push(d);
        }

        const data = await Promise.all(last7Days.map(async (day) => {
            const nextDay = new Date(day);
            nextDay.setDate(nextDay.getDate() + 1);

            const bookings = await Booking.find({
                status: 'completed',
                updatedAt: { $gte: day, $lt: nextDay }
            }).populate('worker', 'price');

            const revenue = bookings.reduce((sum, b) => sum + (b.worker?.price || 0), 0);
            return {
                name: day.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue
            };
        }));

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePlatformSettings = async (req, res) => {
    res.json({ message: 'Settings updated' });
};

export const getServiceTypeBreakdown = async (req, res) => {
    try {
        const breakdown = await Booking.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: '$serviceType', count: { $sum: 1 } } }
        ]);

        const total = breakdown.reduce((sum, item) => sum + item.count, 0);
        const data = breakdown.map(item => ({
            name: item._id || 'Other',
            value: Math.round((item.count / (total || 1)) * 100)
        }));

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createWorker = async (req, res) => {
    try {
        const { name, email, password, skills, experience, location, price, bio } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        user = await User.create({
            name,
            email,
            password,
            role: 'worker'
        });

        const worker = await Worker.create({
            user: user._id,
            skills: skills || [],
            experience: experience || 0,
            location: location || 'N/A',
            price: price || 0,
            bio: bio || '',
            verificationStatus: 'approved',
            isVerified: true,
            isAvailable: true
        });

        res.status(201).json({ user, worker });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const sendGlobalNotification = async (req, res) => {
    try {
        const { title, message, targetRole, icon } = req.body;

        let query = {};
        if (targetRole && targetRole !== 'all') {
            query.role = targetRole;
        }

        const users = await User.find(query);

        await Promise.all(users.map(u =>
            Notification.create({
                user: u._id,
                type: 'system',
                title,
                message,
                icon: icon || '📢'
            })
        ));

        if (req.io) {
            req.io.emit('new_notification', { title, message });
        }

        res.json({ message: `Notification sent to ${users.length} users` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
