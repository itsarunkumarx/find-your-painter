import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Release history changelog
const APP_RELEASE_HISTORY = [
    {
        version: '1.4.0',
        versionCode: 4,
        releaseDate: '2026-08-15',
        type: 'major',
        title: 'HD VoIP Calling Engine & Live In-App Updater',
        highlights: [
            '🚀 Live In-App Auto Updater with Release History Center',
            '📞 Crystal-clear WebRTC two-way audio & video calling',
            '📱 Centered circular call action buttons tailored for mobile',
            '⚡ Instant painter booking & live status synchronization'
        ]
    },
    {
        version: '1.3.0',
        versionCode: 3,
        releaseDate: '2026-08-15',
        type: 'major',
        title: 'VoIP Calling Engine & In-App Auto Updater',
        highlights: [
            '🎨 Fullscreen HD video calling with floating PiP camera',
            '🔊 Crystal-clear WebRTC audio with instant touch unmute',
            '⚡ Instant painter booking with multi-service validation',
            '📱 Native Android in-app auto-update system with one-click APK installer',
            '⚙️ App Update Settings: toggles for auto-update, channel selection, and update logs'
        ]
    },
    {
        version: '1.2.0',
        versionCode: 2,
        releaseDate: '2026-08-10',
        type: 'minor',
        title: 'Realtime WebRTC Audio & Messaging Optimization',
        highlights: [
            '🎙️ Native Android audio manager VoIP mode integration',
            '💬 Instant socket messaging with delivery acknowledgments',
            '🔔 Push notification channel enhancements for background ringing'
        ]
    },
    {
        version: '1.1.0',
        versionCode: 1,
        releaseDate: '2026-08-01',
        type: 'minor',
        title: 'Painter Search, Map Integration & Multilingual Support',
        highlights: [
            '📍 Live GPS geolocation painter discovery with radius filtering',
            '🌐 Multi-language engine support (English, Telugu, Hindi, Tamil)',
            '⭐ Reviews and verification badge system for certified workers'
        ]
    },
    {
        version: '1.0.0',
        versionCode: 1,
        releaseDate: '2026-07-15',
        type: 'major',
        title: 'Initial Production Launch',
        highlights: [
            '🚀 Official launch of Find Your Painter platform',
            '💳 Secure booking workflow & payment gateway integration',
            '📊 Dedicated dashboards for Customers, Painters, and Admins'
        ]
    }
];

// Current system version configuration - Published live for Android apps
const APP_VERSION_DATA = {
    latestVersion: '1.4.0',
    versionCode: 4,
    minSupportedVersion: '1.0.0',
    releaseDate: '2026-08-15',
    title: 'New Update Available (v1.4.0) 🚀',
    releaseNotes: APP_RELEASE_HISTORY[0].highlights,
    history: APP_RELEASE_HISTORY,
    downloadUrl: 'https://github.com/itsarunkumarx/find-your-painter/releases/download/v1.4.0/find-your-painter.apk',
    webUrl: 'https://find-your-painter.vercel.app',
    forceUpdate: false
};

// GET /api/app/version - Return latest app version info
router.get('/version', (req, res) => {
    res.json(APP_VERSION_DATA);
});

// GET /api/app/history - Return full release history
router.get('/history', (req, res) => {
    res.json({
        total: APP_RELEASE_HISTORY.length,
        currentVersion: APP_VERSION_DATA.latestVersion,
        history: APP_RELEASE_HISTORY
    });
});

// GET /api/app/download-apk - Direct APK download link
router.get('/download-apk', (req, res) => {
    const localApkPath = path.join(__dirname, '..', 'uploads', 'apk', 'find-your-painter.apk');
    if (fs.existsSync(localApkPath)) {
        res.download(localApkPath, 'find-your-painter.apk');
    } else {
        res.redirect(APP_VERSION_DATA.downloadUrl);
    }
});

export default router;
