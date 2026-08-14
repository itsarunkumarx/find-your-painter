import api from './api';

const cache = new Map();

/**
 * fastApi: A high-performance wrapper for axios that implements SWR (Stale-While-Revalidate).
 * It returns cached data immediately if available, then fetches fresh data in the background.
 */
const fastApi = {
    /**
     * getWithCache
     * @param {string} url - The endpoint to fetch
     * @param {object} options - Options including 'forceRefresh'
     * @param {function} onData - Callback for both cached and fresh data
     */
    getWithCache: async (url, onData, options = {}) => {
        const { forceRefresh = false } = options;

        // 1. Immediate Return from Cache
        if (!forceRefresh && cache.has(url)) {
            const cached = cache.get(url);
            if (import.meta.env.DEV) console.log(`[fastApi] SWR Hit: ${url}`);
            onData(cached.data, true); // true = isCached
            
            // If cache is very fresh (< 10 seconds), maybe skip revalidation?
            // For now, always revalidate for "instant" feel with fresh data.
            if (Date.now() - cached.timestamp < 10000) {
                 return; 
            }
        }

        // 2. Background Revalidation
        try {
            const res = await api.get(url);
            cache.set(url, { data: res.data, timestamp: Date.now() });
            if (import.meta.env.DEV) console.log(`[fastApi] Fresh Sync: ${url}`);
            onData(res.data, false); // false = isNotCached (fresh)
        } catch (error) {
            if (import.meta.env.DEV) console.error(`[fastApi] Sync Failed: ${url}`, error);
            // If we have cached data, we already called onData, so the user sees SOMETHING.
            throw error;
        }
    },

    /**
     * prefetch: Silently fetch and cache data without a callback.
     * Used for onMouseEnter navigation prefetching.
     */
    prefetch: async (url) => {
        if (cache.has(url)) {
            const cached = cache.get(url);
            if (Date.now() - cached.timestamp < 30000) return; // Don't prefetch if fresh < 30s
        }
        
        try {
            const res = await api.get(url);
            cache.set(url, { data: res.data, timestamp: Date.now() });
            if (import.meta.env.DEV) console.log(`[fastApi] Prefetched: ${url}`);
        } catch (e) {
            // Silently fail prefetch
        }
    },

    invalidate: (url) => {
        if (url) cache.delete(url);
        else cache.clear();
    }
};

export default fastApi;
