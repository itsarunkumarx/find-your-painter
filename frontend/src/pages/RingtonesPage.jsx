import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket, RINGTONE_SUITES } from '../context/SocketContext';
import { useTranslation } from 'react-i18next';
import {
    FaMusic, FaPlay, FaStop, FaCheckCircle, FaVolumeUp,
    FaSignal, FaHeadphones, FaMicrophoneAlt, FaShieldAlt
} from 'react-icons/fa';

const RingtonesPage = () => {
    const { t } = useTranslation();
    const { audioSettings, updateAudioSettings, previewRingtone } = useSocket();
    const [previewing, setPreviewing] = useState(null); // { id, type }

    const handlePreview = (id, type) => {
        if (previewing?.id === id && previewing?.type === type) {
            setPreviewing(null);
            // The previewRingtone internal logic handles multi-play prevention
        } else {
            setPreviewing({ id, type });
            previewRingtone(id, type);
            // Auto clear state after 5s to match context
            setTimeout(() => setPreviewing(null), 5000);
        }
    };

    const handleSelect = (id, type) => {
        updateAudioSettings({ [type]: id });
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
            <div>
                <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">
                    Audio <span className="text-royal-gold">Protocols</span>
                </h1>
                <p className="text-[var(--text-muted)] text-sm mt-1 uppercase font-black tracking-widest text-[10px]">Customize your communication aesthetics and signal parameters.</p>
            </div>

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
