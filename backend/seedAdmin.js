import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        const adminExists = await User.findOne({ email: 'arunkumarpalani428@gmail.com' });

        if (adminExists) {
            adminExists.password = 'Arunkumar@2006';
            adminExists.role = 'admin';
            await adminExists.save();
            console.log('Admin user updated successfully.');
        } else {
            await User.create({
                name: 'System Admin',
                email: 'arunkumarpalani428@gmail.com',
                password: 'Arunkumar@2006',
                role: 'admin'
            });
            console.log('Admin user created successfully.');
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
