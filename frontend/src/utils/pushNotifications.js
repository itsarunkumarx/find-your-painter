import axios from 'axios';

const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const subscribeToNotifications = async () => {
    try {
        if (!('serviceWorker' in navigator)) return;

        const registration = await navigator.serviceWorker.ready;

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
        }

        // Send subscription to backend
        const token = localStorage.getItem('token');
        await axios.post(`${import.meta.env.VITE_API_URL}/api/notifications/subscribe`,
            { subscription },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Push subscription successful');
    } catch (error) {
        console.error('Push subscription failed:', error);
    }
};

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
