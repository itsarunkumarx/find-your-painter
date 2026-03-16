import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['user_block', 'user_unblock', 'user_suspend', 'user_unsuspend', 'user_delete', 'worker_verify', 'worker_reject', 'worker_block', 'settings_update', 'broadcast_sent']
    },
    subject: {
        type: String, // ID or Name of the target (User, Worker, etc.)
        required: true
    },
    action: {
        type: String, // Descriptive message
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
