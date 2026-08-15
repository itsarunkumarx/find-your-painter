import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Current system version configuration
const APP_VERSION_DATA = {
    latestVersion: '1.3.0',
    versionCode: 3,
    minSupportedVersion: '1.0.0',
    releaseDate: '2026-08-15',
    title: 'New Update Available (v1.3.0) 🚀',
    releaseNotes: [
        '🎨 Fullscreen HD video calling with floating PiP camera',
        '🔊 Crystal-clear WebRTC audio with instant touch unmute',
        '⚡ Instant painter booking with multi-service validation',
        '📱 One-click Auto-Updater for Android APK & Web App'
    ],
    downloadUrl: 'https://github.com/itsarunkumarx/find-your-painter/releases/download/v1.3.0/find-your-painter.apk',
    webUrl: 'https://find-your-painter.vercel.app',
    forceUpdate: false
};

// GET /api/app/version - Return latest app version info
router.get('/version', (req, res) => {
    res.json(APP_VERSION_DATA);
});

// GET /api/app/download-apk - Direct APK download link
router.get('/download-apk', (req, res) => {
    // Check if local APK exists in uploads
    const localApkPath = path.join(__dirname, '..', 'uploads', 'apk', 'find-your-painter.apk');
    if (fs.existsSync(localApkPath)) {
        res.download(localApkPath, 'find-your-painter.apk');
    } else {
        // Redirect to GitHub release or primary download URL
        res.redirect(APP_VERSION_DATA.downloadUrl);
    }
});

export default router;
