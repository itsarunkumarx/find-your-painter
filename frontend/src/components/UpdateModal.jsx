import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { 
    FaRocket, 
    FaDownload, 
    FaCheckCircle, 
    FaTimes, 
    FaSyncAlt, 
    FaAndroid 
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { CURRENT_APP_VERSION, dismissUpdate } from '../utils/appVersion';

const UpdateModal = ({ isOpen, onClose, updateInfo }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [progress, setProgress] = useState(0);

    if (!isOpen || !updateInfo) return null;

    const isNativeAndroid = Capacitor.isNativePlatform() || (
        typeof window !== 'undefined' && (
            Capacitor.getPlatform() === 'android' ||
            window.Capacitor?.isNativePlatform?.() || 
            /Android/i.test(navigator.userAgent)
        )
    );

    const handleUpdate = async () => {
        setIsUpdating(true);
        setProgress(15);

        // Progress simulation for smooth user UX
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 15;
            });
        }, 300);

        try {
            setTimeout(() => {
                clearInterval(interval);
                setProgress(100);

                if (isNativeAndroid) {
                    // Record dismissal so it doesn't loop
                    dismissUpdate(updateInfo.latestVersion);

                    // Trigger direct APK download or redirect to release page
                    const downloadUrl = updateInfo.downloadUrl || 'https://github.com/itsarunkumarx/find-your-painter/releases/latest';
                    toast.success('Downloading latest Android APK...', { icon: '📥' });
                    
                    // Create anchor to initiate system APK download
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.setAttribute('download', 'find-your-painter.apk');
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setTimeout(() => {
                        setIsUpdating(false);
                        onClose();
                    }, 2000);
                } else {
                    dismissUpdate(updateInfo.latestVersion);
                    // For Web/PWA: unregister old service workers and reload
                    toast.success('Updating web app to latest version...', { icon: '⚡' });
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(registrations => {
                            registrations.forEach(r => r.update());
                        });
                    }
                    setTimeout(() => {
                        window.location.reload();
                    }, 1200);
                }
            }, 1800);
        } catch (err) {
            clearInterval(interval);
            setIsUpdating(false);
            toast.error('Update initiation failed. Please try again.');
        }
    };

    const handleDismiss = () => {
        dismissUpdate(updateInfo.latestVersion);
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-navy-deep/80 backdrop-blur-2xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-gradient-to-b from-[#111c35] to-[#0a1122] rounded-[2.5rem] p-6 sm:p-8 border border-royal-gold/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-white overflow-hidden"
                >
                    {/* Golden ambient background glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-royal-gold/20 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-navy-light/30 rounded-full blur-[80px] pointer-events-none" />

                    {/* Close button (if not forced update) */}
                    {!updateInfo.forceUpdate && (
                        <button
                            onClick={handleDismiss}
                            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-400 hover:text-white transition-all z-10"
                        >
                            <FaTimes size={14} />
                        </button>
                    )}

                    {/* Header Icon & Tag */}
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="relative mb-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-royal-gold to-amber-300 p-0.5 shadow-xl shadow-royal-gold/20 flex items-center justify-center">
                                <div className="w-full h-full rounded-[1.4rem] bg-navy-deep flex items-center justify-center">
                                    <FaRocket className="text-2xl sm:text-3xl text-royal-gold animate-bounce" />
                                </div>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/30 text-royal-gold text-[10px] font-black uppercase tracking-widest mb-2">
                            <span>🚀 Version {updateInfo.latestVersion} Available</span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
                            {updateInfo.title || 'New App Upgrade Ready!'}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                            Current: <span className="text-slate-300 font-bold">v{CURRENT_APP_VERSION}</span> ➔ New: <span className="text-royal-gold font-bold">v{updateInfo.latestVersion}</span>
                        </p>
                    </div>

                    {/* What's New Section */}
                    {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 && (
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-6 space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                What's New:
                            </p>
                            {updateInfo.releaseNotes.map((note, index) => (
                                <div key={index} className="flex items-start gap-2.5 text-xs text-slate-200 font-medium leading-relaxed">
                                    <FaCheckCircle className="text-royal-gold mt-0.5 shrink-0 text-xs" />
                                    <span>{note}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Progress Bar (when downloading) */}
                    {isUpdating && (
                        <div className="mb-6 space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-300">
                                <span>{isNativeAndroid ? 'Downloading APK...' : 'Updating Assets...'}</span>
                                <span className="text-royal-gold">{progress}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-royal-gold to-amber-400 rounded-full shadow-lg"
                                    style={{ width: `${progress}%` }}
                                    transition={{ ease: 'easeOut', duration: 0.3 }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className={`w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-royal-gold via-amber-400 to-yellow-500 text-navy-deep font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-royal-gold/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${
                                isUpdating ? 'opacity-80 cursor-wait' : ''
                            }`}
                        >
                            {isUpdating ? (
                                <>
                                    <FaSyncAlt className="animate-spin text-sm" />
                                    <span>Processing Update...</span>
                                </>
                            ) : (
                                <>
                                    {isNativeAndroid ? <FaAndroid size={16} /> : <FaDownload size={14} />}
                                    <span>{isNativeAndroid ? 'Update APK Now' : 'Auto-Update Now'}</span>
                                </>
                            )}
                        </button>

                        {!updateInfo.forceUpdate && (
                            <button
                                onClick={handleDismiss}
                                disabled={isUpdating}
                                className="w-full py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors"
                            >
                                Remind Me Later
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default UpdateModal;
