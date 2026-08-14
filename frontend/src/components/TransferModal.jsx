import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPhoneAlt, FaTimes, FaSearch, FaCommentDots } from 'react-icons/fa';
import { useSocket } from '../hooks/useSocket';
import api from '../utils/api';

/**
 * TransferModal — allows transferring an active call or chat to another user/worker.
 * Upgraded with top-level motion for better animations in Portals.
 */
const TransferModal = ({ mode = 'call', bookingId = null, onClose }) => {
    const { transferCall } = useSocket();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [transferring, setTransferring] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await api.get('/users?limit=50');
                setUsers(Array.isArray(data) ? data : (data.users || []));
            } catch (e) {
                console.error('TransferModal: failed to load users', e);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const handleTransferCall = async (targetUser) => {
        setTransferring(targetUser._id);
        try {
            transferCall(targetUser._id);
            onClose();
        } catch (e) {
            console.error('Transfer failed', e);
            setTransferring(null);
        }
    };

    const handleTransferChat = async (targetUser) => {
        if (!bookingId) return;
        setTransferring(targetUser._id);
        try {
            await api.put(`/bookings/${bookingId}/transfer`, { newUserId: targetUser._id });
            onClose();
        } catch (e) {
            console.error('Chat transfer failed', e);
            setTransferring(null);
        }
    };

    const handleTransfer = mode === 'call' ? handleTransferCall : handleTransferChat;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-sm bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10 z-10"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-royal-gold/20 flex items-center justify-center">
                            {mode === 'call' ? <FaPhoneAlt className="text-royal-gold" /> : <FaCommentDots className="text-royal-gold" />}
                        </div>
                        <div>
                            <h3 className="text-white font-black text-sm uppercase tracking-widest">
                                Transfer {mode === 'call' ? 'Call' : 'Chat'}
                            </h3>
                            <p className="text-white/40 text-[9px] uppercase tracking-widest">Select a recipient</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-colors"
                    >
                        <FaTimes size={12} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 pt-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/30 text-xs py-2.5 pl-9 pr-4 focus:outline-none focus:border-royal-gold/40 transition-colors"
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
                    {loading ? (
                        <div className="py-8 text-center text-white/30 text-xs uppercase tracking-widest">
                            Loading users...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-8 text-center text-white/30 text-xs uppercase tracking-widest">
                            No users found
                        </div>
                    ) : filtered.map(u => (
                        <motion.button
                            key={u._id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleTransfer(u)}
                            disabled={!!transferring}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-royal-gold/30 transition-all text-left"
                        >
                            <div className="w-9 h-9 rounded-xl bg-royal-gold/20 flex items-center justify-center text-royal-gold font-black text-sm flex-shrink-0">
                                {u.profileImage
                                    ? <img src={u.profileImage} alt={u.name} className="w-full h-full rounded-xl object-cover" />
                                    : u.name?.charAt(0)?.toUpperCase()
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-bold truncate">{u.name}</p>
                                <p className="text-white/40 text-[9px] truncate">{u.email}</p>
                            </div>
                            {transferring === u._id ? (
                                <div className="w-4 h-4 border-2 border-royal-gold border-t-transparent rounded-full animate-spin flex-shrink-0" />
                            ) : (
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-royal-gold/10 flex items-center justify-center">
                                    {mode === 'call' ? <FaPhoneAlt className="text-royal-gold text-[9px]" /> : <FaCommentDots className="text-royal-gold text-[9px]" />}
                                </div>
                            )}
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default TransferModal;
