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
import { Worker } from './models/Worker.js';
import { CallHistory } from './models/CallHistory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(compression());
const server = http.createServer(app);
const allowedOrigins = [
    (process.env.FRONTEND_URL || '').trim(),
    'https://find-your-painter.vercel.app', // Explicit production URL
    'http://localhost:5173',
    'http://127.0.0.1:5173'
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        methods: ['GET', 'POST']
    }
});
console.log('[SOCKET_INIT] Allowing origins:', allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl) 
        // OR origins that match our allowed list
        if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Rejected origin: ${origin}`);
            callback(null, false); // Don't throw error, just disallow
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Set-Cookie']
}));
// Explicitly handle OPTIONS preflight
app.options('*', cors());
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

// Static Uploads Folder - optimized with caching headers
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}
app.use('/uploads', express.static(uploadPath, {
    maxAge: '1y',
    immutable: true,
    index: false
}));

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
    // console.log('Socket connected:', socket.id);

    // Track user when they explicitly signal being online
    socket.on('user_online', async (userId) => {
        const uid = (userId || '').toString().trim();
        if (!uid) return;

        if (!onlineUsers.has(uid)) {
            onlineUsers.set(uid, new Set());
        }
        onlineUsers.get(uid).add(socket.id);

        // Map workerId to userId for resolve-less signaling
        try {
            if (mongoose.Types.ObjectId.isValid(uid)) {
                const WorkerModel = mongoose.model('Worker');
                const worker = await WorkerModel.findOne({ user: uid });
                if (worker) {
                    const wid = worker._id.toString().trim();
                    workerToUser.set(wid, uid);
                    // console.log(`[SIGNALLING] Worker Map Updated: ${wid} ➡️ ${uid}`);
                }
            } else {
                // console.warn(`[SIGNALLING] Invalid userId format for worker mapping: ${uid}`);
            }
        } catch (e) {
            console.error('[SIGNALLING] Worker mapping error:', e.message);
        }

        io.emit('online_users', Array.from(onlineUsers.keys()));
        // console.log(`[SIGNALLING] User ${uid} registered online. Sockets: ${onlineUsers.get(uid).size} | Map Size: ${onlineUsers.size}`);
    });

    socket.on('ping_server', (data) => {
        // console.log(`[DIAG] Ping from socket ${socket.id} | User ${data.uid || 'unknown'}`);
        socket.emit('pong_client', data);
    });

    // Join/Leave chat rooms
    socket.on('join_chat', (bookingId) => {
        socket.join(bookingId);
        // console.log(`Socket ${socket.id} joined room: ${bookingId}`);
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
        const targetUidRaw = (toUserId || '').toString().trim();
        const senderUid = (fromUserId || '').toString().trim();
        // console.log(`[CALL_OFFER] Incoming: From=${senderUid} To=${targetUidRaw} Type=${callType}`);
        
        if (!targetUidRaw || !senderUid) {
            console.error('[CALL_OFFER] ERROR: Missing recipient or sender ID');
            return;
        }

        let targetUid = targetUidRaw;
        // Resolve workerId to userId if necessary
        if (workerToUser.has(targetUid)) {
            console.log(`[SIGNALLING] Resolved workerId ${targetUid} from MAP to userId ${workerToUser.get(targetUid)}`);
            targetUid = workerToUser.get(targetUid);
        } else {
            // DATABASE FALLBACK: If map missed, query the DB
            try {
                if (mongoose.Types.ObjectId.isValid(targetUid)) {
                    const WorkerModel = mongoose.model('Worker');
                    const worker = await WorkerModel.findById(targetUid);
                    if (worker) {
                        const resolvedUid = worker.user.toString().trim();
                        console.log(`[SIGNALLING] Resolved workerId ${targetUid} from DB to userId ${resolvedUid}`);
                        workerToUser.set(targetUid, resolvedUid); // Cache it
                        targetUid = resolvedUid;
                    }
                }
            } catch (e) {
                console.error('[SIGNALLING] Worker resolution error:', e.message);
            }
        }

        const targetSockets = onlineUsers.get(targetUid);
        
        // Safety check to prevent self-calling loop
        if (targetUid === senderUid) {
            console.warn('[CALL_OFFER] Blocked: User is calling themselves.');
            return;
        }

        if (targetSockets && targetSockets.size > 0) {
            // console.log(`[CALL_OFFER] SUCCESS: Found ${targetSockets.size} sockets for target ${targetUid}. Emitting incoming_call...`);
            targetSockets.forEach(sid => {
                io.to(sid).emit('incoming_call', { 
                    fromUserId: senderUid, 
                    fromUserName, 
                    fromUserImage, 
                    callType, 
                    offer, 
                    callId: null, // We'll update this or use a temp ID if needed, but priority is SPEED
                    timestamp: Date.now() 
                });
            });
            socket.emit('call_signal_sent', { targetUid, socketCount: targetSockets.size });
        }

        let callRecord;
        try {
            // Verify IDs are valid ObjectIds before creating record
            const isCallerValid = mongoose.Types.ObjectId.isValid(senderUid);
            const isReceiverValid = mongoose.Types.ObjectId.isValid(targetUid);

            if (isCallerValid && isReceiverValid) {
                callRecord = await CallHistory.create({
                    caller: senderUid,
                    receiver: targetUid,
                    type: callType || 'voice',
                    status: targetSockets && targetSockets.size > 0 ? 'active' : 'missed',
                    startTime: Date.now()
                });

                // Update the callId for the receiver if they are online (Optional: most clients handle null callId for signaling speed)
                if (targetSockets && targetSockets.size > 0) {
                     targetSockets.forEach(sid => io.to(sid).emit('call_id_update', { callId: callRecord._id }));
                }
            } else {
                console.warn(`[SIGNALLING] Skipping DB record: Invalid ID format (Caller: ${senderUid}, Receiver: ${targetUid})`);
                callRecord = { _id: 'temp_' + Date.now() };
            }
        } catch (err) {
            console.error('[SIGNALLING] CallRecord creation failed:', err.message);
            callRecord = { _id: 'temp_' + Date.now() }; 
        }

        if (callRecord && callRecord._id) activeCalls.set(socket.id, callRecord._id);

        if (!targetSockets || targetSockets.size === 0) {
            console.warn(`[CALL_OFFER] Target ${targetUid} is OFFLINE.`);
            socket.emit('call_target_offline', { targetUid });
            
            try {
                if (mongoose.Types.ObjectId.isValid(targetUidRaw)) {
                    await createNotification({
                        user: targetUidRaw,
                        type: 'system',
                        title: 'Missed Call',
                        message: `You missed a ${callType} call from ${fromUserName}.`,
                        icon: callType === 'video' ? '📹' : '📞'
                    });

                    await sendCallNotification(targetUidRaw, {
                        callerId: senderUid,
                        callerName: fromUserName,
                        callerImage: fromUserImage,
                        callType,
                        callId: callRecord?._id || `${senderUid}-${Date.now()}`
                    });
                }
            } catch (err) {
                console.error('[SIGNALLING] Push fallback failed:', err.message);
            }
        }
    });

    socket.on('call_received', ({ toUserId }) => {
        let targetUid = (toUserId || '').toString().trim();
        if (workerToUser.has(targetUid)) targetUid = workerToUser.get(targetUid);
        const callerSockets = onlineUsers.get(targetUid);
        // console.log(`[SIGNALLING] Call received ACK from recipient. Pinging caller: ${targetUid}`);
        if (callerSockets) callerSockets.forEach(sid => io.to(sid).emit('call_ringing'));
    });

    socket.on('call_answer', ({ toUserId, answer, callId }) => {
        try {
            let targetUid = (toUserId || '').toString().trim();
            if (workerToUser.has(targetUid)) targetUid = workerToUser.get(targetUid);
            const targetSockets = onlineUsers.get(targetUid);
            if (targetSockets) {
                targetSockets.forEach(sid => io.to(sid).emit('call_answered', { answer }));
            }
            
            // Notify other sockets of the receiver that call was accepted elsewhere
            let receiverId = null;
            for (const [uid, sockets] of onlineUsers.entries()) {
                if (sockets.has(socket.id)) { receiverId = uid; break; }
            }
            if (receiverId && onlineUsers.has(receiverId)) {
                onlineUsers.get(receiverId).forEach(sid => {
                    if (sid !== socket.id) io.to(sid).emit('call_accepted_elsewhere');
                });
            }
            if (callId) activeCalls.set(socket.id, callId);
        } catch (err) {
            console.error('[SIGNALLING] call_answer error:', err.message);
        }
    });

    socket.on('call_reject', async ({ toUserId, reason }) => {
        try {
            let targetUid = (toUserId || '').toString().trim();
            if (workerToUser.has(targetUid)) targetUid = workerToUser.get(targetUid);
            const targetSockets = onlineUsers.get(targetUid);
            const callId = activeCalls.get(socket.id);
            if (callId && mongoose.Types.ObjectId.isValid(callId)) {
                await updateCallRecord(callId, { status: 'rejected', endTime: Date.now() });
                activeCalls.delete(socket.id);
            }
            if (targetSockets) {
                targetSockets.forEach(sid => io.to(sid).emit('call_rejected', { reason: reason || 'Call declined.' }));
            }
            
            // Notify other sockets of the rejecter
            let rejecterId = null;
            for (const [uid, sockets] of onlineUsers.entries()) {
                if (sockets.has(socket.id)) { rejecterId = uid; break; }
            }
            if (rejecterId && onlineUsers.has(rejecterId)) {
                onlineUsers.get(rejecterId).forEach(sid => {
                    if (sid !== socket.id) io.to(sid).emit('call_rejected_elsewhere');
                });
            }
        } catch (err) {
            console.error('[SIGNALLING] call_reject error:', err.message);
        }
    });

    socket.on('call_end', async ({ toUserId }) => {
        try {
            let targetUid = (toUserId || '').toString().trim();
            if (workerToUser.has(targetUid)) targetUid = workerToUser.get(targetUid);
            const targetSockets = onlineUsers.get(targetUid);
            const callId = activeCalls.get(socket.id);
            if (callId && mongoose.Types.ObjectId.isValid(callId)) {
                try {
                    const call = await mongoose.model('CallHistory').findById(callId);
                    if (call) {
                        const duration = Math.round((Date.now() - new Date(call.startTime)) / 1000);
                        await updateCallRecord(callId, { status: 'completed', endTime: Date.now(), duration });
                    }
                } catch (err) {
                    console.error('[SIGNALLING] Call end update failed:', err.message);
                }
                activeCalls.delete(socket.id);
            }
            if (targetSockets) targetSockets.forEach(sid => io.to(sid).emit('call_ended'));
        } catch (err) {
            console.error('[SIGNALLING] call_end error:', err.message);
        }
    });

    socket.on('call_cancel', async ({ toUserId, reason }) => {
        try {
            let targetUid = (toUserId || '').toString().trim();
            if (workerToUser.has(targetUid)) targetUid = workerToUser.get(targetUid);
            const targetSockets = onlineUsers.get(targetUid);
            const callId = activeCalls.get(socket.id);
            
            console.log(`[CALL_CANCEL] From=${socket.id} To=${targetUid} Reason=${reason}`);

            if (callId && mongoose.Types.ObjectId.isValid(callId)) {
                await updateCallRecord(callId, { status: 'cancelled', endTime: Date.now() });
                activeCalls.delete(socket.id);
            }
            // Notify receiver to hide the incoming call modal
            if (targetSockets) {
                targetSockets.forEach(sid => io.to(sid).emit('call_ended'));
            }
        } catch (err) {
            console.error('[SIGNALLING] call_cancel error:', err.message);
        }
    });

    socket.on('ice_candidate', ({ toUserId, candidate }) => {
        try {
            let targetUid = (toUserId || '').toString().trim();
            if (workerToUser.has(targetUid)) targetUid = workerToUser.get(targetUid);
            const targetSockets = onlineUsers.get(targetUid);
            if (targetSockets) targetSockets.forEach(sid => io.to(sid).emit('ice_candidate', { candidate }));
        } catch (err) {
            console.error('[SIGNALLING] ice_candidate error:', err.message);
        }
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
                // .then(() => console.log(`Self-ping successful: ${url}`))
                .catch(err => console.error(`Self-ping failed: ${err.message}`));
        }, 14 * 60 * 1000); // Ping every 14 minutes
    }
});
