import mongoose from 'mongoose';

const callHistorySchema = new mongoose.Schema({
    caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['voice', 'video'], required: true },
    status: { type: String, enum: ['active', 'missed', 'completed', 'rejected', 'cancelled'], default: 'active' },
    duration: { type: Number, default: 0 }, // in seconds
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date }
}, { timestamps: true });

export const CallHistory = mongoose.model('CallHistory', callHistorySchema);
