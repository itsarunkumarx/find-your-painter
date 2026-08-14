import { createContext } from 'react';

// Default safe value prevents null crashes when useWorker() is called outside WorkerProvider
const defaultWorkerContext = {
    bookings: [],
    worker: null,
    earnings: null,
    reviews: [],
    loading: false,
    isRefreshing: false,
    error: null,
    refreshData: async () => {},
    updateBookingStatus: async () => ({ success: false }),
    toggleAvailability: async () => ({ success: false }),
    confirmPayment: async () => ({ success: false }),
};

export const WorkerContext = createContext(defaultWorkerContext);
