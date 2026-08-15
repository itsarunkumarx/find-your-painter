import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaPhoneSlash, 
    FaMicrophone, 
    FaMicrophoneSlash, 
    FaVideo, 
    FaVideoSlash, 
    FaRandom, 
    FaVolumeUp,
    FaVolumeMute,
    FaExpand,
    FaCompress
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const CallOverlay = ({ 
    call, 
    status, 
    onHangUp, 
    onToggleMute, 
    onToggleVideo, 
    isMuted, 
    isVideoOff, 
    isAudioBlocked, 
    onTransfer 
}) => {
    const remoteVideoRef = useRef(null);
    const localVideoRef  = useRef(null);
    const remoteAudioRef = useRef(null);
    
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const [duration, setDuration] = useState('00:00');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    const isVideo = call?.type === 'video';
    const isTerminated = ['busy', 'declined', 'no_answer', 'failed'].includes(status);
    const isConnected = status === 'connected' || !!call?.remoteStream;

    // Attach and play remote stream immediately
    const attachAndPlay = useCallback(async (stream) => {
        if (!stream) return;

        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            remoteVideoRef.current.playsInline = true;
            try {
                remoteVideoRef.current.muted = false;
                await remoteVideoRef.current.play();
                setAudioUnlocked(true);
                setAudioError(false);
            } catch (err) {
                // If unmuted autoplay blocked by browser policy, play muted and show tap unmute prompt
                try {
                    remoteVideoRef.current.muted = true;
                    await remoteVideoRef.current.play();
                } catch (e) {}
                setAudioError(true);
            }
        }

        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.muted = false;
            try {
                await remoteAudioRef.current.play();
                setAudioUnlocked(true);
                setAudioError(false);
            } catch (err) {
                setAudioError(true);
            }
        }
    }, []);

    // Re-attach when remote stream changes
    useEffect(() => {
        if (call?.remoteStream) {
            attachAndPlay(call.remoteStream);
        }
    }, [call?.remoteStream, attachAndPlay]);

    // Attach local preview stream
    useEffect(() => {
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = call?.stream || null;
        }
    }, [call?.stream]);

    // Manual audio unlock triggered on screen tap
    const handleUnlockAudio = useCallback(async () => {
        setAudioError(false);
        setAudioUnlocked(true);
        if (remoteVideoRef.current) {
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.play().catch(() => {});
        }
        if (remoteAudioRef.current) {
            remoteAudioRef.current.muted = false;
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.play().catch(() => {});
        }
    }, []);

    // Timer calculation
    useEffect(() => {
        if (!call?.startTime) return;

        const updateTimer = () => {
            const elapsed = Math.max(0, Math.floor((Date.now() - call.startTime) / 1000));
            const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const secs = (elapsed % 60).toString().padStart(2, '0');
            setDuration(`${mins}:${secs}`);
        };

        const interval = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(interval);
    }, [call?.startTime]);

    // Recording handler
    const toggleRecording = async () => {
        if (isRecording) {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
            }
            return;
        }

        if (!call?.stream || !call?.remoteStream) {
            toast.error('Streams not active');
            return;
        }

        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const dest = audioCtx.createMediaStreamDestination();
            const localSource = audioCtx.createMediaStreamSource(call.stream);
            const remoteSource = audioCtx.createMediaStreamSource(call.remoteStream);
            localSource.connect(dest);
            remoteSource.connect(dest);

            const combinedStream = new MediaStream([
                ...dest.stream.getTracks(),
                ...(isVideo ? call.remoteStream.getVideoTracks() : [])
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
                a.download = `call_${Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                toast.success('Recording saved');
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
            toast.success('Recording started');
        } catch (err) {
            toast.error('Recording failed');
        }
    };

    const getStatusText = () => {
        if (isTerminated) return 'Call Ended';
        if (isConnected) return duration;
        switch (status) {
            case 'connecting': return 'Connecting...';
            case 'ringing':    return 'Ringing...';
            case 'busy':       return 'User Busy';
            case 'declined':   return 'Declined';
            case 'no_answer':  return 'No Answer';
            default:           return call?.isRinging ? 'Ringing...' : 'Securing Line...';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleUnlockAudio}
            className="fixed inset-0 z-[99999] bg-[#070b14] text-white flex flex-col justify-between overflow-hidden select-none"
        >
            {/* ── 1. FULLSCREEN REMOTE VIDEO (VIDEO CALLS) ────────────────── */}
            {isVideo && !isTerminated && (
                <div className="absolute inset-0 w-full h-full bg-black z-0 flex items-center justify-center">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        webkit-playsinline="true"
                        x5-playsinline="true"
                        className="w-full h-full object-cover"
                    />
                    {/* Placeholder when remote camera is still connecting */}
                    {!call?.remoteStream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-deep/90 gap-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="w-12 h-12 border-3 border-royal-gold/20 border-t-royal-gold rounded-full"
                            />
                            <p className="text-xs font-black uppercase tracking-widest text-royal-gold/70">
                                Connecting Camera...
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── 2. LOCAL PREVIEW PIP (FLOATING CORNER) ────────────────────── */}
            {isVideo && !isTerminated && call?.stream && (
                <motion.div
                    drag
                    dragConstraints={{ left: -100, right: 100, top: -200, bottom: 200 }}
                    className="absolute top-20 right-4 z-20 w-28 h-40 sm:w-40 sm:h-56 rounded-2xl overflow-hidden border-2 border-royal-gold/40 shadow-2xl bg-black/80 backdrop-blur-md cursor-grab active:cursor-grabbing"
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        webkit-playsinline="true"
                        x5-playsinline="true"
                        muted
                        className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
                    />
                    {isVideoOff && (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-navy-deep p-2 text-center">
                            <FaVideoSlash className="text-white/40 text-xl mb-1" />
                            <span className="text-[9px] font-black uppercase text-slate-400">Camera Off</span>
                        </div>
                    )}
                </motion.div>
            )}

            {/* ── 3. VOICE CALL AVATAR VIEW (WHEN NOT IN ACTIVE VIDEO) ─────── */}
            {(!isVideo || isTerminated || !call?.remoteStream) && (
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
                    {/* Pulsing ambient rings */}
                    <div className="relative mb-8">
                        <div className={`w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr ${isTerminated ? 'from-red-500' : 'from-royal-gold'} to-navy-light p-1 shadow-2xl flex items-center justify-center`}>
                            <div className="w-full h-full rounded-full bg-navy-deep flex items-center justify-center overflow-hidden">
                                {call?.contact?.profileImage ? (
                                    <img
                                        src={call.contact.profileImage}
                                        alt={call.contact.name}
                                        className={`w-full h-full object-cover ${isTerminated ? 'grayscale' : ''}`}
                                    />
                                ) : (
                                    <span className="text-4xl sm:text-6xl font-black text-royal-gold">
                                        {call?.contact?.name?.charAt(0)?.toUpperCase() || 'P'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {!isTerminated && [1, 2, 3].map((ring) => (
                            <motion.div
                                key={ring}
                                initial={{ opacity: 0.6, scale: 1 }}
                                animate={{ opacity: 0, scale: 2.2 }}
                                transition={{ repeat: Infinity, duration: 2, delay: ring * 0.6, ease: "easeOut" }}
                                className="absolute inset-0 rounded-full border border-royal-gold/40 pointer-events-none"
                            />
                        ))}
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
                        {call?.contact?.name || 'Painter'}
                    </h2>
                    <p className={`text-sm font-bold uppercase tracking-widest ${isTerminated ? 'text-red-400' : 'text-royal-gold'}`}>
                        {getStatusText()}
                    </p>
                </div>
            )}

            {/* ── 4. FLOATING TOP BAR ────────────────────────────────────────── */}
            <div className="relative z-30 pt-6 px-6 flex items-center justify-between w-full pointer-events-none">
                <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                    <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-royal-gold animate-ping'}`} />
                    <span className="text-xs font-black uppercase tracking-widest text-white">
                        {isVideo ? 'Video Call' : 'Voice Call'}
                    </span>
                    <span className="text-xs font-mono font-bold text-royal-gold ml-2">
                        {getStatusText()}
                    </span>
                </div>

                {/* Audio Unblock Notification Prompt */}
                {audioError && (
                    <motion.button
                        initial={{ scale: 0.9 }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        onClick={handleUnlockAudio}
                        className="pointer-events-auto flex items-center gap-2 bg-royal-gold text-navy-deep px-4 py-2 rounded-full font-black text-xs uppercase tracking-wider shadow-lg shadow-royal-gold/30 hover:brightness-110"
                    >
                        <FaVolumeUp className="text-sm" />
                        <span>Tap to Unmute</span>
                    </motion.button>
                )}
            </div>

            {/* ── 5. BOTTOM CONTROL DOCK (WhatsApp / iOS Native Call Style) ─── */}
            {!isTerminated && (
                <div className="relative z-30 pb-8 sm:pb-12 px-3 w-full flex items-center justify-center pointer-events-auto">
                    <div className="w-[94%] max-w-[340px] flex items-center justify-between gap-1 px-4 py-3 sm:px-5 sm:py-4 rounded-[2.2rem] bg-[#0c1424]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
                        {/* Mic Mute Button */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
                                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                                    isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                                title="Mute Mic"
                            >
                                {isMuted ? <FaMicrophoneSlash size={16} /> : <FaMicrophone size={16} />}
                            </button>
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-wider">{isMuted ? 'Unmute' : 'Mute'}</span>
                        </div>

                        {/* Video Toggle */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleVideo(); }}
                                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                                    isVideoOff ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                                title="Toggle Video"
                            >
                                {isVideoOff ? <FaVideoSlash size={16} /> : <FaVideo size={16} />}
                            </button>
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-wider">{isVideoOff ? 'Cam Off' : 'Camera'}</span>
                        </div>

                        {/* Call Recording */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleRecording(); }}
                                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                                    isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                                title="Record Call"
                            >
                                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
                            </button>
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-wider">{isRecording ? 'Rec...' : 'Record'}</span>
                        </div>

                        {/* Transfer */}
                        {onTransfer && (
                            <div className="flex flex-col items-center gap-1 shrink-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onTransfer(); }}
                                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 text-white hover:bg-royal-gold/30 hover:text-royal-gold flex items-center justify-center transition-all active:scale-90"
                                    title="Transfer Call"
                                >
                                    <FaRandom size={15} />
                                </button>
                                <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-wider">Transfer</span>
                            </div>
                        )}

                        {/* End Call Button */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                            <button
                                onClick={(e) => { e.stopPropagation(); onHangUp(); }}
                                className="w-12 h-12 sm:w-13 sm:h-13 bg-red-600 hover:bg-red-700 active:scale-90 rounded-full flex items-center justify-center transition-all shadow-xl shadow-red-600/50 text-white"
                                title="End Call"
                            >
                                <FaPhoneSlash size={18} className="rotate-[135deg]" />
                            </button>
                            <span className="text-[8px] sm:text-[9px] font-bold text-red-400 uppercase tracking-wider">End</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── DEDICATED REMOTE AUDIO ELEMENT ────────────────────────────── */}
            <audio
                ref={remoteAudioRef}
                autoPlay
                playsInline
                className="hidden"
                onPlay={() => { setAudioUnlocked(true); setAudioError(false); }}
            />
        </motion.div>
    );
};

export default CallOverlay;
