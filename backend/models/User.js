import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    googleId: { type: String, default: '' },
    role: { type: String, enum: ['user', 'worker', 'admin'], default: 'user' },
    profileImage: { type: String, default: '' },
    language: { type: String, default: 'en' },
    address: { type: String, default: '' },
    phoneNumber: { type: String },
    isBlocked: { type: Boolean, default: false },
    uiPreferences: {
        accentColor: { type: String, default: '#C5A059' },
        glowIntensity: { type: Number, default: 50 },
        darkMode: { type: Boolean, default: false }
    },
    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
    recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
    savedWorkers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
