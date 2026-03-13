import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes.js';
import workerRoutes from './routes/worker.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import chatRoutes from './routes/chat.routes.js';
import userRoutes from './routes/user.routes.js';
import reviewRoutes from './routes/review.routes.js';
import languageRoutes from './routes/language.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import supportRoutes from './routes/support.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { sendCallNotification } from './controllers/notification.controller.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Attach io to req so controllers can emit events
app.use((req, res, next) => { req.io = io; next(); });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/payments', paymentRoutes);

// Database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error(`MongoDB Error: ${err.message}`);
        setTimeout(connectDB, 5000);
    }
};
connectDB();

app.get('/', (req, res) => res.send('Find Your Painter API is running...'));

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Register user as online
    socket.on('user_online', (userId) => {
        onlineUsers.set(userId, socket.id);
        io.emit('online_users', Array.from(onlineUsers.keys()));
        console.log(`User ${userId} online → socket ${socket.id}`);
    });

    // ── Chat ──────────────────────────────────────────────────────────────────
    socket.on('join_chat', (bookingId) => {
        socket.join(bookingId);
        console.log(`Socket ${socket.id} joined room: ${bookingId}`);
    });

    socket.on('leave_chat', (bookingId) => socket.leave(bookingId));

    socket.on('typing', ({ bookingId, userId, userName }) => {
        socket.to(bookingId).emit('user_typing', { userId, userName });
    });

    socket.on('stop_typing', ({ bookingId, userId }) => {
        socket.to(bookingId).emit('user_stop_typing', { userId });
    });

    // ── WebRTC Call Signaling ─────────────────────────────────────────────────

    // Caller sends offer to target user
    socket.on('call_offer', async ({ toUserId, fromUserId, fromUserName, fromUserImage, callType, offer }) => {
        const targetSocket = onlineUsers.get(toUserId);

        // Send WebRTC offer via Socket if online
        if (targetSocket) {
            io.to(targetSocket).emit('incoming_call', { fromUserId, fromUserName, fromUserImage, callType, offer });
            console.log(`📞 Call offer: ${fromUserId} → ${toUserId}`);
        } else {
            // If offline, let the caller know it might take a moment (push)
            socket.emit('call_waiting', { message: 'User is offline. Sending push notification...' });
        }

        // Always send push notification as backup (or handle offline logic)
        try {
            await sendCallNotification(toUserId, {
                callerId: fromUserId,
                callerName: fromUserName,
                callerImage: fromUserImage,
                callType,
                callId: `${fromUserId}-${Date.now()}` // Generate a unique call ID
            });
        } catch (error) {
            console.error('Failed to send push notification:', error);
        }
    });

    // Receiver acknowledges 'incoming_call' so the caller knows it is ringing
    socket.on('call_received', ({ toUserId }) => {
        const callerSocket = onlineUsers.get(toUserId);
        if (callerSocket) io.to(callerSocket).emit('call_ringing');
    });

    // Receiver sends WebRTC answer back to caller
    socket.on('call_answer', ({ toUserId, answer }) => {
        const targetSocket = onlineUsers.get(toUserId);
        if (targetSocket) io.to(targetSocket).emit('call_answered', { answer });
    });

    // Either side rejects/declines
    socket.on('call_reject', ({ toUserId, reason }) => {
        const targetSocket = onlineUsers.get(toUserId);
        if (targetSocket) io.to(targetSocket).emit('call_rejected', { reason: reason || 'Call declined.' });
    });

    // Either side ends the call
    socket.on('call_end', ({ toUserId }) => {
        const targetSocket = onlineUsers.get(toUserId);
        if (targetSocket) io.to(targetSocket).emit('call_ended');
    });

    // ICE candidate exchange
    socket.on('ice_candidate', ({ toUserId, candidate }) => {
        const targetSocket = onlineUsers.get(toUserId);
        if (targetSocket) io.to(targetSocket).emit('ice_candidate', { candidate });
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
        for (const [userId, sid] of onlineUsers.entries()) {
            if (sid === socket.id) { onlineUsers.delete(userId); break; }
        }
        io.emit('online_users', Array.from(onlineUsers.keys()));
        console.log('Socket disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Keep-alive mechanism for free hosting (e.g., Render)
    const url = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    if (process.env.NODE_ENV === 'production' || process.env.BACKEND_URL) {
        setInterval(() => {
            fetch(url)
                .then(() => console.log(`Self-ping successful: ${url}`))
                .catch(err => console.error(`Self-ping failed: ${err.message}`));
        }, 14 * 60 * 1000); // Ping every 14 minutes
    }
});
