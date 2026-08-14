import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../utils/api';
import fastApi from '../utils/fastApi';
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
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Prevent redundant fetches
    const lastFetchRef = useRef(0);

    const refreshData = useCallback(async (force = false) => {
        if (!user || user.role !== 'worker') return;

        // Cooldown period for non-forced refreshes (5 seconds)
        const now = Date.now();
        if (!force && now - lastFetchRef.current < 5000) return;

        // Only show full loading if we have no worker data yet
        if (force && !worker) setLoading(true);
        else if (!force) setIsRefreshing(true);
        
        setError(null);
        try {
            // Parallelized SWR fetching for all worker-critical data
            await Promise.all([
                fastApi.getWithCache('/bookings/worker-bookings', (data) => setBookings(data || []), { forceRefresh: force }),
                fastApi.getWithCache('/workers/profile', (workerData) => {
                    setWorker(workerData);
                    if (workerData?._id) {
                        fastApi.getWithCache(`/reviews/worker/${workerData._id}`, (revs) => setReviews(revs || []), { forceRefresh: force });
                    }
                }, { forceRefresh: force }),
                fastApi.getWithCache('/workers/earnings', (data) => setEarnings(data), { forceRefresh: force })
            ]);

            lastFetchRef.current = Date.now();
        } catch (err) {
            if (import.meta.env.DEV) console.error("Worker data fetch error", err);
            setError(err.message || 'Failed to fetch worker intelligence');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user, worker]);

    useEffect(() => {
        if (user?.role === 'worker') {
            refreshData(true);

            // Auto-refresh every 60 seconds
            const interval = setInterval(() => {
                refreshData(false);
            }, 60000);

            return () => clearInterval(interval);
        } else {
            setLoading(false);
        }
    }, [user, refreshData]);

    const updateBookingStatus = async (id, status, subStatus = null) => {
        try {
            const { data } = await api.put(`/bookings/${id}/status`, {
                status,
                subStatus
            });

            // Update local state immediately
            setBookings(prev => prev.map(b => b._id === id ? { ...b, ...data } : b));
            return { success: true };
        } catch (error) {
            if (import.meta.env.DEV) console.error("Status update error", error);
            return {
                success: false,
                message: error.response?.data?.message || 'Synchronization failed'
            };
        }
    };

    const toggleAvailability = async () => {
        if (!worker) return { success: false, message: 'Identity not found' };
        try {
            const { data } = await api.put('/workers/availability', {
                isAvailable: !worker.isAvailable
            });

            setWorker(prev => ({ ...prev, isAvailable: data.isAvailable }));
            return { success: true, isAvailable: data.isAvailable };
        } catch (error) {
            if (import.meta.env.DEV) console.error("Toggle availability error", error);
            return { success: false, message: 'Directive rejected' };
        }
    };

    const confirmPayment = async (id) => {
        try {
            await api.post('/payments/confirm-cash-payment', { bookingId: id });
            setBookings(prev => prev.map(b => b._id === id ? { ...b, paymentStatus: 'paid' } : b));
            return { success: true };
        } catch (error) {
            if (import.meta.env.DEV) console.error("Payment confirmation error", error);
            return { success: false, message: "Receipt confirmation failed" };
        }
    };

    const value = useMemo(() => ({
        bookings,
        worker,
        earnings,
        reviews,
        loading,
        isRefreshing,
        error,
        refreshData,
        updateBookingStatus,
        toggleAvailability,
        confirmPayment
    }), [
        bookings,
        worker,
        earnings,
        reviews,
        loading,
        isRefreshing,
        error,
        refreshData
    ]);

    return <WorkerContext.Provider value={value}>{children}</WorkerContext.Provider>;
};
