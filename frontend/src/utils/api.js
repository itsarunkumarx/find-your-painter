import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

// Ensure the baseURL doesn't end with /api if we are going to append it later,
// or handle it consistently.
// Most reliable: if baseURL contains /api, use it as is for base.
// If not, append /api.
const cleanBaseURL = baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;

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
