import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { RINGTONE_SUITES } from '../constants/ringtones';
import { useTranslation } from 'react-i18next';
import {
    FaMusic, FaPlay, FaStop, FaCheckCircle, FaVolumeUp,
    FaSignal, FaHeadphones, FaMicrophoneAlt, FaShieldAlt, FaUpload, FaTrash
} from 'react-icons/fa';
import api from '../utils/api';
import { useRef } from 'react';

const RingtonesPage = () => {
    const { t } = useTranslation();
    if (!t) return null;
    const { user, audioSettings, updateAudioSettings, previewRingtone } = useSocket();
    const [previewing, setPreviewing] = useState(null); // { id, type }
    const [uploading, setUploading] = useState(null); // 'incoming' | 'outgoing' | null
    const incomingRef = useRef(null);
    const outgoingRef = useRef(null);

    const handlePreview = (id, type) => {
        if (previewing?.id === id && previewing?.type === type) {
            setPreviewing(null);
            // The previewRingtone internal logic handles multi-play prevention
        } else {
            setPreviewing({ id, type });
            previewRingtone(id, type);
            // Auto clear state after 60s to match context
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
            alert('File too large. Max size is 2MB.');
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
                alert(`${type === 'incoming' ? 'Ringtone' : 'Outgoing tone'} uploaded successfully`);
                // Force select custom if not already
                handleSelect('custom', type);
            } catch (err) {
                console.error('Upload failed:', err);
                alert('Upload failed. Please try again.');
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
            alert('Custom audio removed');
        } catch (err) {
            alert('Removal failed');
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
