import api from './api';
import safeStorage from './safeStorage';

export const CURRENT_APP_VERSION = '1.3.0';
export const CURRENT_VERSION_CODE = 3;

// Semantic version comparison: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
export const compareVersions = (v1, v2) => {
    const clean1 = (v1 || '').replace(/^v/i, '').split('.').map(Number);
    const clean2 = (v2 || '').replace(/^v/i, '').split('.').map(Number);
    const maxLen = Math.max(clean1.length, clean2.length);

    for (let i = 0; i < maxLen; i++) {
        const num1 = clean1[i] || 0;
        const num2 = clean2[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
};

// Check for updates against backend
export const checkAppUpdate = async (manualCheck = false) => {
    try {
        const { data } = await api.get('/app/version');
        if (!data || !data.latestVersion) {
            return { hasUpdate: false, updateInfo: null };
        }

        const isNewer = compareVersions(data.latestVersion, CURRENT_APP_VERSION) > 0;
        const dismissedVersion = safeStorage.getItem('dismissed_update_version');

        // If not manual check and user dismissed this specific version (and not forced), skip popup
        if (!manualCheck && isNewer && !data.forceUpdate && dismissedVersion === data.latestVersion) {
            return { hasUpdate: false, updateInfo: data, isSilenced: true };
        }

        return {
            hasUpdate: isNewer,
            updateInfo: data,
            isForce: !!data.forceUpdate,
            currentVersion: CURRENT_APP_VERSION
        };
    } catch (err) {
        if (import.meta.env.DEV) console.warn('[AppUpdate] Failed to fetch version info:', err.message);
        return { hasUpdate: false, updateInfo: null, error: err.message };
    }
};

// Dismiss update reminder for this version
export const dismissUpdate = (version) => {
    if (version) {
        safeStorage.setItem('dismissed_update_version', version);
    }
};
