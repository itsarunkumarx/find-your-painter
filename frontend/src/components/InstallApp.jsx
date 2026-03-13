import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaAndroid, FaDownload, FaApple, FaTimes } from 'react-icons/fa';
import useDeviceDetect from '../hooks/useDeviceDetect';

const InstallApp = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstall, setShowInstall] = useState(false);
    const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('install-dismissed') === '1');
    const { isAndroid, isIOS, isDesktop, isStandalone } = useDeviceDetect();

    useEffect(() => {
        // Don't show if already installed or dismissed
        if (isStandalone || dismissed) return;

        // Capture the global prompt if already available
        if (window.deferredPrompt) {
            setDeferredPrompt(window.deferredPrompt);
            setShowInstall(true);
        }

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstall(true);
        };

        const handlePromptAvailable = () => {
            setDeferredPrompt(window.deferredPrompt);
            setShowInstall(true);
        };

        // Show for Android even if PWA prompt hasn't fired (they can download APK)
        if (isAndroid) setShowInstall(true);

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('pwa-prompt-available', handlePromptAvailable);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
        };
    }, [isStandalone, dismissed, isAndroid]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            window.deferredPrompt = null;
            setDeferredPrompt(null);
            setShowInstall(false);
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        setShowInstall(false);
        sessionStorage.setItem('install-dismissed', '1');
    };

    // Don't render anything if installed, dismissed, or nothing to show
    if (isStandalone || dismissed) return null;
    if (!showInstall && !isIOS) return null;

    return (
        <AnimatePresence>
            {/* Main Install Prompt — Android & Desktop */}
            {showInstall && !isIOS && (
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 60, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 p-5 border border-royal-gold/20 z-[100]"
                >
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-highlight)] transition-colors"
                    >
                        <FaTimes size={12} />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-2xl">🎨</span>
                        </div>
                        <div className="flex-1 pr-4">
                            <h3 className="font-black text-[var(--text-main)] mb-1 text-sm uppercase tracking-wider">Get The App</h3>
                            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mb-3">
                                {isAndroid
                                    ? 'Install our app for the best experience with notifications & offline access.'
                                    : 'Add to your device for quick access, notifications & offline capabilities.'
                                }
                            </p>
                            <div className="flex gap-2">
                                {deferredPrompt && (
                                    <button
                                        onClick={handleInstallClick}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
                                    >
                                        <FaDownload size={10} />
                                        Install App
                                    </button>
                                )}
                                {isAndroid && (
                                    <a
                                        href="/FindYourPainter.apk"
                                        download="FindYourPainter.apk"
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-highlight)] border border-royal-gold/30 text-royal-gold text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-royal-gold/10 transition-all"
                                    >
                                        <FaAndroid className="text-green-400" size={12} />
                                        APK
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* iOS Install Instructions */}
            {isIOS && !isStandalone && (
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 60 }}
                    className="fixed bottom-24 left-4 right-4 bg-[var(--glass-bg)] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 p-5 border border-royal-gold/20 z-[100]"
                >
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-highlight)] transition-colors"
                    >
                        <FaTimes size={12} />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <FaApple className="text-white text-xl" />
                        </div>
                        <div className="flex-1 pr-4">
                            <h3 className="font-black text-[var(--text-main)] mb-1 text-sm uppercase tracking-wider">Install on iPhone</h3>
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                Tap <span className="font-bold text-[var(--text-main)]">Share</span> then <span className="font-bold text-[var(--text-main)]">"Add to Home Screen"</span> to install.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InstallApp;
