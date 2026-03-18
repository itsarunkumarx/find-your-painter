import { useState, useEffect } from 'react';
import api from '../utils/api';
import { AuthContext } from './AuthContextDefinition';
import { subscribeToNotifications } from '../utils/pushNotifications';
import safeStorage from '../utils/safeStorage';

export const AuthProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(() => {
        const userData = safeStorage.getItem('user');
        if (!userData) return null;
        try {
            return JSON.parse(userData);
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
            const { data } = await api.post('/auth/login', { email, password });
            safeStorage.setItem('token', data.token);
            safeStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            return { success: true, user: data };
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Login error:', error);
            }
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const googleLogin = async (access_token) => {
        try {
            const { data } = await api.post('/auth/google', { access_token });
            safeStorage.setItem('token', data.token);
            safeStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            return { success: true, user: data };
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Google login error:', error);
            }
            return { success: false, message: error.response?.data?.message || 'Google login failed' };
        }
    };

    const register = async (userData) => {
        try {
            const { data } = await api.post('/auth/register', userData);
            safeStorage.setItem('token', data.token);
            safeStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('Registration error:', error);
            }
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        safeStorage.removeItem('token');
        safeStorage.removeItem('user');
        setUser(null);
    };

    const updateUser = (userData) => {
        const updatedUser = { ...user, ...userData };
        safeStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
