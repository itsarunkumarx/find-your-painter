import { Worker } from '../models/Worker.js';
import { User } from '../models/User.js';
import { createNotification } from './notification.controller.js';
import { AuditLog } from '../models/AuditLog.js';

const logAction = async (adminId, type, subject, action) => {
    try {
        await AuditLog.create({
            admin: adminId,
            type,
            subject,
            action
        });
    } catch (error) {
        console.error('Audit logging failed', error);
    }
};

// @desc    Get all available workers
// @route   GET /api/workers
// @access  Private
export const getWorkers = async (req, res) => {
    try {
        const workers = await Worker.find({
            isVerified: true,
            isAvailable: true
        })
        .populate('user', 'name profileImage')
        .select('-idProof -verificationComments -portfolioImages') // Exclude heavy/private fields
        .sort({ isFeatured: -1, rating: -1 })
        .limit(100); // Protection against massive data transfers

        res.json(workers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get worker profile by ID
// @route   GET /api/workers/:id
// @access  Private
export const getWorkerById = async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id).populate('user', 'name email profileImage');
        if (worker) {
            res.json(worker);
        } else {
            res.status(404).json({ message: 'Worker not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Apply to become a worker
// @route   POST /api/workers/apply
// @access  Private (User only)
export const applyToBecomeWorker = async (req, res) => {
    try {
        const existingWorker = await Worker.findOne({ user: req.user._id });
        if (existingWorker) {
            return res.status(400).json({ message: 'Application already exists' });
        }

        const worker = await Worker.create({
            user: req.user._id,
            fullName: req.body.fullName,
            applicationEmail: req.body.applicationEmail,
            applicationPhone: req.body.applicationPhone,
            skills: req.body.skills,
            experience: req.body.experience,
            location: req.body.location,
            price: req.body.price,
            bio: req.body.bio,
            idProof: req.file ? `/uploads/${req.file.filename}` : req.body.idProof,
            verificationStatus: 'pending',
            isVerified: false,
            isAvailable: false // Not available until verified
        });

        // Notify Admins
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            await createNotification({
                user: admin._id,
                type: 'new_worker_application',
                title: 'New Expert Application',
                message: `${req.user.name} has applied to become a verified painter.`,
                link: '/admin-workers',
                icon: '👨‍🎨',
                io: req.io
            });
        }

        res.status(201).json(worker);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify/Reject worker application
// @route   PUT /api/workers/:id/verify
// @access  Private (Admin only)
export const verifyWorker = async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        const worker = await Worker.findById(req.params.id);

        if (!worker) {
            return res.status(404).json({ message: 'Worker application not found' });
        }

        worker.verificationStatus = status;
        if (status === 'approved') {
            worker.isVerified = true;
            worker.isAvailable = true;

            // Update associated User's role to 'worker'
            await User.findByIdAndUpdate(worker.user, { role: 'worker' });

            await createNotification({
                user: worker.user,
                type: 'verification_approved',
                title: 'Professional Verification Approved',
                message: 'Your application has been approved! You can now accept painting jobs.',
                link: '/worker-dashboard',
                icon: '🎖️',
                io: req.io
            });
        } else if (status === 'rejected') {
            worker.isVerified = false;
            worker.isAvailable = false;

            await createNotification({
                user: worker.user,
                type: 'verification_rejected',
                title: 'Verification Update',
                message: `Your application status: Rejected.`,
                link: '/worker-verification',
                icon: '⚠️',
                io: req.io
            });
        }

        await worker.save();

        await logAction(
            req.user._id,
            status === 'approved' ? 'worker_verify' : 'worker_reject',
            worker.fullName || 'Unknown',
            `${status === 'approved' ? 'Approved' : 'Rejected'} specialist application`
        );

        res.json(worker);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get pending worker applications
// @route   GET /api/workers/pending
// @access  Private (Admin only)
export const getPendingWorkers = async (req, res) => {
    try {
        const workers = await Worker.find({ verificationStatus: 'pending' })
            .populate('user', 'name email profileImage')
            .select('+idProof');
        res.json(workers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle worker availability
// @route   PUT /api/workers/availability
// @access  Private (Worker only)
export const toggleAvailability = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user._id });
        if (!worker) {
            return res.status(404).json({ message: 'Worker profile not found' });
        }

        worker.isAvailable = req.body.isAvailable;
        await worker.save();
        res.json(worker);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update worker profile
// @route   PUT /api/workers/profile
// @access  Private (Worker only)
export const updateWorkerProfile = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user._id });

        if (worker) {
            worker.skills = req.body.skills || worker.skills;
            worker.experience = req.body.experience || worker.experience;
            worker.location = req.body.location || worker.location;
            worker.price = req.body.price || worker.price;
            worker.bio = req.body.bio || worker.bio;
            worker.workImages = req.body.workImages || worker.workImages;

            const updatedWorker = await worker.save();
            res.json(updatedWorker);
        } else {
            res.status(404).json({ message: 'Worker profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current worker's own profile
// @route   GET /api/workers/profile
// @access  Private (Worker only)
export const getMyProfile = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user._id }).populate('user', 'name email profileImage');
        if (worker) {
            res.json(worker);
        } else {
            res.status(404).json({ message: 'Worker profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get worker statistics for analytics
// @route   GET /api/workers/stats
// @access  Private
export const getWorkerStats = async (req, res) => {
    try {
        const totalVerified = await Worker.countDocuments({ isVerified: true });
        const available = await Worker.countDocuments({ isVerified: true, isAvailable: true });

        const workers = await Worker.find({ isVerified: true });
        const expertiseMap = {};
        workers.forEach(w => {
            w.skills.forEach(skill => {
                expertiseMap[skill] = (expertiseMap[skill] || 0) + 1;
            });
        });

        const expertiseData = Object.entries(expertiseMap).map(([name, value]) => ({ name, value }));

        res.json({
            totalVerified, available,
            busy: totalVerified - available,
            expertiseData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get detailed earnings breakdown for worker
// @route   GET /api/workers/earnings
// @access  Private (Worker only)
export const getWorkerEarnings = async (req, res) => {
    try {
        const { Booking } = await import('../models/Booking.js');
        const worker = await Worker.findOne({ user: req.user._id });
        if (!worker) return res.status(404).json({ message: 'Worker profile not found' });

        const bookings = await Booking.find({ worker: worker._id, status: 'completed' })
            .populate('user', 'name profileImage')
            .sort({ updatedAt: -1 });

        const monthly = {};
        bookings.forEach(b => {
            const month = new Date(b.updatedAt).toLocaleString('default', { month: 'short', year: '2-digit' });
            monthly[month] = (monthly[month] || 0) + (worker.price || 0);
        });

        const monthlyChart = Object.entries(monthly).map(([month, amount]) => ({ month, amount })).reverse();
        const totalEarned = bookings.length * (worker.price || 0);
        const thisMonth = new Date().toLocaleString('default', { month: 'short', year: '2-digit' });
        const thisMonthEarnings = monthly[thisMonth] || 0;

        res.json({
            totalEarned,
            thisMonthEarnings,
            monthlyChart,
            bookings: bookings.map(b => ({
                _id: b._id,
                client: b.user,
                serviceType: b.serviceType,
                date: b.updatedAt,
                amount: worker.price || 0,
                location: b.location
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add portfolio image
// @route   POST /api/workers/portfolio
// @access  Private (Worker)
export const addPortfolioImage = async (req, res) => {
    try {
        const { url, caption } = req.body;
        const worker = await Worker.findOneAndUpdate(
            { user: req.user._id },
            { $push: { portfolioImages: { url, caption } } },
            { new: true }
        );
        res.json(worker.portfolioImages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete portfolio image
// @route   DELETE /api/workers/portfolio/:imgId
// @access  Private (Worker)
export const deletePortfolioImage = async (req, res) => {
    try {
        const worker = await Worker.findOneAndUpdate(
            { user: req.user._id },
            { $pull: { portfolioImages: { _id: req.params.imgId } } },
            { new: true }
        );
        res.json(worker.portfolioImages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const togglePortfolioFeatured = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user._id });
        const image = worker.portfolioImages.id(req.params.imgId);
        if (image) {
            image.featured = !image.featured;
            await worker.save();
        }
        res.json(worker.portfolioImages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update payment details
// @route   PUT /api/workers/payment-details
// @access  Private (Worker)
export const updatePaymentDetails = async (req, res) => {
    try {
        const worker = await Worker.findOneAndUpdate(
            { user: req.user._id },
            { $set: { paymentDetails: req.body } },
            { new: true }
        );
        res.json(worker.paymentDetails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
