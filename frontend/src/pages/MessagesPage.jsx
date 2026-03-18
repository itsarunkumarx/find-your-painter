import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useTranslation } from 'react-i18next';
import { FaInbox, FaComments, FaSearch, FaCircle, FaPaintBrush, FaUserTie, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import Chat from '../components/Chat';

const MessagesPage = () => {
    const { t } = useTranslation();
    if (!t) return null;
    const { user } = useAuth();
    const { socket, onlineUsers } = useSocket();
    const location = useLocation();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typingStatus, setTypingStatus] = useState({}); // { bookingId: userName }

    const fetchConversations = async () => {
        try {
            const { data } = await api.get('/chat/conversations');
            setConversations(data);

            // Handle initial deep-linking from Explore page
            const initialId = location.state?.initialBookingId;
            if (initialId && !selectedChat) {
                const target = data.find(c => c.booking._id === initialId);
                if (target) setSelectedChat(target.booking);
            }
        } catch (error) {
            if (import.meta.env.DEV) console.error('Fetch conversations failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
        if (!socket) return;

        const handleNewMessage = () => fetchConversations();
        const handleTyping = ({ bookingId, userId, userName }) => {
            if (userId !== user._id) {
                setTypingStatus(prev => ({ ...prev, [bookingId]: userName }));
            }
        };
        const handleStopTyping = ({ bookingId, userId }) => {
            if (userId !== user._id) {
                setTypingStatus(prev => {
                    const next = { ...prev };
                    delete next[bookingId];
                    return next;
                });
            }
        };
        const handleMessagesRead = ({ bookingId, userId }) => {
            if (userId === user._id) {
                // If I am the one who read them (maybe in another tab), sync my local UI
                setConversations(prev => prev.map(c =>
                    c.booking._id === bookingId ? { ...c, unreadCount: 0 } : c
                ));
            } else {
                // If the other person read my messages, show the blue checkmark
                setConversations(prev => prev.map(c =>
                    c.booking._id === bookingId
                        ? { ...c, lastMessage: c.lastMessage ? { ...c.lastMessage, read: true } : c.lastMessage }
                        : c
                ));
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('user_typing', handleTyping);
        socket.on('user_stop_typing', handleStopTyping);
        socket.on('messages_read', handleMessagesRead);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('user_typing', handleTyping);
            socket.off('user_stop_typing', handleStopTyping);
            socket.off('messages_read', handleMessagesRead);
        };
    }, [socket, user._id]);

    const getOtherUser = (conv) => {
        // Use the deduplicated otherUser field from the backend
        return conv.otherUser || (user.role === 'user' ? conv.booking.worker?.user : conv.booking.user);
    };

    const filteredConversations = conversations.filter(conv => {
        const other = getOtherUser(conv);
        return other?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const totalUnread = filteredConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    const handleSelectChat = (conv) => {
        setSelectedChat(conv.booking);
        // Optimistically clear unread for this booking
        setConversations(prev => prev.map(c =>
            c.booking._id === conv.booking._id ? { ...c, unreadCount: 0 } : c
        ));
    };

    return (
        <div className="h-[calc(100vh-80px)] sm:h-[calc(100vh-100px)] flex flex-col space-y-4">
            {/* Header */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${selectedChat ? 'hidden sm:flex' : ''}`}>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-navy-deep tracking-tight">
                        Messages <span className="text-royal-gold">Hub</span>
                        {totalUnread > 0 && (
                            <span className="ml-3 px-3 py-1 bg-royal-gold text-navy-deep text-[10px] sm:text-xs font-black rounded-full animate-pulse">
                                {totalUnread} new
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-400 text-[10px] font-medium mt-1 uppercase tracking-widest">
                        {user.role === 'admin' ? 'All Platform Conversations' : user.role === 'worker' ? 'Client Communications' : 'Chat with your Painters'}
                    </p>
                </div>
                <div className="relative w-full sm:w-64">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-deep/20 text-xs" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-royal-gold/10 rounded-2xl py-2.5 sm:py-3 pl-11 pr-4 text-[11px] sm:text-xs font-bold text-navy-deep placeholder-navy-deep/20 focus:outline-none focus:border-royal-gold transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl sm:rounded-[2.5rem] border border-royal-gold/10 shadow-2xl shadow-royal-gold/5 overflow-hidden flex min-h-0 relative">
                {/* Conversations Sidebar */}
                <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-royal-gold/5 flex-col shrink-0`}>
                    <div className="px-5 sm:px-6 py-4 border-b border-royal-gold/5 bg-ivory-subtle/30 flex items-center justify-between">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-navy-deep/40">
                            Intel Stream ({filteredConversations.length})
                        </span>
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
                                    const isOnline = onlineUsers.some(uid => uid.toString() === otherUser?._id?.toString());
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
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white transition-colors duration-500 ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[11px] font-black uppercase tracking-wider truncate group-hover:text-royal-gold transition-colors ${hasUnread ? 'text-navy-deep' : 'text-navy-deep/70'}`}>
                                                        {otherUser?.name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {conv.lastMessage && conv.lastMessage.sender?._id === user._id && (
                                                            conv.lastMessage.read ? <FaCheckDouble size={10} className="text-royal-gold" /> : <FaCheck size={10} className="text-navy-deep/20" />
                                                        )}
                                                        {hasUnread && (
                                                            <span className="shrink-0 w-5 h-5 bg-royal-gold text-navy-deep text-[9px] font-black rounded-full flex items-center justify-center">
                                                                {conv.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-[9px] font-bold truncate mt-0.5">
                                                    {typingStatus[conv.booking._id] ? (
                                                        <span className="text-royal-gold animate-pulse flex items-center gap-1 uppercase tracking-widest">
                                                            <span className="w-1 h-1 bg-royal-gold rounded-full animate-bounce" />
                                                            Typing...
                                                        </span>
                                                    ) : (
                                                        <span className="text-navy-deep/40 flex items-center gap-1.5">
                                                            {user.role === 'admin' && (
                                                                <span className="text-royal-gold/60 uppercase shrink-0">
                                                                    {conv.booking.worker?.user?.name?.split(' ')[0]} ↔ {conv.booking.user?.name?.split(' ')[0]}
                                                                </span>
                                                            )}
                                                            {user.role !== 'admin' && (conv.lastMessage?.message || 'New communication link established')}
                                                        </span>
                                                    )}
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
                <div className={`${!selectedChat ? 'hidden md:flex' : 'flex'} flex-1 bg-slate-50/40 flex-col items-center justify-center relative overflow-hidden`}>
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
