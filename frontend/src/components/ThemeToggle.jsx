import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-ivory-subtle dark:bg-slate-800 text-royal-gold shadow-lg border border-royal-gold/10 transition-colors duration-500 overflow-hidden group"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <AnimatePresence mode="wait">
                {theme === 'light' ? (
                    <motion.div
                        key="sun"
                        initial={{ y: 20, opacity: 0, rotate: -90 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: 90 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                        <FaSun className="text-xl" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="moon"
                        initial={{ y: 20, opacity: 0, rotate: -90 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: 90 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                        <FaMoon className="text-xl" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-royal-gold/0 to-royal-gold/5 group-hover:to-royal-gold/10 transition-all duration-500" />
        </button>
    );
};

export default ThemeToggle;
