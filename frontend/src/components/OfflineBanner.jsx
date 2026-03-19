import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';

const OfflineBanner = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white py-3 px-4 shadow-2xl flex items-center justify-center gap-3"
                >
                    <FaWifi className="animate-pulse" />
                    <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
                        <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs">
                           You are currently offline
                        </span>
                        <span className="hidden sm:inline opacity-30">|</span>
                        <p className="text-[9px] sm:text-[10px] font-bold opacity-80 uppercase tracking-tight">
                            Some features like calling and messaging require internet.
                        </p>
                    </div>
                    <FaExclamationTriangle className="text-royal-gold/50" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OfflineBanner;
