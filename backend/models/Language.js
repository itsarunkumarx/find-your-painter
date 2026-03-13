import mongoose from 'mongoose';

const languageSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, // e.g., 'en', 'ta'
    name: { type: String, required: true }, // e.g., 'English', 'Tamil'
    isEnabled: { type: Boolean, default: true },
    translations: {
        type: Map,
        of: String
    }
}, { timestamps: true });

export const Language = mongoose.model('Language', languageSchema);
