import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true, unique: true },
    paymentMethod: { type: String, enum: ['card', 'upi', 'cash'], default: 'card' },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    }
}, { timestamps: true });

export const Payment = mongoose.model('Payment', paymentSchema);
