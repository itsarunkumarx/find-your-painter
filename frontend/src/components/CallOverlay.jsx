import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaVolumeMute, FaRandom, FaVolumeUp } from 'react-icons/fa';
import toast from 'react-hot-toast';

const CallOverlay = ({ call, status, onHangUp, onToggleMute, onToggleVideo, isMuted, isVideoOff, isAudioBlocked, onTransfer }) => {
    const remoteVideoRef = useRef(null);
    const localVideoRef  = useRef(null);
    const remoteAudioRef = useRef(null);
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const [duration, setDuration] = useState('00:00');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const playAttemptRef = useRef(null);

    // Aggressively attach and play remote audio/video when stream changes
    const attachAndPlay = useCallback(async (stream) => {
        if (!stream) return;
        console.log('[CallOverlay] Attaching stream:', stream.id, 'Tracks:', stream.getTracks().length);

        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== stream) {
            remoteVideoRef.current.srcObject = stream;
            remoteVideoRef.current.play().catch(() => {});
        }

        if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== stream) {
            remoteAudioRef.current.srcObject = stream;
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.muted = false;

            let attempts = 0;
            const tryPlay = async () => {
                if (!remoteAudioRef.current) return;
                attempts++;
                try {
                    await remoteAudioRef.current.play();
                    setAudioUnlocked(true);
                    setAudioError(false);
                } catch (err) {
                    if (err.name === 'NotAllowedError') {
                        setAudioError(true);
                    } else if (attempts < 10) {
                        playAttemptRef.current = setTimeout(tryPlay, 500);
                    }
                }
            };
            await tryPlay();
        }
    }, []);

    // Re-attach when remote stream changes
    useEffect(() => {
        if (call?.remoteStream) {
            attachAndPlay(call.remoteStream);
        }
        return () => {
            if (playAttemptRef.current) clearTimeout(playAttemptRef.current);
        };
    }, [call?.remoteStream, attachAndPlay]);

    // Attach local video
    useEffect(() => {
        if (localVideoRef.current && call?.stream) {
            localVideoRef.current.srcObject = call.stream;
        } else if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
    }, [call?.stream]);

    // User manually unlocks audio by clicking the button
    const handleUnlockAudio = async () => {
        setAudioError(false);
        if (remoteAudioRef.current && call?.remoteStream) {
            remoteAudioRef.current.srcObject = call.remoteStream;
            remoteAudioRef.current.muted = false;
            try {
                await remoteAudioRef.current.play();
                setAudioUnlocked(true);
            } catch (e) {
                console.error('[CallOverlay] Manual audio unlock failed:', e);
            }
        }
    };

    const isVideo = call?.type === 'video';

    const getStatusText = () => {
        if (call?.startTime && (status === 'connected' || !status)) return duration;
        
        // Return a distinct "Action" status for the main label
        if (!call?.stream && !isTerminated) return 'Starting Camera...';
        
        switch (status) {
            case 'connecting': return 'Establishing Link...';
            case 'ringing':    return 'Ringing...';
            case 'busy':       return 'User is Busy';
            case 'declined':   return 'Call Declined';
            case 'no_answer':  return 'No Answer';
            case 'failed':     return 'Link Failed';
            case 'connected':  return duration;
            default: return call?.isRinging ? 'Ringing...' : 'Securing Line...';
        }
    };

    // ── Timer Logic ──────────────────────────────────────────────────────────
    // FIX: Timer runs whenever startTime is set — not gated on status string.
    // This ensures caller sees the timer as soon as the other person picks up.
    useEffect(() => {
        if (!call?.startTime) return;

        const updateTimer = () => {
            const elapsed = Math.max(0, Math.floor((Date.now() - call.startTime) / 1000));
            const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const secs = (elapsed % 60).toString().padStart(2, '0');
            setDuration(`${mins}:${secs}`);
        };

        const interval = setInterval(updateTimer, 1000);
        updateTimer(); // run immediately so 00:00 shows at once
        return () => clearInterval(interval);
    }, [call?.startTime]);

    // ── Recording Logic ──────────────────────────────────────────────────────
    const startRecording = async () => {
        if (!call?.stream || !call?.remoteStream) {
            toast.error('Streams not ready for recording');
            return;
        }

        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const dest = audioCtx.createMediaStreamDestination();

            // Mix local and remote audio
            const localSource = audioCtx.createMediaStreamSource(call.stream);
            const remoteSource = audioCtx.createMediaStreamSource(call.remoteStream);
            
            localSource.connect(dest);
            remoteSource.connect(dest);

            const combinedStream = new MediaStream([
                ...dest.stream.getTracks(),
                ...(call.type === 'video' ? call.remoteStream.getVideoTracks() : [])
            ]);

            const recorder = new MediaRecorder(combinedStream, {
                mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
                    ? 'video/webm;codecs=vp9,opus' 
                    : 'video/webm'
            });

            recordedChunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `call_recording_${new Date().toISOString()}.webm`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                toast.success('Recording saved successfully');
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            toast.success('Recording started');
        } catch (err) {
            console.error('[Recording] Failed to start:', err);
            toast.error('Could not start recording');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const isTerminated = ['busy', 'declined', 'no_answer', 'failed'].includes(status);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-navy-deep/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-white"
        >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] ${isTerminated ? 'bg-red-500' : 'bg-royal-gold'} rounded-full blur-[120px] transition-colors duration-1000`} />
                <div className={`absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] ${isTerminated ? 'bg-red-500' : 'bg-royal-gold'} rounded-full blur-[120px] transition-colors duration-1000`} />
            </div>

            {/* ── Video streams (video calls only) ──────────────────────────── */}
            <AnimatePresence>
                {isVideo && !isTerminated && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 w-full h-full flex items-center justify-center p-0 sm:p-10"
                    >
                        <div className="relative w-full h-full sm:max-w-5xl sm:rounded-[2.5rem] overflow-hidden bg-black/40 border border-white/10 shadow-2xl flex flex-col sm:block">
                            {/* Remote video */}
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-3/5 sm:h-full object-cover"
                            />

                            {/* Local preview (PiP on desktop, bottom strip on mobile portrait) */}
                            <motion.div
                                drag={!window.matchMedia('(max-width: 640px) and (orientation: portrait)').matches}
                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                className="absolute bottom-6 right-6 w-32 h-48 sm:w-48 sm:h-64 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-black cursor-move
                                    max-sm:relative max-sm:bottom-0 max-sm:right-0 max-sm:w-full max-sm:h-2/5 max-sm:rounded-none max-sm:border-0"
                            >
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover ${(isVideoOff || !call?.stream) ? 'hidden' : 'block'}`}
                                />
                                {(isVideoOff || !call?.stream) && (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-navy-deep gap-3 p-4 text-center">
                                        {isVideoOff ? (
                                            <FaVideoSlash className="text-white/20 text-3xl" />
                                        ) : (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                    className="w-10 h-10 border-2 border-royal-gold/20 border-t-royal-gold rounded-full"
                                                />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-royal-gold/60">
                                                    Starting Camera...
                                                </span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Avatar + status ────────────────────────────────────────────── */}
            <div className="relative z-10 flex flex-col items-center max-w-md w-full">
                <motion.div
                    animate={isTerminated ? { scale: [1, 0.95, 1] } : { scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="relative"
                >
                    <div className={`w-32 h-32 sm:w-48 sm:h-48 rounded-[2.5rem] bg-gradient-to-br ${isTerminated ? 'from-red-500' : 'from-royal-gold'} to-navy-deep p-[2px] shadow-2xl transition-colors duration-1000`}>
                        <div className="w-full h-full rounded-[2.4rem] bg-navy-deep flex items-center justify-center overflow-hidden">
                            {call?.contact?.profileImage ? (
                                <img
                                    src={call.contact.profileImage}
                                    alt={call.contact.name}
                                    className={`w-full h-full object-cover transition-all duration-1000 ${isTerminated ? 'grayscale' : ''}`}
                                />
                            ) : (
                                <span className={`text-4xl sm:text-6xl font-black transition-colors duration-1000 ${isTerminated ? 'text-red-500' : 'text-royal-gold'}`}>
                                    {call?.contact?.name?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                    {!isTerminated && (call?.remoteStream ? [1, 2] : [1, 2, 3, 4, 5]).map(i => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0.8, scale: 1 }}
                            animate={{ opacity: 0, scale: call?.remoteStream ? 2 : 2.5 }}
                            transition={{ 
                                repeat: Infinity, 
                                duration: call?.remoteStream ? 3 : 1.5, 
                                delay: i * (call?.remoteStream ? 1.5 : 0.3),
                                ease: "easeOut"
                            }}
                            className={`absolute inset-0 rounded-[2.5rem] border ${call?.remoteStream ? 'border-royal-gold/20' : 'border-royal-gold/60'} pointer-events-none`}
                        />
                    ))}
                </motion.div>

                <div className="mt-10 text-center px-4">
                    <div className={`text-[10px] font-black uppercase tracking-[0.6em] mb-4 transition-colors duration-1000 ${isTerminated ? 'text-red-500' : 'text-royal-gold'}`}>
                        {isTerminated ? 'Status: Terminated' : (call?.remoteStream ? '🔴 Live Session' : 'Encrypted Connection')}
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6">{call?.contact?.name}</h2>
                    <motion.p 
                        animate={(!call?.remoteStream && !isTerminated) ? { opacity: [1, 0.4, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`text-lg font-bold uppercase tracking-[0.3em] leading-relaxed transition-colors duration-1000 ${isTerminated ? 'text-red-400' : 'text-white/60'}`}
                    >
                        {getStatusText()}
                    </motion.p>
                </div>
            </div>

            {/* ── Controls ───────────────────────────────────────────────────── */}
            {!isTerminated && (
                <div className="mt-auto relative z-20 pb-10 flex items-center gap-4 sm:gap-6 max-sm:scale-125 max-sm:pb-16">
                    <button
                        onClick={onToggleMute}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-white text-navy-deep' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        title="Mute / Unmute"
                    >
                        {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
                    </button>

                    {/* Recording Button */}
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        title={isRecording ? 'Stop Recording' : 'Start Recording'}
                    >
                        <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
                    </button>

                    {onTransfer && (
                        <button
                            onClick={onTransfer}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 text-white hover:bg-royal-gold/30 hover:text-royal-gold flex items-center justify-center transition-all"
                            title="Transfer Call"
                        >
                            <FaRandom size={16} />
                        </button>
                    )}

                    <button
                        onClick={onHangUp}
                        className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 hover:bg-red-600 rounded-[2rem] flex items-center justify-center transition-all shadow-xl shadow-red-500/20"
                        title="End Call"
                    >
                        <FaPhoneSlash size={24} className="rotate-[135deg]" />
                    </button>

                    <button
                        onClick={onToggleVideo}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all ${isVideoOff ? 'bg-white text-navy-deep' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        title="Toggle Video"
                    >
                        {isVideoOff ? <FaVideoSlash size={20} /> : <FaVideo size={20} />}
                    </button>
                </div>
            )}

            {/* ── Top-left status ─────────────────────────────────────────────── */}
            <div className="absolute top-10 left-10 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-royal-gold rounded-full animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                        {isVideo ? 'Video Call' : 'Voice Call'}
                    </span>
                </div>

                {/* Audio unlock button — shows when autoplay is blocked */}
                {audioError && (
                    <motion.button
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        onClick={handleUnlockAudio}
                        className="flex items-center gap-2 bg-royal-gold/20 border border-royal-gold/40 px-3 py-1.5 rounded-full hover:bg-royal-gold/30 transition-colors"
                    >
                        <FaVolumeUp className="text-royal-gold animate-pulse text-xs" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-royal-gold">
                            Tap to hear audio
                        </span>
                    </motion.button>
                )}
            </div>

            {/*
             * CRITICAL: Separate <audio> element for remote audio.
             * The <video> element is muted to allow autoplay (browser policy).
             * Real audio plays through this dedicated element.
             * autoPlay + playsInline ensures browser attempts audio immediately.
             */}
            {/*
             * CRITICAL: Dedicated <audio> for remote caller audio.
             * The <video> is muted (browser policy). Real audio plays here.
             * onCanPlay + autoPlay gives two chances to start audio immediately.
             */}
            <audio
                ref={remoteAudioRef}
                autoPlay
                playsInline
                className="hidden"
                onCanPlay={() => {
                    if (remoteAudioRef.current) {
                        remoteAudioRef.current.muted = false;
                        remoteAudioRef.current.volume = 1.0;
                        remoteAudioRef.current.play().catch(e => {
                            if (e.name === 'NotAllowedError') setAudioError(true);
                        });
                    }
                }}
                onPlay={() => { setAudioUnlocked(true); setAudioError(false); }}
            />
        </motion.div>
    );
};

export default CallOverlay;
