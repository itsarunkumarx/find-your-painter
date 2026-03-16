import { motion, AnimatePresence } from 'framer-motion';
import { FaPhone, FaPhoneSlash, FaVideo, FaUserTie, FaVolumeMute } from 'react-icons/fa';
import { useSocket } from '../context/SocketContext';

const IncomingCallModal = () => {
    const { incomingCall, acceptCall, rejectCall, isAudioBlocked } = useSocket();

    if (!incomingCall) return null;

    const { fromUserName, fromUserImage, callType } = incomingCall;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                {/* Full-screen pulsing alert overlay */}
                <motion.div
                    animate={{
                        backgroundColor: ['rgba(15, 23, 42, 0.7)', 'rgba(22, 163, 74, 0.15)', 'rgba(15, 23, 42, 0.7)'],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 100 }}
                    animate={{
                        scale: [1, 1.02, 1],
                        opacity: 1,
                        y: 0,
                        x: [0, -4, 4, -4, 4, 0] // Enhanced shake
                    }}
                    exit={{ scale: 0.8, opacity: 0, y: 100 }}
                    transition={{
                        type: 'spring',
                        damping: 20,
                        stiffness: 400,
                        scale: { duration: 0.5, repeat: Infinity },
                        x: { duration: 0.3, repeat: Infinity }
                    }}
                    className="relative bg-slate-900/95 rounded-[3.5rem] shadow-[0_0_150px_rgba(34,197,94,0.4)] w-full max-w-sm text-center overflow-hidden border border-white/30 backdrop-blur-3xl"
                >
                    {/* Animated background patterns */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(34,197,94,0.2)_0%,transparent_70%)]"
                        />
                    </div>

                    <div className="p-10 relative z-10">
                        {/* Status chip */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-8">
                            <motion.div
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-2 h-2 bg-green-500 rounded-full"
                            />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-400">Incoming Secure Line</span>
                        </div>

                        {/* Avatar with pulse ring */}
                        <div className="relative mx-auto w-28 h-28 mb-6">
                            <motion.div
                                animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute inset-0 rounded-[2rem] border-2 border-green-400"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                className="absolute inset-0 rounded-[2rem] border border-green-400"
                            />
                            <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-2 border-white/20 shadow-2xl">
                                {fromUserImage ? (
                                    <img src={fromUserImage} alt={fromUserName} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-4xl font-black text-yellow-400">
                                        {fromUserName?.charAt(0)?.toUpperCase() || <FaUserTie />}
                                    </div>
                                )}
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-white tracking-tight mb-1">{fromUserName || 'Someone'}</h2>
                        <motion.p
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                            className="text-[10px] font-black uppercase tracking-[0.4em] text-green-400 mb-8"
                        >
                            calling you…
                        </motion.p>

                        {/* Action buttons */}
                        <div className="flex items-center justify-center gap-8">
                            {/* Reject */}
                            <div className="flex flex-col items-center gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={rejectCall}
                                    className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center text-2xl shadow-xl shadow-red-500/30 hover:bg-red-400 transition-colors"
                                >
                                    <FaPhoneSlash />
                                </motion.button>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Decline</span>
                            </div>

                            {/* Accept */}
                            <div className="flex flex-col items-center gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    onClick={acceptCall}
                                    className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl shadow-xl shadow-green-500/30 hover:bg-green-400 transition-colors"
                                >
                                    {callType === 'video' ? <FaVideo /> : <FaPhone />}
                                </motion.button>
                                <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Accept</span>
                            </div>
                        </div>
                        
                        {/* Audio Blocked Alert */}
                        {isAudioBlocked && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 flex items-center justify-center gap-2 bg-yellow-400/10 border border-yellow-400/20 px-4 py-2 rounded-full mx-10"
                            >
                                <FaVolumeMute className="text-yellow-400 animate-pulse text-xs" />
                                <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400">Ringtone blocked - tap to hear</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-black/30 px-6 py-3 border-t border-white/5">
                        <p className="text-[8px] font-black text-yellow-400/50 uppercase tracking-[0.5em]">End-to-End Encrypted</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default IncomingCallModal;
