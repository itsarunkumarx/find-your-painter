import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['booking_accepted', 'booking_rejected', 'booking_completed', 'booking_new', 'new_message', 'review_received', 'verification_approved', 'verification_rejected', 'dispute_update', 'system'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
    icon: { type: String, default: '🔔' }
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
