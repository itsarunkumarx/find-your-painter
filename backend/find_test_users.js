import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Worker } from './models/Worker.js';

dotenv.config();

async function findUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find().limit(20);
        const workers = await Worker.find().populate('user').limit(20);

        console.log('--- USERS ---');
        users.forEach(u => console.log(`${u.role}: ${u.email} (Password: 123456 or similar)`));

        console.log('\n--- WORKERS ---');
        workers.forEach(w => {
            if (w.user) {
                console.log(`Worker: ${w.user.email} (Name: ${w.user.name})`);
            }
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findUsers();
