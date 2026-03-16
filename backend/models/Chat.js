import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
    read: { type: Boolean, default: false, index: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false, index: true },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', default: null },
    reactions: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: String
    }],
}, { timestamps: true });

chatSchema.index({ booking: 1, createdAt: -1 });
chatSchema.index({ booking: 1, read: 1, isDeleted: 1 });

export const Chat = mongoose.model('Chat', chatSchema);
