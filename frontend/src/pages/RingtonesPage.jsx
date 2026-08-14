import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { RINGTONE_SUITES } from '../constants/ringtones';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
    FaMusic, FaPlay, FaStop, FaCheckCircle, FaVolumeUp,
    FaSignal, FaHeadphones, FaMicrophoneAlt, FaShieldAlt, FaUpload, FaTrash
} from 'react-icons/fa';
import api from '../utils/api';

const RingtonesPage = () => {
    const { t } = useTranslation();
    if (!t) return null;
    const { user, audioSettings, updateAudioSettings, previewRingtone, queryHardwarePermissions, requestHardwareAccess } = useSocket();
    const [previewing, setPreviewing] = useState(null); // { id, type }
    const [uploading, setUploading] = useState(null); // 'incoming' | 'outgoing' | null
    const incomingRef = useRef(null);
    const outgoingRef = useRef(null);

    // Hardware diagnostic state
    const [permStatus, setPermStatus] = useState({ mic: 'unknown', camera: 'unknown' });
    const [isTestingHardware, setIsTestingHardware] = useState(false);
    const [micVolume, setMicVolume] = useState(0);
    const videoPreviewRef = useRef(null);
    const testStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const animFrameRef = useRef(null);

    const refreshPermissions = useCallback(async () => {
        if (queryHardwarePermissions) {
            const status = await queryHardwarePermissions();
            setPermStatus(status);
        }
    }, [queryHardwarePermissions]);

    useEffect(() => {
        refreshPermissions();
    }, [refreshPermissions]);

    const startHardwareTest = async () => {
        if (isTestingHardware) return;
        try {
            const res = await requestHardwareAccess({ audio: true, video: true });
            if (!res.success || !res.stream) {
                toast.error('Could not access microphone or camera. Please check browser permissions.');
                refreshPermissions();
                return;
            }

            testStreamRef.current = res.stream;
            setIsTestingHardware(true);
            refreshPermissions();

            // Setup video preview
            setTimeout(() => {
                if (videoPreviewRef.current && testStreamRef.current) {
                    videoPreviewRef.current.srcObject = testStreamRef.current;
                }
            }, 100);

            // Setup audio analyzer for microphone volume meter
            const audioTracks = res.stream.getAudioTracks();
            if (audioTracks.length > 0) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    const ctx = new AudioCtx();
                    audioContextRef.current = ctx;
                    const source = ctx.createMediaStreamSource(res.stream);
                    const analyser = ctx.createAnalyser();
                    analyser.fftSize = 256;
                    source.connect(analyser);

                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    const updateMeter = () => {
                        analyser.getByteFrequencyData(dataArray);
                        let sum = 0;
                        for (let i = 0; i < dataArray.length; i++) {
                            sum += dataArray[i];
                        }
                        const average = sum / dataArray.length;
                        setMicVolume(Math.round((average / 128) * 100));
                        animFrameRef.current = requestAnimationFrame(updateMeter);
                    };
                    updateMeter();
                }
            }
            toast.success('Camera & Microphone connected successfully');
        } catch (err) {
            toast.error('Hardware access failed: ' + err.message);
        }
    };

    const stopHardwareTest = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }
        if (testStreamRef.current) {
            testStreamRef.current.getTracks().forEach(t => t.stop());
            testStreamRef.current = null;
        }
        if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = null;
        }
        setMicVolume(0);
        setIsTestingHardware(false);
        refreshPermissions();
    }, [refreshPermissions]);

    useEffect(() => {
        return () => {
            stopHardwareTest();
        };
    }, [stopHardwareTest]);

    const handlePreview = (id, type) => {
        if (previewing?.id === id && previewing?.type === type) {
            setPreviewing(null);
        } else {
            setPreviewing({ id, type });
            previewRingtone(id, type);
            setTimeout(() => setPreviewing(null), 60000);
        }
    };

    const handleSelect = (id, type) => {
        updateAudioSettings({ [type]: id });
    };

    const handleUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('File too large. Max size is 2MB.');
            return;
        }

        setUploading(type);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const fieldName = type === 'incoming' ? 'customRingtone' : 'customOutgoingTone';
                const { data } = await api.put('/users/profile', {
                    [fieldName]: reader.result
                });
                // Update context is handled via updateUser in Settings, 
                // but since SocketContext uses useAuth, it should update automatically 
                // IF we call updateUser.
                toast.success(`${type === 'incoming' ? 'Ringtone' : 'Outgoing tone'} uploaded successfully`);
                // Force select custom if not already
                handleSelect('custom', type);
            } catch (err) {
                if (import.meta.env.DEV) console.error('Upload failed:', err);
                toast.error('Upload failed. Please try again.');
            } finally {
                setUploading(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const removeCustom = async (type) => {
        if (!confirm('Are you sure you want to remove your custom audio?')) return;
        try {
            const fieldName = type === 'incoming' ? 'customRingtone' : 'customOutgoingTone';
            await api.put('/users/profile', {
                [fieldName]: ''
            });
            if (audioSettings[type] === 'custom') {
                handleSelect('standard', type);
            }
            toast.success('Custom audio removed');
        } catch (err) {
            toast.error('Removal failed');
        }
    };

    const SuiteCard = ({ id, suite }) => (
        <motion.div
            layout
            className="glass-card p-8 relative overflow-hidden group border border-royal-gold/5 hover:border-royal-gold/20 transition-all duration-500"
        >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <FaMusic size={60} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-[var(--text-main)] rounded-2xl flex items-center justify-center text-royal-gold shadow-lg">
                        <FaSignal />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-navy-deep">{suite.label}</h3>
                        <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.2em]">Sonification Profile</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Incoming Section */}
                    <div className={`p-6 rounded-3xl transition-all ${audioSettings.incoming === id ? 'bg-royal-gold/10 border-2 border-royal-gold' : 'bg-ivory-subtle border border-royal-gold/5'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Incoming Call</span>
                            {audioSettings.incoming === id && <FaCheckCircle className="text-royal-gold" />}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePreview(id, 'incoming')}
                                className="flex-1 py-3 bg-[var(--text-main)] text-royal-gold rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                {previewing?.id === id && previewing?.type === 'incoming' ? <FaStop /> : <FaPlay />}
                                Preview
                            </button>
                            <button
                                onClick={() => handleSelect(id, 'incoming')}
                                disabled={audioSettings.incoming === id}
                                className="px-4 py-3 bg-white text-navy-deep border border-royal-gold/20 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                            >
                                Set
                            </button>
                        </div>
                    </div>

                    {/* Outgoing Section */}
                    <div className={`p-6 rounded-3xl transition-all ${audioSettings.outgoing === id ? 'bg-navy-deep/5 border-2 border-navy-deep' : 'bg-ivory-subtle border border-royal-gold/5'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Outgoing Tone</span>
                            {audioSettings.outgoing === id && <FaCheckCircle className="text-navy-deep" />}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePreview(id, 'outgoing')}
                                className="flex-1 py-3 bg-white text-navy-deep border border-navy-deep/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                {previewing?.id === id && previewing?.type === 'outgoing' ? <FaStop /> : <FaPlay />}
                                Preview
                            </button>
                            <button
                                onClick={() => handleSelect(id, 'outgoing')}
                                disabled={audioSettings.outgoing === id}
                                className="px-4 py-3 bg-navy-deep text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                            >
                                Set
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-10 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-royal-gold">
                    <div className="w-10 h-10 bg-royal-gold/10 rounded-xl flex items-center justify-center text-royal-gold">
                        <FaHeadphones />
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Audio Output</p>
                        <p className="text-xs font-bold text-navy-deep">Stereo Reference</p>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-green-500">
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                        <FaMicrophoneAlt />
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Input Relay</p>
                        <p className="text-xs font-bold text-navy-deep">Active High-Gain</p>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-blue-500">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                        <FaShieldAlt />
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Encryption</p>
                        <p className="text-xs font-bold text-navy-deep">AES-256 Audio Packets</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Object.entries(RINGTONE_SUITES).map(([id, suite]) => (
                    <SuiteCard key={id} id={id} suite={suite} />
                ))}

                {/* Custom Profile Card */}
                <motion.div
                    layout
                    className="glass-card p-8 relative overflow-hidden group border-2 border-dashed border-royal-gold/20 hover:border-royal-gold/40 transition-all duration-500 bg-royal-gold/5"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <FaUpload size={60} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-royal-gold text-navy-deep rounded-2xl flex items-center justify-center shadow-lg">
                                <FaUpload />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-navy-deep">Custom Deployment</h3>
                                <p className="text-[10px] font-black text-royal-gold uppercase tracking-[0.2em]">User-Defined Protocols</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Custom Incoming */}
                            <div className={`p-6 rounded-3xl transition-all ${audioSettings.incoming === 'custom' ? 'bg-royal-gold/20 border-2 border-royal-gold' : 'bg-white/40 border border-royal-gold/10'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Custom Ringtone</span>
                                    {audioSettings.incoming === 'custom' && <FaCheckCircle className="text-royal-gold" />}
                                </div>
                                
                                <input type="file" ref={incomingRef} className="hidden" accept="audio/*" onChange={(e) => handleUpload(e, 'incoming')} />
                                
                                <div className="space-y-3">
                                    {user?.customRingtone ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePreview('custom', 'incoming')}
                                                className="flex-1 py-3 bg-navy-deep text-royal-gold rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                {previewing?.id === 'custom' && previewing?.type === 'incoming' ? <FaStop /> : <FaPlay />}
                                                Preview
                                            </button>
                                            <button
                                                onClick={() => handleSelect('custom', 'incoming')}
                                                disabled={audioSettings.incoming === 'custom'}
                                                className="px-4 py-3 bg-royal-gold text-navy-deep rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                                            >
                                                Set
                                            </button>
                                            <button onClick={() => removeCustom('incoming')} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => incomingRef.current.click()}
                                            disabled={uploading === 'incoming'}
                                            className="w-full py-6 bg-white border-2 border-dashed border-royal-gold/30 text-royal-gold rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-royal-gold/5 transition-all flex flex-col items-center gap-2"
                                        >
                                            <FaUpload size={20} />
                                            {uploading === 'incoming' ? 'Syncing...' : 'Upload Signal'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Custom Outgoing */}
                            <div className={`p-6 rounded-3xl transition-all ${audioSettings.outgoing === 'custom' ? 'bg-navy-deep/10 border-2 border-navy-deep' : 'bg-white/40 border border-royal-gold/10'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Custom Outgoing</span>
                                    {audioSettings.outgoing === 'custom' && <FaCheckCircle className="text-navy-deep" />}
                                </div>

                                <input type="file" ref={outgoingRef} className="hidden" accept="audio/*" onChange={(e) => handleUpload(e, 'outgoing')} />

                                <div className="space-y-3">
                                    {user?.customOutgoingTone ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePreview('custom', 'outgoing')}
                                                className="flex-1 py-3 bg-white text-navy-deep border border-navy-deep/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                {previewing?.id === 'custom' && previewing?.type === 'outgoing' ? <FaStop /> : <FaPlay />}
                                                Preview
                                            </button>
                                            <button
                                                onClick={() => handleSelect('custom', 'outgoing')}
                                                disabled={audioSettings.outgoing === 'custom'}
                                                className="px-4 py-3 bg-navy-deep text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                                            >
                                                Set
                                            </button>
                                            <button onClick={() => removeCustom('outgoing')} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => outgoingRef.current.click()}
                                            disabled={uploading === 'outgoing'}
                                            className="w-full py-6 bg-white border-2 border-dashed border-navy-deep/30 text-navy-deep rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-navy-deep/5 transition-all flex flex-col items-center gap-2"
                                        >
                                            <FaUpload size={20} />
                                            {uploading === 'outgoing' ? 'Syncing...' : 'Upload Link'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Hardware & Permissions Diagnostic Panel ───────────────────────── */}
            <div className="mt-12 p-8 sm:p-10 glass-card border border-royal-gold/15 bg-[var(--bg-base)] relative overflow-hidden transition-all duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-royal-gold font-black uppercase tracking-[0.3em] text-[10px]">
                            <FaShieldAlt /> {t('hardware_diagnostic_title', 'Hardware & Permissions Protocol')}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] uppercase tracking-tight">
                            {t('hardware_check_title', 'Camera & Microphone Access')}
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl">
                            {t('hardware_diagnostic_desc', 'Verify that your camera and microphone are authorized and functioning with optimal audio/video fidelity for WebRTC calls.')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isTestingHardware ? (
                            <button
                                onClick={startHardwareTest}
                                className="px-8 py-4 bg-royal-gold text-navy-deep rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3"
                            >
                                <FaMicrophoneAlt />
                                {t('test_hardware', 'Test Camera & Mic')}
                            </button>
                        ) : (
                            <button
                                onClick={stopHardwareTest}
                                className="px-8 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-red-600 transition-all flex items-center gap-3"
                            >
                                <FaStop />
                                {t('stop_test', 'Stop Hardware Test')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Status Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="p-6 rounded-2xl bg-[var(--bg-subtle)] border border-royal-gold/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-royal-gold/10 text-royal-gold flex items-center justify-center">
                                <FaMicrophoneAlt size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)]">{t('mic_status', 'Microphone Signal')}</h4>
                                <p className="text-[10px] text-[var(--text-muted)]">Audio Input for Voice & Video</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            permStatus.mic === 'granted'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : permStatus.mic === 'denied'
                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                            {permStatus.mic === 'granted' ? '● ' + t('perm_granted', 'Ready') : permStatus.mic === 'denied' ? '✕ ' + t('perm_denied', 'Blocked') : '◌ ' + t('perm_prompt', 'Verify')}
                        </span>
                    </div>

                    <div className="p-6 rounded-2xl bg-[var(--bg-subtle)] border border-royal-gold/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-navy-deep/10 dark:bg-white/10 text-royal-gold flex items-center justify-center">
                                <FaHeadphones size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)]">{t('cam_status', 'Camera Feed')}</h4>
                                <p className="text-[10px] text-[var(--text-muted)]">Video Stream for Consultations</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            permStatus.camera === 'granted'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : permStatus.camera === 'denied'
                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                            {permStatus.camera === 'granted' ? '● ' + t('perm_granted', 'Ready') : permStatus.camera === 'denied' ? '✕ ' + t('perm_denied', 'Blocked') : '◌ ' + t('perm_prompt', 'Verify')}
                        </span>
                    </div>
                </div>

                {/* Live Diagnostic Stream Area (When Active) */}
                <AnimatePresence>
                    {isTestingHardware && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-6 pt-4 border-t border-royal-gold/10"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                {/* Camera Preview */}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{t('camera_preview', 'Live Camera Feed')}</span>
                                    <div className="relative w-full h-56 bg-slate-900 rounded-3xl overflow-hidden border-2 border-royal-gold/20 shadow-2xl flex items-center justify-center">
                                        <video
                                            ref={videoPreviewRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover scale-x-[-1]"
                                        />
                                        <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                            Active Optical Link
                                        </div>
                                    </div>
                                </div>

                                {/* Microphone VU Level Meter */}
                                <div className="space-y-4 p-6 rounded-3xl bg-[var(--bg-subtle)] border border-royal-gold/10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{t('mic_level', 'Microphone Audio Level')}</span>
                                    
                                    {/* Real-time Level Meter Bar */}
                                    <div className="w-full h-6 bg-slate-800 rounded-xl overflow-hidden p-1 border border-white/5 relative">
                                        <motion.div
                                            className="h-full rounded-lg bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 shadow-lg"
                                            style={{ width: `${Math.min(100, micVolume * 2)}%` }}
                                            transition={{ duration: 0.05 }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                        <span>Silence</span>
                                        <span>Optimal Speech</span>
                                        <span>Peak</span>
                                    </div>

                                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                        Speak into your microphone. The visual meter should deflect dynamically into the green/yellow spectrum.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-12 p-10 glass-card bg-gradient-to-r from-navy-deep to-slate-900 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h2 className="text-2xl font-black mb-2">Simulate Incoming Signal</h2>
                        <p className="text-slate-400 text-sm">Test your new audio protocol settings in a live sandbox environment.</p>
                    </div>
                    <button
                        onClick={() => handlePreview(audioSettings.incoming, 'incoming')}
                        className="px-10 py-5 bg-royal-gold text-navy-deep rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <FaVolumeUp />
                        {previewing?.id === audioSettings.incoming ? 'Signal Active...' : 'Test Signal Path'}
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-royal-gold/5 blur-[80px] rounded-full -translate-y-12 translate-x-12" />
            </div>
        </div>
    );
};

export default RingtonesPage;
