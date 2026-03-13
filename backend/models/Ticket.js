import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ['open', 'in-review', 'resolved'],
        default: 'open'
    },
    type: {
        type: String,
        enum: ['dispute', 'payment', 'account', 'other'],
        default: 'other'
    },
    replies: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export const Ticket = mongoose.model('Ticket', ticketSchema);
