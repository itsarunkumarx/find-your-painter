import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    // Professional Details
    skills: [{ type: String, required: true }],
    experience: { type: Number, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    bio: { type: String },
    applicationEmail: { type: String },
    fullName: { type: String },
    applicationPhone: { type: String },

    // Status & Verification
    isVerified: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    verificationComments: { type: String, default: '' },

    // Images (Stored as URLs)
    workImages: [{ type: String }],
    portfolioImages: [{ url: String, caption: String, featured: { type: Boolean, default: false } }],
    idProof: { type: String, select: false },
    paymentDetails: {
        upi: { type: String, default: '' },
        bankName: { type: String, default: '' },
        accountNo: { type: String, default: '' },
        ifscCode: { type: String, default: '' }
    },

    // Ratings
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

// Performance Indices
workerSchema.index({ location: 'text', fullName: 'text' });
workerSchema.index({ price: 1 });
workerSchema.index({ rating: -1 });
workerSchema.index({ verificationStatus: 1 });
workerSchema.index({ isVerified: 1 });

export const Worker = mongoose.model('Worker', workerSchema);
