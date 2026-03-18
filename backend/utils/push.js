import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
    'mailto:test@example.com',
    publicVapidKey,
    privateVapidKey
);

export const sendPushNotification = async (subscription, payload) => {
    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        // console.log('Push notification sent successfully');
    } catch (error) {
        console.error('Error sending push notification:', error);
        if (error.statusCode === 410) {
            // Subscription has expired or is no longer valid
            return { expired: true };
        }
    }
    return { success: true };
};
