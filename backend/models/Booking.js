import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
    },
    subStatus: {
        type: String,
        enum: ['not_started', 'started', 'in_progress', 'completed'],
        default: 'not_started'
    },
    serviceType: { type: String, enum: ['Interior', 'Exterior', 'Commercial'], required: true },
    location: { type: String, required: true },
    paymentMethod: {
        type: String,
        enum: ['online', 'cash'],
        default: 'online'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'post_paid_pending', 'refunded'],
        default: 'pending'
    },
    date: { type: Date, required: true },
    message: { type: String },
}, { timestamps: true });

export const Booking = mongoose.model('Booking', bookingSchema);
