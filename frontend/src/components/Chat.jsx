import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    FaPhone, FaVideo, FaTimes, FaTrash, FaReply, FaSmile,
    FaCheckDouble, FaCheck, FaPaperPlane, FaCircle, FaImage
} from 'react-icons/fa';

const EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '😍', '✅', '💯', '🎨', '🖌️', '🏠', '⭐', '👏', '😮'];

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
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);
    const fileRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Determine contact info
    const contact = user.role === 'worker'
        ? booking.user
        : (booking.worker?.user || booking.worker);
    const contactName = contact?.name || 'Painter';
    const isContactOnline = onlineUsers.includes(contact?._id);

    useEffect(() => {
        if (!socket) return;
        socket.emit('join_chat', booking._id);

        socket.on('new_message', (message) => {
            if (message.booking === booking._id || message.booking?._id === booking._id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
                axios.put(
                    `${import.meta.env.VITE_API_URL}/api/chat/${booking._id}/read`,
                    {},
                    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
                ).catch(() => { });
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
                m._id === messageId ? { ...m, isDeleted: true, message: 'This message was deleted' } : m
            ));
        });
        socket.on('messages_read', () => {
            setMessages(prev => prev.map(m =>
                m.sender?._id === user._id ? { ...m, read: true } : m
            ));
        });

        return () => {
            socket.emit('leave_chat', booking._id);
            socket.off('new_message');
            socket.off('user_typing');
            socket.off('user_stop_typing');
            socket.off('message_deleted');
            socket.off('messages_read');
        };
    }, [socket, booking._id, user._id, scrollToBottom]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/chat/${booking._id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setMessages(data);
                setTimeout(scrollToBottom, 100);
            } catch (error) { console.error(error); }
        };
        fetchMessages();
    }, [booking._id, scrollToBottom]);

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        if (!socket) return;
        socket.emit('typing', { bookingId: booking._id, userId: user._id, userName: user.name });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop_typing', { bookingId: booking._id, userId: user._id });
        }, 1500);
    };

    const sendMessage = async (e, imageUrl = null) => {
        if (e) e.preventDefault();
        const trimmed = newMessage.trim();
        if (!trimmed && !imageUrl) return;
        clearTimeout(typingTimeoutRef.current);
        socket?.emit('stop_typing', { bookingId: booking._id, userId: user._id });

        // Optimistic UI — show message immediately
        const optimistic = {
            _id: Date.now().toString(),
            booking: booking._id,
            sender: { _id: user._id, name: user.name },
            message: imageUrl || trimmed,
            messageType: imageUrl ? 'image' : 'text',
            createdAt: new Date().toISOString(),
            read: false
        };
        setMessages(prev => [...prev, optimistic]);
        setNewMessage('');
        setReplyTo(null);
        scrollToBottom();

        try {
            const token = localStorage.getItem('token');
            const body = {
                bookingId: booking._id,
                message: imageUrl || trimmed,
                messageType: imageUrl ? 'image' : 'text'
            };
            if (replyTo) body.replyTo = replyTo._id;
            await axios.post(`${import.meta.env.VITE_API_URL}/api/chat`, body,
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error('Message send failed:', error);
        }
    };

    const deleteMessage = async (msgId) => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/chat/${msgId}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
        } catch (error) { console.error(error); }
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
            alert('Image size should be less than 10MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            const compressed = await compressImage(base64String);
            await sendMessage(null, compressed);
        };
        reader.readAsDataURL(file);
    };

    const addEmoji = (emoji) => {
        setNewMessage(prev => prev + emoji);
        setShowEmoji(false);
        inputRef.current?.focus();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-card w-full max-w-2xl h-[88vh] flex flex-col relative border-navy-deep/5 overflow-hidden shadow-royal bg-white rounded-[2.5rem]"
            >
                {/* Header */}
                <div className="p-5 border-b border-navy-deep/5 bg-gradient-to-r from-white to-ivory-subtle/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-navy-deep/5 border border-navy-deep/10 flex items-center justify-center text-royal-gold font-black text-lg overflow-hidden">
                                {contactName.charAt(0).toUpperCase()}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${isContactOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-royal-gold mb-0.5">
                                <span className="w-6 h-[1px] bg-royal-gold/50" />
                                {user.role === 'worker' ? 'Client' : 'Painter'}
                            </div>
                            <h3 className="text-base font-black text-navy-deep leading-none">{contactName}</h3>
                            <div className={`flex items-center gap-1.5 mt-0.5 text-[9px] font-bold ${isContactOnline ? 'text-green-500' : 'text-slate-400'}`}>
                                <FaCircle size={6} />
                                {isContactOnline ? 'Online now' : 'Offline'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2">
                            <button onClick={() => startCall(contact, 'voice')}
                                className="w-10 h-10 bg-white border border-navy-deep/5 rounded-xl text-navy-deep/40 hover:text-royal-gold hover:border-royal-gold/20 hover:shadow-lg transition-all flex items-center justify-center"
                                title="Voice Call">
                                <FaPhone size={14} />
                            </button>
                            <button onClick={() => startCall(contact, 'video')}
                                className="w-10 h-10 bg-white border border-navy-deep/5 rounded-xl text-navy-deep/40 hover:text-royal-gold hover:border-royal-gold/20 hover:shadow-lg transition-all flex items-center justify-center"
                                title="Video Call">
                                <FaVideo size={14} />
                            </button>
                        </div>
                        <div className="hidden md:block text-right">
                            <div className="text-[8px] font-black uppercase tracking-[0.3em] text-navy-deep/40">Encrypted</div>
                            <div className="text-[9px] font-bold text-green-500 uppercase">AES-256</div>
                        </div>
                        <button onClick={onClose} className="p-2.5 bg-navy-deep/5 border border-navy-deep/10 rounded-xl text-navy-deep/40 hover:text-navy-deep hover:bg-navy-deep/10 transition-all">
                            <FaTimes size={16} />
                        </button>
                    </div>
                </div>


                {/* Messages */}
                <div
                    onScroll={(e) => {
                        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 300);
                    }}
                    className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scrollbar-hide scroll-smooth"
                >
                    {messages.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center p-12">
                            <div className="w-20 h-20 bg-royal-gold/5 rounded-3xl border border-royal-gold/10 flex items-center justify-center mb-5">
                                <span className="text-4xl">🎨</span>
                            </div>
                            <h4 className="text-lg font-black text-navy-deep tracking-tighter uppercase mb-2">Start the Conversation</h4>
                            <p className="text-xs font-bold text-navy-deep/40 tracking-widest uppercase max-w-xs">Discuss your painting project details here.</p>
                        </motion.div>
                    )}

                    {/* Group messages by date */}
                    {Object.entries(messages.reduce((groups, msg) => {
                        const date = new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                        if (!groups[date]) groups[date] = [];
                        groups[date].push(msg);
                        return groups;
                    }, {})).map(([date, groupMessages]) => (
                        <div key={date} className="space-y-6">
                            <div className="flex justify-center my-8">
                                <span className="px-5 py-1.5 bg-white border border-navy-deep/5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-navy-deep/30 shadow-sm">
                                    {date === new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) ? 'Today' : date}
                                </span>
                            </div>

                            {groupMessages.map((msg, idx) => {
                                const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, x: isOwn ? 20 : -20, scale: 0.95 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        key={msg._id || idx}
                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                                    >
                                        {!isOwn && (
                                            <div className="w-8 h-8 rounded-xl bg-navy-deep/5 border border-navy-deep/10 flex items-center justify-center text-royal-gold font-black text-xs mr-2 self-end mb-1 shrink-0">
                                                {(msg.sender?.name || contactName).charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className={`relative max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                            {/* Reply preview */}
                                            {msg.replyTo && (
                                                <div className={`text-[10px] px-3 py-1.5 rounded-xl border opacity-70 ${isOwn ? 'bg-white/60 border-royal-gold/20 text-right' : 'bg-white border-navy-deep/10'}`}>
                                                    <span className="font-black text-royal-gold">{msg.replyTo.sender?.name}</span>
                                                    <p className="text-navy-deep/60 truncate max-w-[200px]">{msg.replyTo.message}</p>
                                                </div>
                                            )}
                                            <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${msg.isDeleted
                                                ? 'bg-slate-100 text-slate-400 italic border border-slate-200'
                                                : isOwn
                                                    ? 'bg-navy-deep text-white shadow-lg shadow-navy-deep/20 rounded-tr-sm'
                                                    : 'bg-white text-navy-deep border border-navy-deep/8 shadow-sm rounded-tl-sm'
                                                } relative`}>
                                                {msg.messageType === 'image' ? (
                                                    <div className="relative group/img">
                                                        <img
                                                            src={msg.message}
                                                            alt="Shared"
                                                            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                                                            onClick={() => window.open(msg.message, '_blank')}
                                                            loading="lazy"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors pointer-events-none rounded-lg" />
                                                    </div>
                                                ) : (
                                                    msg.message
                                                )}
                                                {/* Action buttons on hover */}
                                                {!msg.isDeleted && (
                                                    <div className={`absolute -top-3 ${isOwn ? 'right-0' : 'left-0'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
                                                        <button onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                                                            className="p-1.5 bg-white shadow-xl rounded-lg text-navy-deep/50 hover:text-royal-gold transition-colors border border-navy-deep/5" title="Reply">
                                                            <FaReply size={10} />
                                                        </button>
                                                        {isOwn && (
                                                            <button onClick={() => deleteMessage(msg._id)}
                                                                className="p-1.5 bg-white shadow-xl rounded-lg text-navy-deep/50 hover:text-red-500 transition-colors border border-navy-deep/5" title="Delete">
                                                                <FaTrash size={10} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
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
                            })}
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    <AnimatePresence>
                        {typingUser && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-navy-deep/5 flex items-center justify-center text-royal-gold font-black text-xs shrink-0">
                                    {typingUser.charAt(0).toUpperCase()}
                                </div>
                                <div className="bg-white border border-navy-deep/8 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 bg-royal-gold rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                                    </div>
                                    <span className="text-[10px] text-navy-deep/40 font-bold">{typingUser} is typing…</span>
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
                                    <span className="font-black text-royal-gold uppercase">Replying to {replyTo.sender?.name}</span>
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
                                        className="absolute bottom-12 left-0 bg-white rounded-2xl border border-navy-deep/10 shadow-xl p-3 grid grid-cols-5 gap-1.5 z-10">
                                        {EMOJIS.map(e => (
                                            <button key={e} type="button" onClick={() => addEmoji(e)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-royal-gold/10 transition-colors text-lg">
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
                                placeholder="Type a message…"
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
