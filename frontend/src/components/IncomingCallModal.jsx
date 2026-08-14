import React from 'react';
import { motion } from 'framer-motion';
import { FaPhone, FaPhoneSlash, FaVideo, FaUserTie, FaVolumeUp } from 'react-icons/fa';
import { useSocket } from '../hooks/useSocket';

/**
 * IncomingCallModal — Upgraded to Full-Screen "Premium" UI.
 * Provides a highly immersive experience similar to modern mobile calling apps.
 */
const IncomingCallModal = ({ data, onAccept, onReject, isAudioBlocked, manuallyPlayRingtone }) => {
    // console.log('[IncomingCallModal] Render with props:', { data, isAudioBlocked });

    if (!data) {
        // console.warn('[IncomingCallModal] Received null data prop, returning null');
        return null;
    }

    const { fromUserName, fromUserImage, callType } = data;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-navy-deep/95 backdrop-blur-3xl flex flex-col items-center justify-between py-20 px-6 text-white overflow-hidden"
        >
            {/* ── Background decoration ────────────────────────────────────── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                <motion.div
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 180, 270, 360],
                        opacity: [0.3, 0.1, 0.3]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(34,197,94,0.15)_0%,transparent_70%)]"
                />
            </div>

            {/* ── Top Section: Call Info ────────────────────────────────────── */}
            <div className="relative z-10 flex flex-col items-center text-center">
                {/* Status Chip */}
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="inline-flex items-center gap-3 px-6 py-2.5 bg-green-500/10 border border-green-500/20 rounded-full mb-12 backdrop-blur-md"
                >
                    <motion.div
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                    />
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-green-400">Secure Incoming Line</span>
                </motion.div>

                {/* Avatar with multiple pulse rings */}
                <div className="relative w-40 h-40 sm:w-56 sm:h-56 mb-8">
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                            className="absolute inset-0 rounded-[3rem] border-2 border-green-500/30"
                        />
                    ))}
                    
                    <motion.div 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-full h-full rounded-[3.5rem] bg-gradient-to-br from-green-500/20 to-transparent p-1 shadow-2xl relative z-10"
                    >
                        <div className="w-full h-full rounded-[3.4rem] overflow-hidden border-2 border-white/10 bg-slate-900 flex items-center justify-center">
                            {fromUserImage ? (
                                <img src={fromUserImage} alt={fromUserName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-6xl sm:text-8xl font-black text-green-400">
                                    {fromUserName?.charAt(0)?.toUpperCase() || <FaUserTie />}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-3 transition-all">{fromUserName || 'Inbound Caller'}</h2>
                <motion.p
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-sm sm:text-base font-bold uppercase tracking-[0.6em] text-green-400/80"
                >
                    is calling you…
                </motion.p>
            </div>

            {/* ── Middle: Audio Unblock ────────────────────────────────────── */}
            <div className="h-20 flex items-center justify-center">
                {isAudioBlocked && (
                    <motion.button
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={manuallyPlayRingtone}
                        className="flex items-center gap-4 bg-royal-gold/20 border border-royal-gold/40 px-8 py-4 rounded-3xl hover:bg-royal-gold/30 transition-all group"
                    >
                        <motion.div
                            animate={{ x: [0, 3, -3, 3, 0] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                        >
                            <FaVolumeUp className="text-royal-gold text-xl" />
                        </motion.div>
                        <span className="text-sm font-black uppercase tracking-widest text-royal-gold group-hover:scale-105 transition-transform">
                            Tap to hear Ringtone
                        </span>
                    </motion.button>
                )}
            </div>

            {/* ── Bottom Section: Actions ────────────────────────────────────── */}
            <div className="relative z-10 w-full max-w-lg px-10 flex items-center justify-between sm:justify-center sm:gap-40">
                {/* Decline */}
                <div className="flex flex-col items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onReject}
                        className="w-20 h-20 sm:w-24 sm:h-24 bg-red-500 text-white rounded-[2.5rem] flex items-center justify-center text-3xl shadow-2xl shadow-red-500/40 hover:bg-red-600 transition-colors"
                    >
                        <FaPhoneSlash className="rotate-[135deg]" />
                    </motion.button>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Decline</span>
                </div>

                {/* Accept */}
                <div className="flex flex-col items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        onClick={onAccept}
                        className="w-20 h-20 sm:w-24 sm:h-24 bg-green-500 text-white rounded-[2.5rem] flex items-center justify-center text-3xl shadow-2xl shadow-green-500/40 hover:bg-green-600 transition-colors"
                    >
                        {callType === 'video' ? <FaVideo /> : <FaPhone />}
                    </motion.button>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400">Accept</span>
                </div>
            </div>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <div className="relative z-10 flex flex-col items-center gap-2 opacity-30">
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.6em]">End-to-End Encrypted</p>
                <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>
        </motion.div>
    );
};

export default IncomingCallModal;
