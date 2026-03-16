import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || '';
// Aggressively remove any trailing slashes and any number of /api suffixes, then add exactly one.
const cleanBaseURL = `${rawBaseURL.replace(/\/+$/, '').replace(/(\/api)+$/, '')}/api`;

const api = axios.create({
    baseURL: cleanBaseURL,
});

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
