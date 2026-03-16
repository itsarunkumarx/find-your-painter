import { useState, useEffect } from 'react';
import api from '../utils/api';
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
            const { data } = await api.post('/auth/login', { email, password });
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
            const { data } = await api.post('/auth/google', { access_token });
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
            const { data } = await api.post('/auth/register', userData);
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

    const updateUser = (userData) => {
        const updatedUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
