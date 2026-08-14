import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        if (import.meta.env.DEV) {
            console.warn('useSocket: SocketContext not available. Make sure component is wrapped in SocketProvider.');
        }
        return {};
    }
    return context;
};
