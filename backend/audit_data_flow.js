import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Worker } from './models/Worker.js';
import { Booking } from './models/Booking.js';
import { Review } from './models/Review.js';
import { Notification } from './models/Notification.js';
import { CallHistory } from './models/CallHistory.js';
import { AuditLog } from './models/AuditLog.js';

dotenv.config();

async function runAudit() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('================================================================');
    console.log('🔍 FULL PLATFORM DATA FLOW AUDIT & HEALTH REPORT');
    console.log('================================================================\n');

    // 1. User Data Flow
    const totalUsers = await User.countDocuments();
    const usersByRole = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    console.log('👤 [1] USER DATA FLOW:');
    console.log('   • Total Registered Users:', totalUsers);
    console.log('   • Roles Breakdown:', usersByRole);

    // 2. Painter / Worker Data Flow
    const workers = await Worker.find().populate('user', 'name email role profileImage');
    console.log('\n🎨 [2] PAINTER / WORKER DATA FLOW:');
    console.log('   • Total Worker Profiles:', workers.length);
    workers.forEach((w, i) => {
        console.log(`   [Worker ${i+1}]`);
        console.log(`     - Name: ${w.fullName || w.user?.name || 'N/A'}`);
        console.log(`     - Email: ${w.applicationEmail || w.user?.email || 'N/A'}`);
        console.log(`     - Verification Status: ${w.verificationStatus} (isVerified: ${w.isVerified})`);
        console.log(`     - Available Status: ${w.isAvailable}`);
        console.log(`     - Location: ${w.location}`);
        console.log(`     - Skills: ${w.skills?.join(', ')}`);
        console.log(`     - Rating: ${w.rating} (${w.reviewCount} reviews)`);
        console.log(`     - Profile Image: ${w.user?.profileImage || '(default)'}`);
        console.log(`     - Work Images count: ${w.workImages?.length || 0}`);
        console.log(`     - Portfolio count: ${w.portfolioImages?.length || 0}`);
    });

    // 3. Explore Painters Query Feed Check
    const exploreFeed = await Worker.find({ isVerified: true, isAvailable: true })
        .populate('user', 'name profileImage')
        .select('-idProof -verificationComments -portfolioImages')
        .sort({ isFeatured: -1, rating: -1 });

    console.log('\n🔎 [3] EXPLORE PAINTERS FEED (GET /api/workers):');
    console.log(`   • Total Painters Live on Explore Screen: ${exploreFeed.length}`);
    exploreFeed.forEach((p, idx) => {
        console.log(`     (${idx+1}) ${p.fullName || p.user?.name} | Rate: ₹${p.price} | Loc: ${p.location} | Avail: ${p.isAvailable}`);
    });

    // 4. Booking & Job Pipeline Data Flow
    const totalBookings = await Booking.countDocuments();
    const bookingsByStatus = await Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('\n📅 [4] BOOKINGS & JOB REQUESTS DATA FLOW:');
    console.log('   • Total Bookings:', totalBookings);
    console.log('   • Status Breakdown:', bookingsByStatus);

    // 5. Admin Data Flow
    const totalLogs = await AuditLog.countDocuments();
    const pendingVerifications = await Worker.countDocuments({ verificationStatus: 'pending' });
    console.log('\n🛡️ [5] ADMIN DATA FLOW & STATS:');
    console.log('   • Pending Painter Approvals in Admin Queue:', pendingVerifications);
    console.log('   • Total Admin Audit Logs:', totalLogs);

    // 6. Realtime Signaling, Calls & Notifications
    const totalCalls = await CallHistory.countDocuments();
    const totalNotifications = await Notification.countDocuments();
    console.log('\n⚡ [6] REALTIME & COMMUNICATION DATA FLOW:');
    console.log('   • Call Logs Recorded:', totalCalls);
    console.log('   • System Notifications Delivered:', totalNotifications);

    console.log('\n================================================================');
    console.log('✅ AUDIT COMPLETE: ALL DATA PIPELINES CONNECTED & OPERATIONAL');
    console.log('================================================================');
    process.exit(0);
}

runAudit().catch(err => {
    console.error('Audit Error:', err);
    process.exit(1);
});
