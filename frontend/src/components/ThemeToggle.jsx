import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 text-royal-gold shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-royal-gold/10 transition-all duration-500 overflow-hidden group active:scale-95"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ y: 30, opacity: 0, rotate: -180, scale: 0.5 }}
                    animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ y: -30, opacity: 0, rotate: 180, scale: 0.5 }}
                    transition={{ 
                        type: 'spring', 
                        stiffness: 260, 
                        damping: 20 
                    }}
                    className="relative z-10"
                >
                    {theme === 'light' ? (
                        <FaSun className="text-xl sm:text-2xl drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                    ) : (
                        <FaMoon className="text-xl sm:text-2xl drop-shadow-[0_0_8px_rgba(252,211,77,0.4)]" />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Interactive Background Glow */}
            <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-royal-gold/0 via-royal-gold/5 to-royal-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "mirror"
                }}
            />
            
            <div className="absolute inset-0 border border-royal-gold/20 rounded-2xl opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-500" />
        </button>
    );
};

export default ThemeToggle;
