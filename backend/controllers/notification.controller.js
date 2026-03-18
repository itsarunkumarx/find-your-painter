import { Notification } from '../models/Notification.js';
import Subscription from '../models/Subscription.js';
import webPush from 'web-push';

export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user: req.user.id, read: false });
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user.id }, { read: true });
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const markOneRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (notification && notification.user.toString() === req.user.id) {
            notification.read = true;
            await notification.save();
            res.status(200).json(notification);
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (notification && notification.user.toString() === req.user.id) {
            await notification.deleteOne();
            res.status(200).json({ message: 'Notification deleted' });
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Web Push Subscription
export const subscribe = async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.user.id;

        let existingSub = await Subscription.findOne({ endpoint: subscription.endpoint });

        if (existingSub) {
            existingSub.user = userId;
            await existingSub.save();
        } else {
            await Subscription.create({
                user: userId,
                endpoint: subscription.endpoint,
                keys: subscription.keys
            });
        }

        res.status(201).json({ message: 'Subscription saved successfully' });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ message: 'Failed to save subscription' });
    }
};

export const unsubscribe = async (req, res) => {
    try {
        const { endpoint } = req.body;
        const userId = req.user.id;

        await Subscription.deleteOne({ endpoint, user: userId });

        res.status(200).json({ message: 'Unsubscribed successfully' });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ message: 'Failed to unsubscribe' });
    }
};

// Internal helper for database notifications + socket emit
export const createNotification = async ({ user, type, title, message, link, icon, io }) => {
    try {
        const notification = await Notification.create({
            user,
            type,
            title,
            message,
            link,
            icon
        });

        // Emit if io is provided
        if (io) {
            io.emit('new_notification', { userId: user, notification });
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// Internal helper for sending push notifications
export const sendCallNotification = async (targetUserId, callData) => {
    try {
        webPush.setVapidDetails(
            'mailto:support@findyourpainter.com',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );

        const subscriptions = await Subscription.find({ user: targetUserId });

        const notificationPayload = JSON.stringify({
            title: 'Incoming Call',
            body: `Incoming call from ${callData.callerName}`,
            url: `/call?callId=${callData.callId}&callerName=${encodeURIComponent(callData.callerName)}`,
            ...callData
        });

        const pushPromises = subscriptions.map(sub =>
            webPush.sendNotification(
                { endpoint: sub.endpoint, keys: sub.keys },
                notificationPayload
            ).catch(err => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    return Subscription.deleteOne({ _id: sub._id });
                }
            })
        );

        await Promise.all(pushPromises);
    } catch (error) {
        console.error('Notification error:', error);
    }
};
export const sendMessageNotification = async (targetUserId, senderName, messageText, bookingId) => {
    try {
        webPush.setVapidDetails(
            'mailto:support@findyourpainter.com',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );

        const subscriptions = await Subscription.find({ user: targetUserId });

        const notificationPayload = JSON.stringify({
            title: `Message from ${senderName}`,
            body: messageText.length > 100 ? messageText.substring(0, 97) + '...' : messageText,
            url: `/messages/${bookingId}`,
            data: { bookingId }
        });

        const pushPromises = subscriptions.map(sub =>
            webPush.sendNotification(
                { endpoint: sub.endpoint, keys: sub.keys },
                notificationPayload
            ).catch(err => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    return Subscription.deleteOne({ _id: sub._id });
                }
            })
        );

        await Promise.all(pushPromises);
    } catch (error) {
        console.error('Chat notification error:', error);
    }
};
