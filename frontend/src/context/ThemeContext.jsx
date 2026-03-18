import React, { createContext, useContext, useState, useEffect } from 'react';
import safeStorage from '../utils/safeStorage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(safeStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        safeStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        if (import.meta.env.DEV) {
            console.warn('useTheme: ThemeContext not available. Make sure component is wrapped in ThemeProvider.');
        }
        return { theme: 'light', toggleTheme: () => {}, setTheme: () => {} };
    }
    return context;
};
