import { motion, AnimatePresence } from 'framer-motion';
import {
    FaPhoneSlash, FaMicrophone, FaMicrophoneSlash,
    FaVideo, FaVideoSlash, FaLock, FaUserTie,
    FaVolumeUp, FaVolumeMute, FaPhoneAlt
} from 'react-icons/fa';
import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * ActiveCallModal — shows when there is an active WebRTC call.
 * Reads from SocketContext.activeCall and calls hangUp() to end it.
 */
const CallModal = () => {
    const { activeCall, hangUp } = useSocket();
    const [timer, setTimer] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isSpeakerOff, setIsSpeakerOff] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteAudioRef = useRef(null);

    const [isFullScreen, setIsFullScreen] = useState(false);
    const containerRef = useRef(null);

    // Attach local stream to local video element
    useEffect(() => {
        if (activeCall?.stream && localVideoRef.current) {
            localVideoRef.current.srcObject = activeCall.stream;
        }
    }, [activeCall?.stream]);

    // Attach remote stream to remote audio/video element
    useEffect(() => {
        if (activeCall?.remoteStream) {
            if (activeCall.type === 'video' && remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = activeCall.remoteStream;
            }
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = activeCall.remoteStream;
            }
        }
    }, [activeCall?.remoteStream]);

    // Timer
    useEffect(() => {
        if (!activeCall) { setTimer(0); return; }
        const interval = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, [!!activeCall]);

    // Mute / unmute local audio track
    useEffect(() => {
        if (!activeCall?.stream) return;
        activeCall.stream.getAudioTracks().forEach(t => { t.enabled = !isMuted; });
    }, [isMuted, activeCall?.stream]);

    // Toggle local video track
    useEffect(() => {
        if (!activeCall?.stream) return;
        activeCall.stream.getVideoTracks().forEach(t => { t.enabled = !isVideoOff; });
    }, [isVideoOff, activeCall?.stream]);

    const toggleFullScreen = () => {
        if (!containerRef.current) return;
        if (!isFullScreen) {
            if (containerRef.current.requestFullscreen) containerRef.current.requestFullscreen();
            else if (containerRef.current.webkitRequestFullscreen) containerRef.current.webkitRequestFullscreen();
            else if (containerRef.current.msRequestFullscreen) containerRef.current.msRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        }
        setIsFullScreen(!isFullScreen);
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    if (!activeCall) return null;

    const { contact, type } = activeCall;
    const isVideo = type === 'video';
    const hasRemote = !!activeCall.remoteStream;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
                />

                {/* Hidden audio element for remote audio (voice & video calls) */}
                <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

                <motion.div
                    ref={containerRef}
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className={`relative w-full ${isFullScreen ? 'h-screen max-w-none rounded-none' : 'max-w-sm h-auto bg-slate-900 rounded-[2.5rem] overflow-hidden'} shadow-2xl transition-all duration-500 border border-white/10`}
                >
                    {/* ── Video area ── */}
                    {isVideo && (
                        <div className={`relative w-full ${isFullScreen ? 'h-full' : 'h-[280px]'} bg-slate-800 group`}>
                            {/* Remote video (full area) */}
                            {hasRemote ? (
                                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                                    <div className="w-24 h-24 rounded-full border-2 border-yellow-500/20 flex items-center justify-center mb-4">
                                        <FaUserTie className="text-4xl text-yellow-500/40" />
                                    </div>
                                    <motion.div
                                        animate={{ opacity: [1, 0.4, 1] }}
                                        transition={{ duration: 1.2, repeat: Infinity }}
                                        className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-400"
                                    >
                                        Connecting…
                                    </motion.div>
                                </div>
                            )}

                            {/* Local camera — picture-in-picture */}
                            <motion.div
                                drag={!isFullScreen}
                                dragConstraints={{ top: 20, left: 20, right: 300, bottom: 200 }}
                                className={`absolute ${isFullScreen ? 'bottom-10 right-10 w-32 h-44' : 'bottom-4 right-4 w-24 h-32'} rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20 backdrop-blur-md`}
                            >
                                {!isVideoOff ? (
                                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-700 flex items-center justify-center text-white/40 text-2xl font-black">
                                        {contact?.name?.charAt(0) || <FaUserTie />}
                                    </div>
                                )}
                            </motion.div>

                            {/* Status and FullScreen Controls */}
                            <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/5">
                                    <span className={`w-2 h-2 rounded-full ${hasRemote ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'}`} />
                                    {hasRemote ? 'Live Connection' : 'Switching…'}
                                </span>

                                <button
                                    onClick={toggleFullScreen}
                                    className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/5"
                                >
                                    {isFullScreen ? '↙' : '↗'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={`${isFullScreen && isVideo ? 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-10 pt-20' : 'p-10'} flex flex-col items-center text-center transition-all`}>
                        {/* Call type label */}
                        {!isFullScreen && (
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.4em] text-yellow-500/60 mb-6">
                                <FaLock className="text-[8px]" />
                                {isVideo ? 'AES-256 Video Stream' : 'Secure Voice Channel'}
                            </div>
                        )}

                        {/* Avatar (voice calls) */}
                        {!isVideo && (
                            <div className="relative mb-8">
                                <motion.div
                                    animate={{
                                        boxShadow: hasRemote
                                            ? ['0 0 0 0px rgba(212,175,55,0.2)', '0 0 0 30px rgba(212,175,55,0)', '0 0 0 0px rgba(212,175,55,0)']
                                            : 'none'
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                                    className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-2 border-yellow-500 shadow-2xl"
                                >
                                    {contact?.profileImage ? (
                                        <img src={contact.profileImage} alt={contact.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-yellow-500 text-5xl font-black">
                                            {contact?.name?.charAt(0) || <FaUserTie />}
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        )}

                        <h2 className={`font-black text-white tracking-tight ${isFullScreen ? 'text-3xl mb-2' : 'text-2xl mb-1'}`}>
                            {contact?.name || 'Expert'}
                        </h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-60">
                            {contact?.role || 'Service Professional'}
                        </p>

                        {/* Phone number display (refined) */}
                        {!isFullScreen && contact?.phoneNumber && (
                            <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl mb-6 w-full group hover:bg-white/10 transition-all cursor-pointer">
                                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black block mb-1">
                                    Encrypted Device ID
                                </span>
                                <span className="text-sm font-black text-yellow-500 flex items-center justify-center gap-2 group-hover:text-white">
                                    <FaPhoneAlt size={10} className="mt-0.5" />
                                    {contact.phoneNumber}
                                </span>
                            </div>
                        )}

                        {/* Timer or status */}
                        <div className={`font-black text-white tabular-nums ${isFullScreen ? 'text-4xl mb-10' : 'text-2xl mb-8'}`}>
                            {hasRemote ? formatTime(timer) : (
                                <motion.span
                                    animate={{ opacity: [1, 0.4, 1] }}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                    className="text-yellow-500 text-xs font-black uppercase tracking-[0.4em]"
                                >
                                    {activeCall.isCaller ? (activeCall.isRinging ? 'Ringing…' : 'Establishing…') : 'Finalizing…'}
                                </motion.span>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-6">
                            {/* Mute */}
                            <button
                                onClick={() => setIsMuted(m => !m)}
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl transition-all shadow-lg ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'}`}
                            >
                                {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                            </button>

                            {/* End call */}
                            <button
                                onClick={hangUp}
                                className="w-20 h-20 bg-red-600 text-white rounded-[2rem] flex items-center justify-center text-3xl shadow-2xl shadow-red-600/30 hover:bg-red-500 hover:scale-110 active:scale-95 transition-all"
                            >
                                <FaPhoneSlash />
                            </button>

                            {/* Video / Volume toggle */}
                            {isVideo ? (
                                <button
                                    onClick={() => setIsVideoOff(v => !v)}
                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl transition-all shadow-lg ${isVideoOff ? 'bg-slate-700 text-white' : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'}`}
                                >
                                    {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsSpeakerOff(s => !s)}
                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl transition-all shadow-lg ${isSpeakerOff ? 'bg-slate-700 text-white' : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'}`}
                                >
                                    {isSpeakerOff ? <FaVolumeMute /> : <FaVolumeUp />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    {!isFullScreen && (
                        <div className="bg-black/20 px-8 py-5 text-center border-t border-white/5">
                            <p className="text-[7px] font-black text-yellow-500 uppercase tracking-[0.7em] opacity-40">
                                🔒 Secure Peer-to-Peer Tunnel
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CallModal;
