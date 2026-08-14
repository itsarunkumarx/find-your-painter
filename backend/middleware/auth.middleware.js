import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[Auth]', error.message);
        }
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

export const adminObj = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(401).json({ message: 'Not authorized as an admin' });
    }
};
