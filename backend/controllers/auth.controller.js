import { User } from '../models/User.js';
import { Worker } from '../models/Worker.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user / worker
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'user',
        });

        if (user) {
            if (role === 'worker') {
                await Worker.create({
                    user: user._id,
                    skills: [],
                    experience: 0,
                    location: 'Not set',
                    price: 0
                });
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: 'Your account has been blocked. Please contact support for assistance.' });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: 'Your account has been suspended. Please check your email for more details.' });
        }

        // Check if worker is verified
        if (user.role === 'worker') {
            const worker = await Worker.findOne({ user: user._id });
            if (worker && !worker.isVerified) {
                return res.status(403).json({ 
                    message: 'Your account is awaiting admin verification. Please try again later or contact support.' 
                });
            }
        }

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Google OAuth login / register (using access_token from implicit flow)
// @route   POST /api/auth/google
// @access  Public
export const googleAuthUser = async (req, res) => {
    const { access_token } = req.body;

    try {
        // Verify the access_token by fetching from Google's userinfo endpoint
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!response.ok) {
            return res.status(401).json({ message: 'Invalid Google token' });
        }

        const { sub: googleId, email, name, picture } = await response.json();

        // Find or create user
        let user = await User.findOne({ email });

        if (user) {
            // Link Google account if not already linked
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // New user — created without password
            user = await User.create({
                name,
                email,
                googleId,
                profileImage: picture,
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: 'Your account has been blocked.' });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: 'Your account has been suspended.' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ message: 'Google authentication failed' });
    }
};

// @desc    Get support admin ID
// @route   GET /api/auth/support-admin
// @access  Protected
export const getSupportAdmin = async (req, res) => {
    try {
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) return res.status(404).json({ message: 'No support specialist online' });
        res.json({ _id: admin._id, name: admin.name, profileImage: admin.profileImage });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
