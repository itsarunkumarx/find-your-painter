import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Worker } from './models/Worker.js';

dotenv.config();

async function fixSkills() {
    await mongoose.connect(process.env.MONGO_URI);
    const workers = await Worker.find({});
    for (const w of workers) {
        w.skills = ['House Painting', 'Interior Luxury', 'Wall Texture'];
        w.isVerified = true;
        w.isAvailable = true;
        w.verificationStatus = 'approved';
        await w.save();
    }
    console.log('Successfully updated worker skills and availability');
    process.exit(0);
}

fixSkills().catch(e => { console.error(e); process.exit(1); });
