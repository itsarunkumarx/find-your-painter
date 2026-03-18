import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import safeStorage from '../utils/safeStorage';
import { useSocket } from '../hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    FaPhone, FaVideo, FaTimes, FaTrash, FaReply, FaSmile,
    FaCheckDouble, FaCheck, FaPaperPlane, FaCircle, FaImage, FaSearch
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '😍', '✅', '💯', '🎨', '🖌️', '🏠', '⭐', '👏', '😮'];

const MessageBubble = memo(({ msg, idx, user, t, toggleReaction, setReplyTo, deleteMessage, inputRef }) => {
    const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
    return (
        <motion.div
            initial={{ opacity: 0, x: isOwn ? 10 : -10, y: 5 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: Math.min(idx * 0.05, 0.5), duration: 0.3 }}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
        >
            {!isOwn && (
                <div className="w-8 h-8 rounded-xl bg-navy-deep/5 border border-navy-deep/10 flex items-center justify-center overflow-hidden mr-2 self-end mb-1 shrink-0">
                    <img src={msg.sender?.profileImage || "/assets/premium-avatar.png"} className="w-full h-full object-cover" alt="" />
                </div>
            )}
            <div className={`relative max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {msg.replyTo && (
                    <div className={`text-[10px] px-3 py-1.5 rounded-xl border opacity-70 ${isOwn ? 'bg-white/60 border-royal-gold/20 text-right' : 'bg-white border-navy-deep/10'}`}>
                        <span className="font-black text-royal-gold">{msg.replyTo.sender?.name}</span>
                        <p className="text-navy-deep/60 truncate max-w-[200px]">{msg.replyTo.message}</p>
                    </div>
                )}
                <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl text-[13px] sm:text-sm font-medium leading-relaxed ${msg.isDeleted
                    ? 'bg-slate-100 text-slate-400 italic border border-slate-200'
                    : isOwn
                        ? 'bg-navy-deep text-white shadow-lg shadow-navy-deep/20 rounded-tr-sm'
                        : 'bg-white text-navy-deep border border-navy-deep/8 shadow-sm rounded-tl-sm'
                    } relative`}>
                    {msg.messageType === 'image' ? (
                        <div className="relative group/img">
                            <img
                                src={msg.message}
                                alt={t('shared_image_alt')}
                                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                                onClick={() => window.open(msg.message, '_blank')}
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors pointer-events-none rounded-lg" />
                        </div>
                    ) : (
                        msg.message
                    )}
                    {!msg.isDeleted && (
                        <div className={`absolute -top-3 ${isOwn ? 'right-0' : 'left-0'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                            <div className="flex bg-white shadow-xl rounded-lg border border-navy-deep/5 p-0.5">
                                {['❤️', '👍', '🔥'].map(emoji => (
                                    <button key={emoji} onClick={() => toggleReaction(msg._id, emoji)} className="px-1.5 py-1 hover:bg-slate-50 rounded-md transition-colors text-[10px]">
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                                className="p-1.5 bg-white shadow-xl rounded-lg text-navy-deep/50 hover:text-royal-gold transition-colors border border-navy-deep/5" title={t('reply_tooltip')}>
                                <FaReply size={10} />
                            </button>
                            {isOwn && (
                                <button onClick={() => deleteMessage(msg._id)}
                                    className="p-1.5 bg-white shadow-xl rounded-lg text-navy-deep/50 hover:text-red-500 transition-colors border border-navy-deep/5" title={t('delete_tooltip')}>
                                    <FaTrash size={10} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {msg.reactions?.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(msg.reactions.reduce((acc, r) => {
                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                            return acc;
                        }, {})).map(([emoji, count]) => (
                            <button key={emoji} onClick={() => toggleReaction(msg._id, emoji)}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black border transition-all ${msg.reactions.some(r => r.userId === user._id && r.emoji === emoji) ? 'bg-royal-gold/10 border-royal-gold text-royal-gold' : 'bg-white border-navy-deep/5 text-navy-deep/40'}`}>
                                {emoji} {count > 1 && count}
                            </button>
                        ))}
                    </div>
                )}

                <div className={`flex items-center gap-1.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[9px] font-bold text-navy-deep/30">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isOwn && !msg.isDeleted && (
                        msg.read
                            ? <FaCheckDouble size={10} className="text-royal-gold" />
                            : <FaCheck size={10} className="text-navy-deep/30" />
                    )}
                </div>
            </div>
        </motion.div>
    );
});

const Chat = ({ booking, onClose }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { socket, onlineUsers, startCall } = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [typingUser, setTypingUser] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const pendingMessagesRef = useRef(new Map()); // tempId -> content for reconciliation
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);
    const fileRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Determine contact info
    const contact = useMemo(() => {
        if (!user) return null;
        if (user.role === 'worker') {
            return typeof booking.user === 'object' ? booking.user : { name: t('client_fallback'), _id: booking.user };
        }
        if (user.role === 'admin') {
             // Admin can see both, default to painter but provide both buttons
             const workerUser = booking.worker?.user || booking.worker;
             return typeof workerUser === 'object' ? workerUser : { name: t('painter_fallback'), _id: workerUser };
        }
        // Client-side: contact is the painter (worker.user)
        const workerUser = booking.worker?.user || booking.worker;
        return typeof workerUser === 'object' ? workerUser : { name: t('painter_fallback'), _id: workerUser };
    }, [booking, user?.role, t]);


    const clientContact = useMemo(() => {
        if (user?.role !== 'admin') return null;
        return typeof booking.user === 'object' ? booking.user : { name: t('client_fallback'), _id: booking.user };
    }, [booking.user, user?.role, t]);

    const contactUserId = contact?.user?._id || contact?._id;
    const clientUserId = clientContact?.user?._id || clientContact?._id;

    const contactName = contact?.name || t('painter_fallback');
    // FIX: Use contactUserId (the user doc ID) for online check — contact._id is the worker profile ID
    const isContactOnline = useMemo(() => {
        if (!contactUserId) return false;
        return onlineUsers.some(uid => uid.toString() === contactUserId.toString());
    }, [onlineUsers, contactUserId]);

    useEffect(() => {
        setMessages([]); // Clear messages when switching bookings to fix mixing issue
    }, [booking._id]);

    useEffect(() => {
        if (!socket) return;
        socket.emit('join_chat', booking._id);

        socket.on('new_message', (message) => {
            const bookingId = message.booking?._id || message.booking;
            const isTargetRoom = bookingId?.toString() === booking._id?.toString();
            if (!isTargetRoom) return;

            const senderId = message.sender?._id?.toString() || message.sender?.toString();
            const isOwnMessage = senderId === user?._id?.toString();

            setMessages(prev => {
                if (isOwnMessage) {
                    // Find and replace any temp_ version of this message
                    const tempIdx = prev.findIndex(
                        m => m._id?.toString().startsWith('temp_') &&
                             m.message === message.message &&
                             m.messageType === message.messageType
                    );
                    if (tempIdx !== -1) {
                        const updated = [...prev];
                        updated[tempIdx] = message;
                        return updated;
                    }
                    // If no temp found, check for duplicate by real _id
                    if (prev.some(m => m._id?.toString() === message._id?.toString())) return prev;
                    return [...prev, message];
                } else {
                    // For incoming messages, prevent duplicates
                    if (prev.some(m => m._id?.toString() === message._id?.toString())) return prev;
                    return [...prev, message];
                }
            });

            // Scroll down for all new messages
            setTimeout(() => scrollToBottom(), 50);

            // Mark as read for incoming messages
            if (!isOwnMessage) {
                api.put(`/chat/${booking._id}/read`, {}).catch(() => {});
            }
        });
        socket.on('user_typing', ({ userId, userName }) => {
            if (userId !== user._id) setTypingUser(userName);
        });
        socket.on('user_stop_typing', ({ userId }) => {
            if (userId !== user._id) setTypingUser(null);
        });
        socket.on('message_deleted', ({ messageId }) => {
            setMessages(prev => prev.map(m =>
                m._id === messageId ? { ...m, isDeleted: true, message: t('message_deleted') } : m
            ));
        });
        socket.on('messages_read', () => {
            setMessages(prev => prev.map(m =>
                m.sender?._id === user._id ? { ...m, read: true } : m
            ));
        });
        socket.on('message_reaction', ({ messageId, emoji, userId }) => {
            setMessages(prev => prev.map(m => {
                if (m._id === messageId) {
                    const existing = m.reactions || [];
                    const foundIndex = existing.findIndex(r => r.userId === userId && r.emoji === emoji);
                    if (foundIndex > -1) {
                        const next = [...existing];
                        next.splice(foundIndex, 1);
                        return { ...m, reactions: next };
                    } else {
                        return { ...m, reactions: [...existing, { userId, emoji }] };
                    }
                }
                return m;
            }));
        });

        return () => {
            socket.emit('leave_chat', booking._id);
            socket.off('new_message');
            socket.off('user_typing');
            socket.off('user_stop_typing');
            socket.off('message_deleted');
            socket.off('messages_read');
            socket.off('message_reaction'); // Fix 5: was missing — causes handler to stack on re-render
        };
    }, [socket, booking._id, user?._id, scrollToBottom]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const { data } = await api.get(
                    `/chat/${booking._id}`
                );
                setMessages(data);
                setTimeout(scrollToBottom, 100);
            } catch (error) { 
                if (import.meta.env.DEV) console.error(error); 
            }
        };
        fetchMessages();
    }, [booking._id, scrollToBottom]);

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        if (!socket) return;
        socket.emit('typing', { bookingId: booking._id, userId: user?._id, userName: user?.name });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop_typing', { bookingId: booking._id, userId: user?._id });
        }, 1500);
    };

    const sendMessage = async (e, imageUrl = null) => {
        if (e) e.preventDefault();
        const trimmed = newMessage.trim();
        if (!trimmed && !imageUrl) return;
        
        if (imageUrl) setIsUploading(true);
        
        clearTimeout(typingTimeoutRef.current);
        socket?.emit('stop_typing', { bookingId: booking._id, userId: user._id });

        // Optimistic UI — use temp_ prefix so reconciler can find it
        const optimistic = {
            _id: `temp_${Date.now()}`,
            booking: booking._id,
            sender: { _id: user._id, name: user.name },
            message: imageUrl || trimmed,
            messageType: imageUrl ? 'image' : 'text',
            createdAt: new Date().toISOString(),
            read: false,
            reactions: []
        };
        setMessages(prev => [...prev, optimistic]);
        setNewMessage('');
        setReplyTo(null);
        scrollToBottom();

        try {
            const token = safeStorage.getItem('token');
            const body = {
                bookingId: booking._id,
                message: imageUrl || trimmed,
                messageType: imageUrl ? 'image' : 'text'
            };
            if (replyTo) body.replyTo = replyTo._id;
            await api.post('/chat', body);
        } catch (error) {
            console.error('Message send failed:', error);
        } finally {
            if (imageUrl) setIsUploading(false);
        }
    };

    const toggleReaction = async (messageId, emoji) => {
        if (!socket) return;
        
        // Optimistic UI for reactions
        setMessages(prev => prev.map(m => {
            if (m._id === messageId) {
                const existing = m.reactions || [];
                const userReaction = existing.find(r => r.userId === user._id && r.emoji === emoji);
                if (userReaction) {
                    return { ...m, reactions: existing.filter(r => !(r.userId === user._id && r.emoji === emoji)) };
                } else {
                    return { ...m, reactions: [...existing, { userId: user._id, emoji }] };
                }
            }
            return m;
        }));

        socket.emit('message_reaction', { bookingId: booking._id, messageId, emoji, userId: user._id });

        try {
            await api.post(`/chat/${messageId}/reaction`, 
                { emoji }
            );
        } catch (error) {
            console.error('Reaction update failed:', error);
        }
    };

    const deleteMessage = async (msgId) => {
        try {
            await api.delete(
                `/chat/${msgId}`
            );
        } catch (error) { 
            if (import.meta.env.DEV) console.error(error); 
        }
    };

    const compressImage = (base64Str, maxWidth = 800, maxHeight = 800) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); // 0.7 quality
            };
        });
    };

    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error(t('image_size_error'));
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            await sendMessage(null, base64String);
        };
        reader.readAsDataURL(file);
    };

    const addEmoji = (emoji) => {
        setNewMessage(prev => prev + emoji);
        setShowEmoji(false);
        inputRef.current?.focus();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:bg-black/30 sm:backdrop-blur-md sm:p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-card w-full sm:max-w-2xl h-full sm:h-[88vh] flex flex-col relative border-navy-deep/5 overflow-hidden shadow-royal bg-white sm:rounded-[2.5rem] rounded-none"
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-navy-deep/5 bg-gradient-to-r from-white to-ivory-subtle/50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-navy-deep/5 border border-navy-deep/10 flex items-center justify-center overflow-hidden">
                                <img src={contact?.profileImage || "/assets/premium-avatar.png"} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white ${isContactOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-royal-gold mb-1">
                                <span className="w-4 sm:w-6 h-[1px] bg-royal-gold/50" />
                                <span className="truncate">{user.role === 'worker' ? t('client_label') : t('painter_label')}</span>
                            </div>
                            <h3 className="text-sm sm:text-base font-black text-navy-deep leading-none truncate mb-1">{contactName}</h3>
                            <div className={`flex items-center gap-1 text-[8px] sm:text-[9px] font-bold ${isContactOnline ? 'text-green-500' : 'text-slate-400'}`}>
                                <FaCircle size={5} />
                                <span className="truncate">{isContactOnline ? t('online_now') : t('offline')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                        <button onClick={() => setShowSearch(!showSearch)}
                            className={`w-9 h-9 sm:w-10 sm:h-10 border border-navy-deep/5 rounded-xl transition-all flex items-center justify-center ${showSearch ? 'bg-royal-gold text-white' : 'bg-white text-navy-deep/40 hover:text-royal-gold'}`}
                            title={t('search_messages')}>
                            <FaSearch size={12} />
                        </button>
                        <div className="flex items-center gap-2">
                            {user.role === 'admin' ? (
                                <>
                                    {/* Call Client Button */}
                                    <button
                                        onClick={() => startCall({ ...clientContact, _id: clientUserId }, 'voice')}
                                        className="w-9 h-9 sm:w-10 sm:h-10 bg-white border border-navy-deep/5 rounded-xl text-navy-deep/40 hover:text-royal-gold transition-all flex items-center justify-center"
                                        title={`Call Client (${clientContact?.name})`}>
                                        <FaPhone size={11} className="mr-0.5" /><span className="text-[7px] font-black">C</span>
                                    </button>
                                    {/* Call Painter Button */}
                                    <button
                                        onClick={() => startCall({ ...contact, _id: contactUserId }, 'voice')}
                                        className="w-9 h-9 sm:w-10 sm:h-10 bg-white border border-navy-deep/5 rounded-xl text-navy-deep/40 hover:text-royal-gold transition-all flex items-center justify-center"
                                        title={`Call Painter (${contact?.name})`}>
                                        <FaPhone size={11} className="mr-0.5" /><span className="text-[7px] font-black">P</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            console.log('[CHAT_CALL] Initiating call to:', contactName, 'ID:', contactUserId);
                                            toast(`Calling Painter: ${contactName}`, { icon: '📞' });
                                            startCall({ ...contact, _id: contactUserId, name: contactName }, 'voice');
                                        }}
                                        className="w-9 h-9 sm:w-10 sm:h-10 bg-white border border-navy-deep/5 rounded-xl text-navy-deep/40 hover:text-royal-gold transition-all flex items-center justify-center"
                                        title={t('voice_call')}>
                                        <FaPhone size={12} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            console.log('[CHAT_CALL] Initiating video to:', contactName, 'ID:', contactUserId);
                                            toast(`Video calling: ${contactName}`, { icon: '🎥' });
                                            startCall({ ...contact, _id: contactUserId, name: contactName }, 'video');
                                        }}
                                        className="w-9 h-9 sm:w-10 sm:h-10 bg-white border border-navy-deep/5 rounded-xl text-navy-deep/40 hover:text-royal-gold transition-all flex items-center justify-center"
                                        title={t('video_link')}>
                                        <FaVideo size={12} />
                                    </button>
                                </>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 sm:p-2.5 bg-navy-deep/5 border border-navy-deep/10 rounded-xl text-navy-deep/40 hover:text-navy-deep transition-all">
                            <FaTimes size={14} />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <AnimatePresence>
                    {showSearch && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-ivory-subtle border-b border-navy-deep/5 px-4 py-3 relative overflow-hidden"
                        >
                            <div className="relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-deep/20 text-xs" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder={t('search_messages')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-navy-deep/10 rounded-xl py-2 pl-10 pr-10 text-xs font-bold text-navy-deep focus:outline-none focus:border-royal-gold/40 transition-all"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-deep/20 hover:text-navy-deep">
                                        <FaTimes size={10} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* Messages */}
                <div
                    onScroll={(e) => {
                        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
                    }}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-slate-50/50 scrollbar-hide scroll-smooth"
                >
                    {messages.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center p-12">
                            <div className="w-20 h-20 bg-royal-gold/5 rounded-3xl border border-royal-gold/10 flex items-center justify-center mb-5">
                                <span className="text-4xl">🎨</span>
                            </div>
                            <h4 className="text-lg font-black text-navy-deep tracking-tighter uppercase mb-2">{t('start_conversation')}</h4>
                            <p className="text-xs font-bold text-navy-deep/40 tracking-widest uppercase max-w-xs">{t('discuss_details')}</p>
                        </motion.div>
                    )}

                    {/* Group messages by date */}
                    {Object.entries(messages.filter(m => (m.messageType === 'text' && (m.message || '').toLowerCase().includes(searchTerm.toLowerCase())) || !searchTerm).reduce((groups, msg) => {
                        const date = new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                        if (!groups[date]) groups[date] = [];
                        groups[date].push(msg);
                        return groups;
                    }, {})).map(([date, groupMessages]) => (
                        <div key={date} className="space-y-6">
                            <div className="flex justify-center my-8">
                                <span className="px-5 py-1.5 bg-white border border-navy-deep/5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-navy-deep/30 shadow-sm">
                                    {date === new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) ? t('today') : date}
                                </span>
                            </div>

                            {groupMessages.map((msg, idx) => (
                                <MessageBubble
                                    key={msg._id || idx}
                                    msg={msg}
                                    idx={idx}
                                    user={user}
                                    t={t}
                                    toggleReaction={toggleReaction}
                                    setReplyTo={setReplyTo}
                                    deleteMessage={deleteMessage}
                                    inputRef={inputRef}
                                />
                            ))}
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    <AnimatePresence>
                        {typingUser && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-navy-deep/5 flex items-center justify-center overflow-hidden shrink-0">
                                    <img src={typingUser?.profileImage || "/assets/premium-avatar.png"} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="bg-white border border-navy-deep/8 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 bg-royal-gold rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                                    </div>
                                    <span className="text-[10px] text-navy-deep/40 font-bold">{t('user_typing_indicator', { name: typingUser })}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* Uploading Indicator */}
                    <AnimatePresence>
                        {isUploading && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex justify-end p-2 px-6">
                                <div className="flex items-center gap-3 bg-navy-deep/5 px-4 py-2 rounded-2xl border border-navy-deep/5">
                                    <div className="w-4 h-4 border-2 border-royal-gold border-t-transparent rounded-full animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-navy-deep/40">{t('broadcasting_media')}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                </div>

                {/* Floating Scroll to Bottom Button */}
                <AnimatePresence>
                    {showScrollBtn && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            onClick={scrollToBottom}
                            className="absolute bottom-24 right-8 w-11 h-11 bg-white border border-navy-deep/10 rounded-full shadow-2xl flex items-center justify-center text-navy-deep/60 hover:text-royal-gold hover:bg-navy-deep hover:text-white transition-all z-20"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-navy-deep/5">
                    {/* Reply bar */}
                    <AnimatePresence>
                        {replyTo && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="flex items-center justify-between bg-royal-gold/5 border border-royal-gold/20 rounded-xl px-4 py-2 mb-3">
                                <div className="text-[10px]">
                                    <span className="font-black text-royal-gold uppercase">{t('replying_to')} {replyTo.sender?.name}</span>
                                    <p className="text-navy-deep/50 truncate max-w-xs mt-0.5">{replyTo.message}</p>
                                </div>
                                <button onClick={() => setReplyTo(null)} className="text-navy-deep/30 hover:text-navy-deep transition-colors ml-3"><FaTimes size={12} /></button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={sendMessage} className="relative flex items-center gap-3">
                        <div className="relative">
                            <button type="button" onClick={() => setShowEmoji(!showEmoji)}
                                className="w-10 h-10 bg-ivory-subtle border border-navy-deep/5 rounded-xl text-navy-deep/40 hover:text-royal-gold transition-colors flex items-center justify-center">
                                <FaSmile size={16} />
                            </button>
                            <AnimatePresence>
                                {showEmoji && (
                                    <motion.div initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                        className="absolute bottom-14 left-0 bg-white rounded-3xl border border-navy-deep/10 shadow-royal p-4 grid grid-cols-5 gap-3 z-10 w-max min-w-[240px]">
                                        {EMOJIS.map((e, idx) => (
                                            <button key={e || idx} type="button" onClick={() => addEmoji(e)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-royal-gold/10 transition-all duration-300 text-xl hover:scale-110 active:scale-90">
                                                {e}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative">
                            <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                            <button type="button" onClick={() => fileRef.current?.click()}
                                className="w-10 h-10 bg-ivory-subtle border border-navy-deep/5 rounded-xl text-navy-deep/40 hover:text-royal-gold transition-colors flex items-center justify-center">
                                <FaImage size={16} />
                            </button>
                        </div>

                        <div className="flex-1 relative group">
                            <div className="absolute -inset-0.5 bg-royal-gold rounded-2xl blur opacity-0 group-focus-within:opacity-15 transition duration-500" />
                            <input
                                ref={inputRef}
                                value={newMessage}
                                onChange={handleInputChange}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
                                placeholder={t('type_message')}
                                className="relative w-full bg-ivory-subtle/60 border border-navy-deep/10 rounded-2xl py-3 px-5 text-sm font-medium text-navy-deep focus:outline-none focus:border-royal-gold/40 focus:bg-white transition-all placeholder-navy-deep/20"
                            />
                        </div>

                        <button type="submit" disabled={!newMessage.trim()}
                            className="w-11 h-11 bg-navy-deep text-royal-gold rounded-2xl hover:bg-royal-gold hover:text-navy-deep transition-all duration-300 disabled:opacity-30 flex items-center justify-center shadow-lg shadow-navy-deep/20 group shrink-0">
                            <FaPaperPlane size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Chat;
