import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaCalendarAlt, FaUser, FaCheck, FaTimes, FaComments, FaCheckCircle,
    FaInbox, FaMapMarkerAlt, FaTools, FaPlay, FaPause, FaFlagCheckered, FaClock,
    FaPaintRoller
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Chat from '../components/Chat'; // Moved this import here

const subStatusMap = {
    not_started: { label: 'Awaiting Start', color: 'bg-slate-100 text-slate-500', icon: FaClock },
    started: { label: 'In Preparation', color: 'bg-blue-50 text-blue-500', icon: FaTools },
    in_progress: { label: 'Ongoing Work', color: 'bg-yellow-50 text-yellow-600', icon: FaPlay },
    completed: { label: 'Finalized', color: 'bg-green-50 text-green-600', icon: FaCheckCircle },
};

import { useWorker } from '../hooks/useWorker';

const WorkerJobs = () => {
    const { t } = useTranslation();
    const { bookings, loading, updateBookingStatus } = useWorker();
    const [filterStatus, setFilterStatus] = useState('active'); // requests, active, completed
    const [selectedChat, setSelectedChat] = useState(null);

    const handleUpdateStatus = async (id, status, subStatus = null) => {
        const result = await updateBookingStatus(id, status, subStatus);
        if (!result.success) {
            alert(result.message);
        }
    };

    const filteredJobs = bookings.filter(j => {
        if (filterStatus === 'requests') return j.status === 'pending';
        if (filterStatus === 'active') return j.status === 'accepted' && j.subStatus !== 'completed';
        if (filterStatus === 'completed') return j.status === 'completed' || j.subStatus === 'completed';
        return true;
    });

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        Pipeline <span className="text-yellow-500">Management</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Track your active paint contracts and manage work orders.</p>
                </div>

                <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    {['requests', 'active', 'completed'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilterStatus(tab)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white rounded-[2.5rem] animate-pulse border border-slate-100 shadow-sm" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredJobs.map((job, i) => {
                            const subCfg = subStatusMap[job.subStatus] || subStatusMap.not_started;

                            return (
                                <motion.div
                                    key={job._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 md:p-8"
                                >
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        {/* Client Info */}
                                        <div className="flex items-center gap-6 lg:w-1/4">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 text-xl border border-slate-100 uppercase">
                                                    {job.user?.name?.charAt(0)}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Client Node</p>
                                                <h3 className="text-lg font-black text-slate-800">{job.user?.name}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                                    <FaCalendarAlt className="text-yellow-500" />
                                                    {new Date(job.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Job Details & Status */}
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Service Type</p>
                                                    <div className="flex items-center gap-2 text-slate-700">
                                                        <FaPaintRoller className="text-yellow-500 text-xs" />
                                                        <span className="text-xs font-black uppercase tracking-widest">{job.serviceType || 'Interior Painting'}</span>
                                                    </div>
                                                </div>
                                                <div className={`p-4 rounded-2xl border border-transparent transition-all ${subCfg.color}`}>
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Execution Status</p>
                                                    <div className="flex items-center gap-2">
                                                        <subCfg.icon className="text-xs" />
                                                        <span className="text-xs font-black uppercase tracking-widest tracking-tighter">{subCfg.label}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {job.message && (
                                                <div className="p-4 bg-yellow-50/50 border border-yellow-100/50 rounded-2xl">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-yellow-700/60 mb-1">Client Instruction</p>
                                                    <p className="text-xs text-slate-600 italic leading-relaxed">"{job.message}"</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Execution Controls */}
                                        <div className="lg:w-1/4 flex flex-col justify-center gap-3">
                                            {filterStatus === 'requests' && (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUpdateStatus(job._id, 'accepted', 'not_started')}
                                                            className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(job._id, 'rejected')}
                                                            className="px-4 py-3.5 bg-white text-slate-400 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all active:scale-95"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </div>
                                                    {job.location && (
                                                        <a
                                                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.location)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full py-2 bg-blue-50 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                                                            title="Check Distance on Map"
                                                        >
                                                            <FaMapMarkerAlt /> View Location
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {filterStatus === 'active' && (
                                                <div className="space-y-2">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setSelectedChat(job)}
                                                            className="flex-1 py-3 bg-white text-slate-800 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <FaComments /> Chat
                                                        </button>
                                                    </div>

                                                    {job.subStatus === 'not_started' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(job._id, 'accepted', 'started')}
                                                            className="w-full py-3.5 bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg flex items-center justify-center gap-2"
                                                        >
                                                            <FaPlay /> Start Implementation
                                                        </button>
                                                    )}

                                                    {/* Track Location Button */}
                                                    {job.location && (
                                                        <a
                                                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.location)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full py-3 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                                                            title="Track Direct Location & Distance"
                                                        >
                                                            <FaMapMarkerAlt /> Track Location
                                                        </a>
                                                    )}

                                                    {job.subStatus === 'started' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(job._id, 'accepted', 'in_progress')}
                                                            className="w-full py-3.5 bg-yellow-500 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-lg flex items-center justify-center gap-2"
                                                        >
                                                            <FaPause /> Prep Completed
                                                        </button>
                                                    )}
                                                    {job.subStatus === 'in_progress' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(job._id, 'completed', 'completed')}
                                                            className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                                                        >
                                                            <FaFlagCheckered /> Handover & Close
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {filterStatus === 'completed' && (
                                                <div className="flex items-center justify-center gap-2 px-6 py-4 bg-green-50 text-green-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-green-100">
                                                    <FaCheckCircle /> Successfully Closed
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {filteredJobs.length === 0 && (
                            <div className="py-32 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                                <FaInbox className="text-4xl text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Pipeline empty for this status</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {selectedChat && (
                <Chat booking={selectedChat} onClose={() => setSelectedChat(null)} />
            )}
        </div>
    );
};

export default WorkerJobs;
