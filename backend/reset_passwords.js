import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js';
import { Worker } from './models/Worker.js';

dotenv.config();

async function resetPasswords() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // Update all test accounts with password: 'password123' or '123456'
        await User.updateMany(
            { email: { $in: ['arunkumarpalani74@gmail.com', 'palani@gmail.com', 'admintest@example.com'] } },
            { $set: { password: hashedPassword } }
        );

        // Ensure painter palani is verified and available
        const painterUser = await User.findOne({ email: 'palani@gmail.com' });
        if (painterUser) {
            await Worker.findOneAndUpdate(
                { user: painterUser._id },
                {
                    $set: {
                        isVerified: true,
                        isAvailable: true,
                        verificationStatus: 'approved',
                        fullName: 'Palani Master Painter',
                        skills: ['Interior', 'Exterior', 'Texture', 'Waterproofing'],
                        price: 1500,
                        experience: 8,
                        location: 'Chennai, Tamil Nadu',
                        bio: 'Specialist in luxury architectural finishes, texture wall art, and weather-proof exterior coatings.'
                    }
                },
                { upsert: true, new: true }
            );
        }

        console.log('Test accounts successfully synchronized with password: "password123" / "123456"');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

resetPasswords();
