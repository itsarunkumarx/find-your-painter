import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaVolumeMute } from 'react-icons/fa';

const CallOverlay = ({ call, status, onHangUp, onToggleMute, onToggleVideo, isMuted, isVideoOff, isAudioBlocked }) => {
    const remoteVideoRef = useRef(null);
    const localVideoRef  = useRef(null);
    // ALWAYS use a dedicated <audio> element for remote audio.
    // Relying on the <video> element's audio is blocked by browsers unless muted=false,
    // but non-muted autoplay is blocked. Separate <audio> element sidesteps this.
    const remoteAudioRef = useRef(null);

    // Attach remote stream: video element gets the stream for the picture,
    // audio element gets the stream for the sound — on BOTH voice and video calls.
    useEffect(() => {
        if (!call.remoteStream) return;

        // Remote video (picture only — muted so browser allows autoplay)
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = call.remoteStream;
        }

        // Remote audio — always play audio via a dedicated element to avoid autoplay blocks
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = call.remoteStream;
            // Force play (browser may need a gesture first — we try here)
            const playPromise = remoteAudioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.warn('CallOverlay: Remote audio autoplay blocked —', err.name,
                        '— user interaction needed');
                });
            }
        }
    }, [call.remoteStream]);

    // Attach local stream to local preview (always muted to prevent echo)
    useEffect(() => {
        if (localVideoRef.current && call.stream) {
            localVideoRef.current.srcObject = call.stream;
        }
    }, [call.stream]);

    const isVideo = call.type === 'video';

    const getStatusText = () => {
        switch (status) {
            case 'connecting': return 'Initiating Secure Link...';
            case 'ringing':    return 'Ringing...';
            case 'busy':       return 'The person is currently busy';
            case 'declined':   return 'Call was declined';
            case 'no_answer':  return 'No answer — try again later';
            case 'failed':     return 'Secure link failed to establish';
            case 'connected':  return 'Connection Established';
            default: return call.isRinging ? 'Ringing...' : 'In Communication';
        }
    };

    const isTerminated = ['busy', 'declined', 'no_answer', 'failed'].includes(status);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-navy-deep/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-white"
        >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] ${isTerminated ? 'bg-red-500' : 'bg-royal-gold'} rounded-full blur-[120px] transition-colors duration-1000`} />
                <div className={`absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] ${isTerminated ? 'bg-red-500' : 'bg-royal-gold'} rounded-full blur-[120px] transition-colors duration-1000`} />
            </div>

            {/* ── Video streams (only for video calls) ──────────────────── */}
            <AnimatePresence>
                {isVideo && !isTerminated && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 w-full h-full flex items-center justify-center p-4 sm:p-10"
                    >
                        <div className="relative w-full h-full max-w-5xl rounded-[2.5rem] overflow-hidden bg-black/40 border border-white/10 shadow-2xl">
                            {/* Remote video — muted here because audio is handled by remoteAudioRef below */}
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                muted        // ← MUST be muted to allow autoplay; audio comes from <audio> element
                                className="w-full h-full object-cover"
                            />

                            {/* Local video preview (picture-in-picture) */}
                            <motion.div
                                drag
                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                className="absolute bottom-6 right-6 w-32 h-48 sm:w-48 sm:h-64 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-black cursor-move"
                            >
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted   // always mute local preview to prevent echo
                                    className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
                                />
                                {isVideoOff && (
                                    <div className="w-full h-full flex items-center justify-center bg-navy-deep">
                                        <FaVideoSlash className="text-white/20 text-3xl" />
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Voice-only avatar + status UI ──────────────────────────── */}
            <div className="relative z-10 flex flex-col items-center max-w-md w-full">
                <motion.div
                    animate={isTerminated ? { scale: [1, 0.95, 1] } : { scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="relative"
                >
                    <div className={`w-32 h-32 sm:w-48 sm:h-48 rounded-[2.5rem] bg-gradient-to-br ${isTerminated ? 'from-red-500' : 'from-royal-gold'} to-navy-deep p-[2px] shadow-2xl transition-colors duration-1000`}>
                        <div className="w-full h-full rounded-[2.4rem] bg-navy-deep flex items-center justify-center overflow-hidden">
                            {call.contact?.profileImage ? (
                                <img
                                    src={call.contact.profileImage}
                                    alt={call.contact.name}
                                    className={`w-full h-full object-cover transition-all duration-1000 ${isTerminated ? 'grayscale' : ''}`}
                                />
                            ) : (
                                <span className={`text-4xl sm:text-6xl font-black transition-colors duration-1000 ${isTerminated ? 'text-red-500' : 'text-royal-gold'}`}>
                                    {call.contact?.name?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                    {!isTerminated && [1, 2, 3].map(i => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0.5, scale: 1 }}
                            animate={{ opacity: 0, scale: 2 }}
                            transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                            className="absolute inset-0 rounded-[2.5rem] border border-royal-gold/30 pointer-events-none"
                        />
                    ))}
                </motion.div>

                <div className="mt-10 text-center px-4">
                    <div className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 animate-pulse transition-colors duration-1000 ${isTerminated ? 'text-red-500' : 'text-royal-gold'}`}>
                        {isTerminated ? 'Transmission Terminated' : (call.remoteStream ? 'Secure Channel Active' : 'Establishing Secure Link')}
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4">{call.contact?.name}</h2>
                    <p className={`text-base font-bold uppercase tracking-widest leading-relaxed transition-colors duration-1000 ${isTerminated ? 'text-red-400' : 'text-white/40'}`}>
                        {getStatusText()}
                    </p>
                </div>
            </div>

            {/* ── Controls ──────────────────────────────────────────────── */}
            {!isTerminated && (
                <div className="mt-auto relative z-20 pb-10 flex items-center gap-4 sm:gap-6">
                    <button
                        onClick={onToggleMute}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-white text-navy-deep' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
                    </button>

                    <button
                        onClick={onHangUp}
                        className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 hover:bg-red-600 rounded-[2rem] flex items-center justify-center transition-all shadow-xl shadow-red-500/20"
                    >
                        <FaPhoneSlash size={24} className="rotate-[135deg]" />
                    </button>

                    <button
                        onClick={onToggleVideo}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${isVideoOff ? 'bg-white text-navy-deep' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isVideoOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
                    </button>
                </div>
            )}

            {/* ── Status badge (top-left) ───────────────────────────────── */}
            <div className="absolute top-10 left-10 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-royal-gold rounded-full animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                        {isVideo ? 'Live Protocol' : 'Audio Stream'}
                    </span>
                </div>
                {isAudioBlocked && (
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex items-center gap-2 bg-royal-gold/10 border border-royal-gold/20 px-3 py-1.5 rounded-full"
                    >
                        <FaVolumeMute className="text-royal-gold animate-pulse text-xs" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-royal-gold">
                            Sound Blocked — tap anywhere to hear
                        </span>
                    </motion.div>
                )}
            </div>

            {/*
             * CRITICAL: This hidden <audio> element carries the remote audio for BOTH voice and video calls.
             * The <video> element above is muted so browsers allow autoplay of the picture.
             * Audio is routed here separately, which autoplay policy allows via user-initiated call flow.
             */}
            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
        </motion.div>
    );
};

export default CallOverlay;
