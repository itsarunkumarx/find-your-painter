import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Worker } from './models/Worker.js';
import { Booking } from './models/Booking.js';
import { Chat } from './models/Chat.js';
import { CallHistory } from './models/CallHistory.js';
import { Notification } from './models/Notification.js';
import Subscription from './models/Subscription.js';
import { Payment } from './models/Payment.js';
import { Review } from './models/Review.js';
import { Ticket } from './models/Ticket.js';

dotenv.config();

const ADMIN_EMAIL = 'arunkumarpalani428@gmail.com';

async function cleanupNonAdminUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas for database cleanup...');

        // Find the admin user ID
        const adminUser = await User.findOne({ email: ADMIN_EMAIL, role: 'admin' });
        const adminId = adminUser ? adminUser._id : null;

        // 1. Delete all users except admin
        const deletedUsers = await User.deleteMany({
            email: { $ne: ADMIN_EMAIL }
        });
        console.log(`Deleted ${deletedUsers.deletedCount} non-admin user account(s).`);

        // 2. Delete worker profiles
        const deletedWorkers = await Worker.deleteMany({});
        console.log(`Deleted ${deletedWorkers.deletedCount} worker profile(s).`);

        // 3. Clean up bookings, chats, calls, payments, reviews, tickets, notifications, subscriptions
        const deletedBookings = await Booking.deleteMany({});
        const deletedChats = await Chat.deleteMany({});
        const deletedCalls = await CallHistory.deleteMany({});
        const deletedPayments = await Payment.deleteMany({});
        const deletedReviews = await Review.deleteMany({});
        const deletedTickets = await Ticket.deleteMany({});
        const deletedNotifications = await Notification.deleteMany({ user: { $ne: adminId } });
        const deletedSubs = await Subscription.deleteMany({ user: { $ne: adminId } });

        console.log(`Cleared ${deletedBookings.deletedCount} booking(s), ${deletedChats.deletedCount} chat(s), ${deletedCalls.deletedCount} call history record(s).`);
        console.log(`Cleared ${deletedPayments.deletedCount} payment(s), ${deletedReviews.deletedCount} review(s), ${deletedTickets.deletedCount} ticket(s).`);
        console.log(`Cleared ${deletedNotifications.deletedCount} notification(s) and ${deletedSubs.deletedCount} push subscription(s).`);

        // Ensure Admin user is intact and active
        if (adminUser) {
            console.log(`\n✅ Admin account preserved: ${adminUser.email} (Role: ${adminUser.role})`);
        } else {
            console.log('\n⚠️ Admin account was not found; recreating default admin...');
            await User.create({
                name: 'System Admin',
                email: ADMIN_EMAIL,
                password: 'Arunkumar@2006',
                role: 'admin'
            });
            console.log(`✅ Admin account created: ${ADMIN_EMAIL}`);
        }

        console.log('\nDatabase is now completely clean and ready for fresh user registration!');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanupNonAdminUsers();
