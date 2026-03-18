const safeStorage = {
    getItem: (key, fallback = null) => {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : fallback;
        } catch (e) {
            if (import.meta.env.DEV) {
                console.warn(`[SafeStorage] Failed to get key "${key}":`, e.message);
            }
            return fallback;
        }
    },
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            if (import.meta.env.DEV) {
                console.error(`[SafeStorage] Failed to set key "${key}":`, e.message);
            }
            return false;
        }
    },
    removeItem: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            if (import.meta.env.DEV) {
                console.error(`[SafeStorage] Failed to remove key "${key}":`, e.message);
            }
            return false;
        }
    }
};

export default safeStorage;
