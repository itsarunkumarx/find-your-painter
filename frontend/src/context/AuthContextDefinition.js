import { createContext } from 'react';

// Default safe value prevents null crashes when useAuth() is called outside AuthProvider
const defaultAuthContext = {
    user: null,
    loading: false,
    login: async () => ({ success: false, message: 'AuthProvider not mounted' }),
    googleLogin: async () => ({ success: false, message: 'AuthProvider not mounted' }),
    register: async () => ({ success: false, message: 'AuthProvider not mounted' }),
    logout: () => {},
    updateUser: () => {},
};

export const AuthContext = createContext(defaultAuthContext);
