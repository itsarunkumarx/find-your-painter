import { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContextDefinition';
import { subscribeToNotifications } from '../utils/pushNotifications';

export const AuthProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(() => {
        const userData = localStorage.getItem('user');
        try {
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (user) {
            subscribeToNotifications();
        }
    }, [user]);

    const login = async (email, password) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            return { success: true, user: data };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const googleLogin = async (access_token) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google`, { access_token });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            return { success: true, user: data };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Google login failed' };
        }
    };

    const register = async (userData) => {
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, userData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
