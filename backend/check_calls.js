import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CallHistory } from './models/CallHistory.js';

dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await CallHistory.countDocuments();
        const latest = await CallHistory.find().sort({ createdAt: -1 }).limit(5).populate('caller receiver', 'name email');
        console.log('Total calls:', count);
        console.log('Latest calls:', JSON.stringify(latest, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
