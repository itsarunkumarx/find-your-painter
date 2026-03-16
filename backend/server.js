import express from 'express';
import compression from 'compression';
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
import callRoutes from './routes/call.routes.js';
import { sendCallNotification, createNotification } from './controllers/notification.controller.js';
import { createCallRecord, updateCallRecord } from './controllers/call.controller.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(compression());
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
app.use('/api/calls', callRoutes);

// Static Uploads Folder
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}
app.use('/uploads', express.static(uploadPath));

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
const onlineUsers = new Map(); // userId -> Set<socketId>
const workerToUser = new Map(); // workerId -> userId (for resolving signaling to workers)
const activeCalls = new Map(); // socket.id -> callRecordId

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Track user when they explicitly signal being online
    socket.on('user_online', async (userId) => {
        if (!userId) return;
        const uid = userId.toString();
        if (!onlineUsers.has(uid)) {
            onlineUsers.set(uid, new Set());
        }
        onlineUsers.get(uid).add(socket.id);

        // Map workerId to userId for resolve-less signaling
        try {
            const worker = await mongoose.model('Worker').findOne({ user: uid });
            if (worker) {
                workerToUser.set(worker._id.toString(), uid);
            }
        } catch (e) {
            // Model might not be loaded yet or user isn't a worker
        }

        io.emit('online_users', Array.from(onlineUsers.keys()));
        console.log(`User ${uid} online → sockets count: ${onlineUsers.get(uid).size}`);
    });

    // Join/Leave chat rooms
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

    socket.on('message_reaction', ({ bookingId, messageId, emoji, userId }) => {
        io.to(bookingId).emit('message_reaction', { messageId, emoji, userId });
    });

    // ── WebRTC Call Signaling ─────────────────────────────────────────────────

    socket.on('call_offer', async ({ toUserId, fromUserId, fromUserName, fromUserImage, callType, offer }) => {
        let targetUid = toUserId.toString();
        // Resolve workerId to userId if necessary
        if (workerToUser.has(targetUid)) {
            console.log(`[Socket] Resolving workerId ${targetUid} to userId ${workerToUser.get(targetUid)}`);
            targetUid = workerToUser.get(targetUid);
        }

        const targetSockets = onlineUsers.get(targetUid);

        const callRecord = await mongoose.model('CallHistory').create({
            caller: fromUserId,
            receiver: toUserId,
            type: callType || 'voice',
            status: targetSockets && targetSockets.size > 0 ? 'ringing' : 'missed',
            startTime: Date.now()
        }).catch(err => console.error('Call log error:', err));

        if (callRecord) activeCalls.set(socket.id, callRecord._id);

        if (targetSockets && targetSockets.size > 0) {
            targetSockets.forEach(sid => {
                io.to(sid).emit('incoming_call', { 
                    fromUserId, 
                    fromUserName, 
                    fromUserImage, 
                    callType, 
                    offer, 
                    callId: callRecord?._id,
                    timestamp: Date.now() 
                });
            });
        } else {
            socket.emit('call_waiting', { message: 'User is offline. Sending push notification...' });
            await createNotification({
                user: toUserId,
                type: 'system',
                title: 'Missed Call',
                message: `You missed a ${callType} call from ${fromUserName}.`,
                icon: callType === 'video' ? '📹' : '📞'
            });
        }

        try {
            await sendCallNotification(toUserId, {
                callerId: fromUserId,
                callerName: fromUserName,
                callerImage: fromUserImage,
                callType,
                callId: callRecord?._id || `${fromUserId}-${Date.now()}`
            });
        } catch (error) {
            console.error('Failed to send push notification:', error);
        }
    });

    socket.on('call_received', ({ toUserId }) => {
        let targetUid = toUserId.toString();
        if (workerToUser.has(targetUid)) targetUid = workerToUser.get(targetUid);
        const callerSockets = onlineUsers.get(targetUid);
        if (callerSockets) callerSockets.forEach(sid => io.to(sid).emit('call_ringing'));
    });

    socket.on('call_answer', ({ toUserId, answer, callId }) => {
        let targetUid = toUserId.toString();
        if (workerToUser.has(targetUid)) targetUid = workerToUser.get(targetUid);
        const targetSockets = onlineUsers.get(targetUid);
        if (targetSockets) targetSockets.forEach(sid => io.to(sid).emit('call_answered', { answer }));
        
        // Notify other sockets of the receiver that call was accepted elsewhere
        let receiverId = null;
        for (const [uid, sockets] of onlineUsers.entries()) {
            if (sockets.has(socket.id)) { receiverId = uid; break; }
        }
        if (receiverId) {
            onlineUsers.get(receiverId).forEach(sid => {
                if (sid !== socket.id) io.to(sid).emit('call_accepted_elsewhere');
            });
        }
        if (callId) activeCalls.set(socket.id, callId);
    });

    socket.on('call_reject', async ({ toUserId, reason }) => {
        let targetUid = toUserId.toString();
        if (workerToUser.has(targetUid)) targetUid = workerToUser.get(targetUid);
        const targetSockets = onlineUsers.get(targetUid);
        const callId = activeCalls.get(socket.id);
        if (callId) {
            await updateCallRecord(callId, { status: 'rejected', endTime: Date.now() });
            activeCalls.delete(socket.id);
        }
        if (targetSockets) targetSockets.forEach(sid => io.to(sid).emit('call_rejected', { reason: reason || 'Call declined.' }));
        
        // Notify other sockets of the rejecter
        let rejecterId = null;
        for (const [uid, sockets] of onlineUsers.entries()) {
            if (sockets.has(socket.id)) { rejecterId = uid; break; }
        }
        if (rejecterId) {
            onlineUsers.get(rejecterId).forEach(sid => {
                if (sid !== socket.id) io.to(sid).emit('call_rejected_elsewhere');
            });
        }
    });

    socket.on('call_end', async ({ toUserId }) => {
        let targetUid = toUserId.toString();
        if (workerToUser.has(targetUid)) targetUid = workerToUser.get(targetUid);
        const targetSockets = onlineUsers.get(targetUid);
        const callId = activeCalls.get(socket.id);
        if (callId) {
            const call = await mongoose.model('CallHistory').findById(callId);
            if (call) {
                const duration = Math.round((Date.now() - new Date(call.startTime)) / 1000);
                await updateCallRecord(callId, { status: 'completed', endTime: Date.now(), duration });
            }
            activeCalls.delete(socket.id);
        }
        if (targetSockets) targetSockets.forEach(sid => io.to(sid).emit('call_ended'));
    });

    socket.on('ice_candidate', ({ toUserId, candidate }) => {
        let targetUid = toUserId.toString();
        if (workerToUser.has(targetUid)) targetUid = workerToUser.get(targetUid);
        const targetSockets = onlineUsers.get(targetUid);
        if (targetSockets) targetSockets.forEach(sid => io.to(sid).emit('ice_candidate', { candidate }));
    });

    socket.on('disconnect', () => {
        let disconnectedUserId = null;
        for (const [userId, sockets] of onlineUsers.entries()) {
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    disconnectedUserId = userId;
                }
                break;
            }
        }
        if (disconnectedUserId) {
            io.emit('online_users', Array.from(onlineUsers.keys()));
        }
        if (activeCalls.has(socket.id)) {
            const callId = activeCalls.get(socket.id);
            updateCallRecord(callId, { status: 'disconnected', endTime: Date.now() }).catch(() => {});
            activeCalls.delete(socket.id);
        }
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
