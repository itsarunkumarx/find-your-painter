import { LocalNotifications } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

let isInitialized = false;
let previousStatus = null;

export const initOfflineNotificationService = async () => {
    if (isInitialized) return;
    isInitialized = true;

    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
        try {
            // Request Android notification permissions
            const perm = await LocalNotifications.checkPermissions();
            if (perm.display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }

            // Create dedicated Android notification channel for system network alerts
            await LocalNotifications.createChannel({
                id: 'network_status',
                name: 'Network Status & Offline Alerts',
                description: 'Notifications for network connectivity drops and offline mode',
                importance: 4, // High importance (heads-up notification)
                visibility: 1,
                vibration: true,
                sound: 'beep.wav'
            });
        } catch (err) {
            console.warn('[OfflineNotification] Permission or channel error:', err.message);
        }
    }

    // Monitor network changes
    try {
        const initialStatus = await Network.getStatus();
        previousStatus = initialStatus.connected;

        Network.addListener('networkStatusChange', async (status) => {
            if (previousStatus === status.connected) return;
            previousStatus = status.connected;

            if (!status.connected) {
                // Trigger Offline Alert
                if (isNative) {
                    try {
                        await LocalNotifications.schedule({
                            notifications: [
                                {
                                    title: '⚠️ Find Your Painter: Offline Mode',
                                    body: 'You are currently disconnected. Offline features and cached data are still available.',
                                    id: 101,
                                    channelId: 'network_status',
                                    sound: undefined,
                                    schedule: { at: new Date(Date.now() + 100) }
                                }
                            ]
                        });
                    } catch (e) {
                        console.warn('[OfflineNotification] Push error:', e.message);
                    }
                }
                toast.error('Network disconnected. Running in Offline Mode.', {
                    duration: 4000,
                    icon: '📡'
                });
            } else {
                // Trigger Back Online Alert
                if (isNative) {
                    try {
                        await LocalNotifications.schedule({
                            notifications: [
                                {
                                    title: '🟢 Find Your Painter: Back Online',
                                    body: 'Internet connection restored. Real-time booking and painter discovery active.',
                                    id: 102,
                                    channelId: 'network_status',
                                    sound: undefined,
                                    schedule: { at: new Date(Date.now() + 100) }
                                }
                            ]
                        });
                    } catch (e) {
                        console.warn('[OfflineNotification] Push error:', e.message);
                    }
                }
                toast.success('Connection restored! You are back online.', {
                    duration: 3000,
                    icon: '⚡'
                });
            }
        });
    } catch (err) {
        // Fallback for standard browser window events
        window.addEventListener('offline', () => {
            toast.error('Network disconnected. Running in Offline Mode.', { icon: '📡' });
        });
        window.addEventListener('online', () => {
            toast.success('Connection restored! You are back online.', { icon: '⚡' });
        });
    }
};

// Manually trigger a test notification for verification
export const triggerTestOfflineNotification = async () => {
    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: '⚠️ Find Your Painter: Offline Alert (Test)',
                        body: 'Test notification: Network status listener is active & operational.',
                        id: Math.floor(Math.random() * 10000),
                        channelId: 'network_status',
                        schedule: { at: new Date(Date.now() + 200) }
                    }
                ]
            });
            toast.success('Triggered native Android offline notification!');
        } catch (e) {
            toast.error('Failed to trigger notification: ' + e.message);
        }
    } else {
        toast('Offline Notification Service is active (Web Preview)', { icon: '📡' });
    }
};
