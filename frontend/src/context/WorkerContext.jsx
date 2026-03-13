import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { WorkerContext } from './WorkerContextDefinition';
import { useAuth } from '../hooks/useAuth';

export const WorkerProvider = ({ children }) => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [worker, setWorker] = useState(null);
    const [earnings, setEarnings] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Prevent redundant fetches
    const lastFetchRef = useRef(0);

    const refreshData = useCallback(async (force = false) => {
        if (!user || user.role !== 'worker') return;

        // Cooldown period for non-forced refreshes (5 seconds)
        const now = Date.now();
        if (!force && now - lastFetchRef.current < 5000) return;

        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [bookingsRes, workerRes, earningsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/bookings/worker-bookings`, config).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/workers/profile`, config).catch(() => ({ data: null })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/workers/earnings`, config).catch(() => ({ data: null }))
            ]);

            const workerData = workerRes.data;
            setBookings(bookingsRes.data);
            setWorker(workerData);
            setEarnings(earningsRes.data);

            if (workerData?._id) {
                const reviewsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/reviews/worker/${workerData._id}`, config).catch(() => ({ data: [] }));
                setReviews(reviewsRes.data || []);
            }

            lastFetchRef.current = Date.now();
        } catch (err) {
            console.error("Worker data fetch error", err);
            setError(err.message || 'Failed to fetch worker intelligence');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user?.role === 'worker') {
            refreshData();
        } else {
            setLoading(false);
        }
    }, [user, refreshData]);

    const updateBookingStatus = async (id, status, subStatus = null) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.put(`${import.meta.env.VITE_API_URL}/api/bookings/${id}/status`, {
                status,
                subStatus
            }, config);

            // Update local state immediately
            setBookings(prev => prev.map(b => b._id === id ? { ...b, ...data } : b));
            return { success: true };
        } catch (error) {
            console.error("Status update error", error);
            return {
                success: false,
                message: error.response?.data?.message || 'Synchronization failed'
            };
        }
    };

    const toggleAvailability = async () => {
        if (!worker) return { success: false, message: 'Identity not found' };
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.put(`${import.meta.env.VITE_API_URL}/api/workers/availability`, {
                isAvailable: !worker.isAvailable
            }, config);

            setWorker(prev => ({ ...prev, isAvailable: data.isAvailable }));
            return { success: true, isAvailable: data.isAvailable };
        } catch (error) {
            console.error("Toggle availability error", error);
            return { success: false, message: 'Directive rejected' };
        }
    };

    const confirmPayment = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`${import.meta.env.VITE_API_URL}/api/payments/confirm-cash-payment`, { bookingId: id }, config);
            setBookings(prev => prev.map(b => b._id === id ? { ...b, paymentStatus: 'paid' } : b));
            return { success: true };
        } catch (error) {
            console.error("Payment confirmation error", error);
            return { success: false, message: "Receipt confirmation failed" };
        }
    };

    const value = {
        bookings,
        worker,
        earnings,
        reviews,
        loading,
        error,
        refreshData,
        updateBookingStatus,
        toggleAvailability,
        confirmPayment
    };

    return <WorkerContext.Provider value={value}>{children}</WorkerContext.Provider>;
};
