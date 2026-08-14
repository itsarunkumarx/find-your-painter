import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Worker } from './models/Worker.js';
import { User } from './models/User.js';

dotenv.config();

async function linkWorkers() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const workers = await Worker.find({});
    for (const w of workers) {
        if (!w.user) {
            let u = await User.findOne({ email: w.applicationEmail });
            if (!u) {
                u = await User.create({
                    name: w.fullName || 'Palani Painter',
                    email: w.applicationEmail || `worker_${w._id}@gmail.com`,
                    password: 'password123',
                    role: 'worker'
                });
                console.log('Created user for worker:', u.email);
            }
            w.user = u._id;
            w.isVerified = true;
            w.isAvailable = true;
            w.verificationStatus = 'approved';
            await w.save();
            console.log('Linked worker', w.fullName, 'to user', u._id);
        }
    }
    process.exit(0);
}

linkWorkers().catch(err => { console.error(err); process.exit(1); });
