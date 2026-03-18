import { useContext } from 'react';
import { AuthContext } from '../context/AuthContextDefinition';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a safe fallback instead of crashing
    if (import.meta.env.DEV) {
      console.warn('useAuth: AuthContext is not available. Make sure component is wrapped in AuthProvider.');
    }
    return { user: null, loading: false, login: async () => ({}), googleLogin: async () => ({}), register: async () => ({}), logout: () => {}, updateUser: () => {} };
  }
  return context;
};
