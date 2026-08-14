import axios from 'axios';
import safeStorage from './safeStorage';

const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '') {
        return import.meta.env.VITE_API_URL;
    }
    if (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '3000')) {
        return '';
    }
    return 'https://find-your-painter.onrender.com';
};

const rawBaseURL = getBaseURL();
// Aggressively remove any trailing slashes and any number of /api suffixes, then add exactly one.
const cleanBaseURL = `${rawBaseURL.replace(/\/+$/, '').replace(/(\/api)+$/, '')}/api`;

const api = axios.create({
    baseURL: cleanBaseURL,
    withCredentials: true,
});

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
    const token = safeStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
