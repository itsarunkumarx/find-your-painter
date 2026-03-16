import { Chat } from '../models/Chat.js';
import { Booking } from '../models/Booking.js';
import { Worker } from '../models/Worker.js';
import { sendMessageNotification } from './notification.controller.js';

export const getChatHistory = async (req, res) => {
    try {
        const chats = await Chat.find({ booking: req.params.bookingId, isDeleted: false })
            .populate('sender', 'name profileImage role')
            .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name' } })
            .sort({ createdAt: 1 });

        // Mark all messages as read by current user
        await Chat.updateMany(
            { booking: req.params.bookingId, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id }, $set: { read: true } }
        );

        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const sendMessage = async (req, res) => {
    const { bookingId, message, messageType = 'text', replyTo } = req.body;
    try {
        const chatData = { booking: bookingId, sender: req.user._id, message, messageType };
        if (replyTo) chatData.replyTo = replyTo;

        const chat = await Chat.create(chatData);

        const populatedChat = await Chat.findById(chat._id)
            .populate('sender', 'name profileImage role')
            .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name' } });

        if (req.io) {
            req.io.to(bookingId).emit('new_message', populatedChat);
        }

        // Trigger push notification for the other participant
        try {
            const booking = await Booking.findById(bookingId).populate('user worker');
            if (booking) {
                const recipientId = booking.user._id.toString() === req.user._id.toString()
                    ? (booking.worker?.user || booking.worker) // Handle both forms of worker
                    : booking.user._id;

                await sendMessageNotification(
                    recipientId,
                    req.user.name,
                    messageType === 'image' ? 'Sent an image' : message,
                    bookingId
                );
            }
        } catch (error) {
            console.error('Failed to trigger chat push notification:', error);
        }

        res.status(201).json(populatedChat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.messageId);
        if (!chat) return res.status(404).json({ message: 'Message not found' });
        if (chat.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this message' });
        }
        chat.isDeleted = true;
        chat.message = 'This message was deleted';
        await chat.save();

        if (req.io) {
            req.io.to(chat.booking.toString()).emit('message_deleted', { messageId: chat._id });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { bookingId } = req.params;
        await Chat.updateMany(
            { booking: bookingId, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id }, $set: { read: true } }
        );

        if (req.io) {
            req.io.to(bookingId).emit('messages_read', { bookingId, userId: req.user._id });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getConversations = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user._id });
        const workerId = worker ? worker._id : null;

        const query = req.user.role === 'admin'
            ? {}
            : { $or: [{ user: req.user._id }, { worker: workerId }] };

        const bookings = await Booking.find(query)
            .populate('user', 'name profileImage')
            .populate({ path: 'worker', populate: { path: 'user', select: 'name profileImage' } });

        // Group by participant to avoid duplicates
        const groupedMap = new Map();

        await Promise.all(bookings.map(async (booking) => {
            const otherUser = req.user.role === 'worker' 
                ? booking.user 
                : (booking.worker?.user || booking.worker);
            
            if (!otherUser) return;
            
            const otherUserId = (typeof otherUser === 'object' ? (otherUser._id || otherUser.id) : otherUser)?.toString();
            if (!otherUserId) return;

            const [lastMessage, unreadCount] = await Promise.all([
                Chat.findOne({ booking: booking._id, isDeleted: false })
                    .sort({ createdAt: -1 })
                    .populate('sender', 'name'),
                Chat.countDocuments({
                    booking: booking._id,
                    sender: { $ne: req.user._id },
                    readBy: { $ne: req.user._id },
                    isDeleted: false
                })
            ]);

            const activityDate = lastMessage?.createdAt || booking.createdAt;

            if (!groupedMap.has(otherUserId) || new Date(activityDate) > new Date(groupedMap.get(otherUserId).latestActivity)) {
                groupedMap.set(otherUserId, {
                    booking,
                    otherUser,
                    lastMessage,
                    unreadCount: (groupedMap.get(otherUserId)?.unreadCount || 0) + unreadCount,
                    latestActivity: activityDate
                });
            } else {
                const existing = groupedMap.get(otherUserId);
                existing.unreadCount += unreadCount;
            }
        }));

        const conversations = Array.from(groupedMap.values())
            .sort((a, b) => new Date(b.latestActivity) - new Date(a.latestActivity));

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user._id });
        const workerId = worker ? worker._id : null;

        const query = req.user.role === 'admin'
            ? {}
            : { $or: [{ user: req.user._id }, { worker: workerId }] };

        const bookings = await Booking.find(query);
        
        let total = 0;
        await Promise.all(bookings.map(async (booking) => {
            const otherUser = req.user.role === 'worker' 
                ? booking.user 
                : (booking.worker?.user || booking.worker);
            
            if (!otherUser) return;

            // Same logic as getConversations: only count if participant or explicitly an admin monitoring
            const isParticipant = booking.user?._id?.toString() === req.user._id.toString() || 
                                (booking.worker?.user?._id || booking.worker?.user || booking.worker)?.toString() === req.user._id.toString();

            if (!isParticipant && req.user.role !== 'admin') return;

            const count = await Chat.countDocuments({
                booking: booking._id,
                sender: { $ne: req.user._id },
                readBy: { $ne: req.user._id },
                isDeleted: false
            });
            total += count;
        }));

        res.json({ total });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const chat = await Chat.findById(messageId);
        if (!chat) return res.status(404).json({ message: 'Message not found' });

        const existingIndex = chat.reactions.findIndex(r => r.userId.toString() === req.user._id.toString() && r.emoji === emoji);
        if (existingIndex > -1) {
            chat.reactions.splice(existingIndex, 1);
        } else {
            chat.reactions.push({ userId: req.user._id, emoji });
        }
        await chat.save();
        res.json(chat.reactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const initiateConversation = async (req, res) => {
    try {
        const { workerId } = req.params;
        const userId = req.user._id;

        // Search for existing booking (active or pending)
        let booking = await Booking.findOne({
            user: userId,
            worker: workerId,
            status: { $in: ['pending', 'accepted'] }
        });

        if (!booking) {
            // Create a minimal "Inquiry" booking
            booking = await Booking.create({
                user: userId,
                worker: workerId,
                status: 'pending',
                serviceType: 'Interior', // Default for inquiry
                location: 'Initial Inquiry',
                date: new Date(),
                message: 'Auto-initiated chat from explore page.'
            });
        }

        res.json({ bookingId: booking._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
