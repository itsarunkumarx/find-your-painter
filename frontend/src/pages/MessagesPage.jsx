import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import { FaInbox, FaComments, FaSearch, FaCircle, FaPaintBrush, FaUserTie } from 'react-icons/fa';
import Chat from '../components/Chat';

const MessagesPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const socketRef = useRef(null);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/chat/conversations`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setConversations(data);
        } catch (error) {
            console.error('Fetch conversations failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();

        // Socket for real-time conversation updates
        const socket = io(import.meta.env.VITE_SOCKET_URL);
        socketRef.current = socket;
        socket.emit('user_online', user._id);
        socket.on('online_users', (users) => setOnlineUsers(users));
        socket.on('new_message', () => fetchConversations());

        return () => socket.disconnect();
    }, [user._id]);

    const getOtherUser = (conv) => {
        if (user.role === 'user') return conv.booking.worker?.user;
        if (user.role === 'worker') return conv.booking.user;
        // admin: show both
        return conv.booking.user;
    };

    const filteredConversations = conversations.filter(conv => {
        const other = getOtherUser(conv);
        return other?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    const handleSelectChat = (conv) => {
        setSelectedChat(conv.booking);
        // Optimistically clear unread for this booking
        setConversations(prev => prev.map(c =>
            c.booking._id === conv.booking._id ? { ...c, unreadCount: 0 } : c
        ));
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-navy-deep tracking-tight">
                        Messages <span className="text-royal-gold">Hub</span>
                        {totalUnread > 0 && (
                            <span className="ml-3 px-3 py-1 bg-royal-gold text-navy-deep text-xs font-black rounded-full animate-pulse">
                                {totalUnread} new
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-400 text-xs font-medium mt-1 uppercase tracking-widest">
                        {user.role === 'admin' ? 'All Platform Conversations' : user.role === 'worker' ? 'Client Communications' : 'Chat with your Painters'}
                    </p>
                </div>
                <div className="relative w-64">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-deep/20 text-xs" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-royal-gold/10 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-navy-deep placeholder-navy-deep/20 focus:outline-none focus:border-royal-gold transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[2.5rem] border border-royal-gold/10 shadow-2xl shadow-royal-gold/5 overflow-hidden flex min-h-0">
                {/* Conversations Sidebar */}
                <div className="w-72 border-r border-royal-gold/5 flex flex-col shrink-0">
                    <div className="px-6 py-4 border-b border-royal-gold/5 bg-ivory-subtle/30 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-navy-deep/40">
                            Conversations ({filteredConversations.length})
                        </span>
                        {user.role === 'admin' && (
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-royal-gold uppercase tracking-widest">
                                <FaUserTie size={8} /> All Roles
                            </span>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                [1, 2, 3, 4].map(i => (
                                    <div key={i} className="p-5 border-b border-royal-gold/5 animate-pulse flex items-center gap-4">
                                        <div className="w-11 h-11 bg-ivory-subtle rounded-xl shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-2 w-24 bg-ivory-subtle rounded-full" />
                                            <div className="h-2 w-36 bg-ivory-subtle rounded-full" />
                                        </div>
                                    </div>
                                ))
                            ) : filteredConversations.length > 0 ? (
                                filteredConversations.map((conv, i) => {
                                    const otherUser = getOtherUser(conv);
                                    const isOnline = onlineUsers.includes(otherUser?._id);
                                    const isSelected = selectedChat?._id === conv.booking._id;
                                    const hasUnread = conv.unreadCount > 0;

                                    return (
                                        <motion.div
                                            key={conv.booking._id}
                                            initial={{ opacity: 0, x: -15 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            onClick={() => handleSelectChat(conv)}
                                            className={`p-4 px-5 border-b border-royal-gold/5 cursor-pointer transition-all hover:bg-ivory-subtle flex items-center gap-3 group ${isSelected ? 'bg-ivory-subtle ring-1 ring-inset ring-royal-gold/15' : ''} ${hasUnread ? 'bg-royal-gold/3' : ''}`}
                                        >
                                            <div className="relative shrink-0">
                                                <div className="w-11 h-11 rounded-xl bg-navy-deep/5 border border-navy-deep/10 flex items-center justify-center font-black text-navy-deep uppercase text-base group-hover:border-royal-gold/20 transition-colors">
                                                    {(otherUser?.name || 'U').charAt(0)}
                                                </div>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[11px] font-black uppercase tracking-wider truncate group-hover:text-royal-gold transition-colors ${hasUnread ? 'text-navy-deep' : 'text-navy-deep/70'}`}>
                                                        {otherUser?.name}
                                                    </span>
                                                    {hasUnread && (
                                                        <span className="shrink-0 w-5 h-5 bg-royal-gold text-navy-deep text-[9px] font-black rounded-full flex items-center justify-center ml-1">
                                                            {conv.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[9px] text-navy-deep/40 font-bold truncate mt-0.5 flex items-center gap-1.5">
                                                    {user.role === 'admin' && (
                                                        <span className="text-royal-gold/60 uppercase">
                                                            {conv.booking.worker?.user?.name} ↔ {conv.booking.user?.name}
                                                        </span>
                                                    )}
                                                    {user.role !== 'admin' && (conv.lastMessage?.message || 'No messages yet')}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="p-12 text-center">
                                    <FaInbox className="text-4xl text-royal-gold/10 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-navy-deep/20">
                                        {user.role === 'user' ? 'Book a painter to start chatting' : user.role === 'worker' ? 'No client messages yet' : 'No conversations found'}
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 bg-slate-50/40 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                    {!selectedChat ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center p-12 max-w-sm">
                            <div className="w-24 h-24 bg-white rounded-[2.5rem] border border-royal-gold/10 flex items-center justify-center mx-auto mb-8 shadow-xl relative">
                                {user.role === 'worker' ? <FaUserTie className="text-royal-gold text-4xl" /> : <FaPaintBrush className="text-royal-gold text-4xl" />}
                                {totalUnread > 0 && (
                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute -top-2 -right-2 w-7 h-7 bg-navy-deep rounded-full flex items-center justify-center text-[11px] text-royal-gold font-black shadow-xl">
                                        {totalUnread}
                                    </motion.div>
                                )}
                            </div>
                            <h2 className="text-xl font-black text-navy-deep tracking-tight uppercase mb-3">
                                {user.role === 'admin' ? 'Monitor Platform Chats' : user.role === 'worker' ? 'Client Communications' : 'Chat with Painters'}
                            </h2>
                            <p className="text-xs font-bold text-navy-deep/30 uppercase tracking-widest leading-relaxed">
                                {user.role === 'user'
                                    ? 'Select a conversation to discuss your painting project'
                                    : user.role === 'worker'
                                        ? 'Select a client conversation to coordinate your work'
                                        : 'Select any conversation to view and monitor messages'}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Chat booking={selectedChat} onClose={() => setSelectedChat(null)} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessagesPage;
