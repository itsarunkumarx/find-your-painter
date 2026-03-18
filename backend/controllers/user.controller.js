import { User } from '../models/User.js';
import { Worker } from '../models/Worker.js';
import bcrypt from 'bcryptjs';

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
            user.profileImage = req.body.profileImage || user.profileImage;
            user.address = req.body.address || user.address;
            user.customRingtone = req.body.customRingtone || user.customRingtone;
            user.customOutgoingTone = req.body.customOutgoingTone || user.customOutgoingTone;
            if (req.body.notificationPreferences) {
                user.notificationPreferences = { ...user.notificationPreferences, ...req.body.notificationPreferences };
            }
            if (req.body.password) user.password = req.body.password;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email,
                role: updatedUser.role, phoneNumber: updatedUser.phoneNumber,
                profileImage: updatedUser.profileImage, uiPreferences: updatedUser.uiPreferences,
                notificationPreferences: updatedUser.notificationPreferences,
                address: updatedUser.address, customRingtone: updatedUser.customRingtone,
                customOutgoingTone: updatedUser.customOutgoingTone
            });
        } else { res.status(404).json({ message: 'User not found' }); }
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const updatePreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.uiPreferences = { ...user.uiPreferences, ...req.body };
            const updatedUser = await user.save();
            res.json(updatedUser.uiPreferences);
        } else { res.status(404).json({ message: 'User not found' }); }
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').populate('savedWorkers');
        if (user) { res.json(user); }
        else { res.status(404).json({ message: 'User not found' }); }
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const toggleSaveWorker = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const workerId = req.params.workerId;
        const isSaved = user.savedWorkers.includes(workerId);
        if (isSaved) {
            user.savedWorkers = user.savedWorkers.filter(id => id.toString() !== workerId);
        } else {
            user.savedWorkers.push(workerId);
        }
        await user.save();
        res.json({ saved: !isSaved, savedWorkers: user.savedWorkers });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getSavedWorkers = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'savedWorkers',
            populate: { path: 'user', select: 'name profileImage' }
        });
        res.json(user.savedWorkers || []);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getUserStats = async (req, res) => {
    try {
        const { Booking } = await import('../models/Booking.js');
        const bookings = await Booking.find({ user: req.user._id }).populate('worker', 'price');

        const totalSpent = bookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.worker?.price || 0), 0);

        const activeProjects = bookings.filter(b => ['pending', 'accepted'].includes(b.status)).length;
        const completedProjects = bookings.filter(b => b.status === 'completed').length;

        res.json({
            totalSpent,
            activeProjects,
            completedProjects,
            totalProjects: bookings.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addToRecentlyViewed = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { workerId } = req.params;

        // Remove if already exists (to move to front)
        user.recentlyViewed = user.recentlyViewed.filter(id => id.toString() !== workerId);

        // Add to front
        user.recentlyViewed.unshift(workerId);

        // Keep only top 6
        if (user.recentlyViewed.length > 6) {
            user.recentlyViewed = user.recentlyViewed.slice(0, 6);
        }

        await user.save();
        res.json({ success: true, recentlyViewed: user.recentlyViewed });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRecentlyViewed = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'recentlyViewed',
            populate: { path: 'user', select: 'name profileImage' }
        });
        res.json(user.recentlyViewed || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserDashboardData = async (req, res) => {
    try {
        const { Booking } = await import('../models/Booking.js');
        const userId = req.user._id;

        const [user, workers, bookings, workerStats] = await Promise.all([
            User.findById(userId).populate([
                { path: 'savedWorkers', populate: { path: 'user', select: 'name profileImage' } },
                { path: 'recentlyViewed', populate: { path: 'user', select: 'name profileImage' } }
            ]),
            Worker.find({ isVerified: true, isAvailable: true }).populate('user', 'name profileImage').limit(10),
            Booking.find({ user: userId }).populate({
                path: 'worker',
                populate: { path: 'user', select: 'name profileImage' }
            }),
            (async () => {
                const totalVerified = await Worker.countDocuments({ isVerified: true });
                const available = await Worker.countDocuments({ isVerified: true, isAvailable: true });
                const allWorkers = await Worker.find({ isVerified: true });
                const expertiseMap = {};
                allWorkers.forEach(w => {
                    w.skills.forEach(skill => {
                        expertiseMap[skill] = (expertiseMap[skill] || 0) + 1;
                    });
                });
                const expertiseData = Object.entries(expertiseMap).map(([name, value]) => ({ name, value }));
                return { totalVerified, available, busy: totalVerified - available, expertiseData };
            })(),
        ]);

        const workerProfile = await Worker.findOne({ user: userId });

        const totalSpent = bookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.worker?.price || 0), 0);

        const activeProjects = bookings.filter(b => ['pending', 'accepted'].includes(b.status)).length;
        const completedProjects = bookings.filter(b => b.status === 'completed').length;

        res.json({
            user: {
                name: user.name,
                role: user.role,
                savedWorkers: user.savedWorkers || [],
                recentlyViewed: user.recentlyViewed || [],
            },
            workers,
            bookings,
            workerStats,
            userStats: {
                totalSpent,
                activeProjects,
                completedProjects,
                totalProjects: bookings.length
            },
            workerProfile
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
