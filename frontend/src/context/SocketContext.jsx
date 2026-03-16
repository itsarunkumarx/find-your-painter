import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import CallOverlay from '../components/CallOverlay';
import IncomingCallModal from '../components/IncomingCallModal';
import { AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        console.warn('useSocket: SocketContext not available. Make sure component is wrapped in SocketProvider.');
        return {};
    }
    return context;
};

// ── Ringtone suites ──────────────────────────────────────────────────────────
export const RINGTONE_SUITES = {
    standard: {
        incoming: '/sounds/ring-classic.mp3',
        outgoing: '/sounds/ring-outgoing.mp3',
        label: 'Classic Phone'
    },
    melodic: {
        incoming: '/sounds/ring-melodic.mp3',
        outgoing: '/sounds/ring-outgoing.mp3',
        label: 'Soft Harmony'
    },
    urgent: {
        incoming: '/sounds/ring-urgent.mp3',
        outgoing: '/sounds/ring-outgoing.mp3',
        label: 'High Priority'
    },
    minimal: {
        incoming: '/sounds/ring-minimal.mp3',
        outgoing: '/sounds/ring-outgoing.mp3',
        label: 'Digital Pulse'
    }
};

// ── Ringtone helpers ────────────────────────────────────────────────────────
const createRingtone = (url, isIncoming = true) => {
    if (!url) return null;
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = isIncoming ? 1.0 : 0.5;
    audio.preload = 'auto';
    
    let isActive = true;

    const forcePlay = async () => {
        if (!isActive) return;
        try {
            await audio.play();
        } catch (err) {
            console.warn("Playback blocked, waiting for interaction...");
        }
    };

    const handleEnded = () => {
        if (isActive) {
            audio.currentTime = 0;
            forcePlay();
        }
    };
    audio.addEventListener('ended', handleEnded);

    forcePlay();

    return {
        stop: () => {
            isActive = false;
            audio.pause();
            audio.removeEventListener('ended', handleEnded);
            audio.src = '';
            audio.load(); 
        }
    };
};

const useTabFlashing = (message, condition) => {
    useEffect(() => {
        let interval;
        const orgTitle = document.title;
        if (condition) {
            interval = setInterval(() => {
                document.title = document.title === orgTitle ? message : orgTitle;
            }, 1000);
        } else {
            document.title = orgTitle;
        }
        return () => {
            clearInterval(interval);
            document.title = orgTitle;
        };
    }, [message, condition]);
};

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const peerRef = useRef(null);
    const stopRingtoneRef = useRef(null);
    const activeCallRef = useRef(null);
    const incomingCallRef = useRef(null);
    const userRef = useRef(user);
    const settingsRef = useRef(null);
    const iceCandidatesQueue = useRef([]);
    const callTimerRef = useRef(null);

    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [isPushSupported, setIsPushSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [callStatus, setCallStatus] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isAudioBlocked, setIsAudioBlocked] = useState(false);
    const [audioSettings, setAudioSettings] = useState(() => {
        const saved = localStorage.getItem('audio_protocols');
        return saved ? JSON.parse(saved) : { incoming: 'standard', outgoing: 'standard' };
    });

    useTabFlashing('📞 Incoming Call...', !!incomingCall);

    useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { settingsRef.current = audioSettings; }, [audioSettings]);

    const stopRingtone = useCallback(() => {
        if (stopRingtoneRef.current) {
            stopRingtoneRef.current.stop();
            stopRingtoneRef.current = null;
        }
    }, []);

    const previewRingtone = useCallback((suiteId, type = 'incoming') => {
        stopRingtone();
        let url;
        if (suiteId === 'custom') {
            url = type === 'incoming' ? user?.customRingtone : user?.customOutgoingTone;
        } else {
            url = RINGTONE_SUITES[suiteId]?.[type];
        }

        if (url) {
            const rt = createRingtone(url, type === 'incoming');
            stopRingtoneRef.current = rt;
            setTimeout(() => {
                if (stopRingtoneRef.current === rt) stopRingtone();
            }, 30000);
        }
    }, [stopRingtone, user]);

    const updateAudioSettings = useCallback((newSettings) => {
        setAudioSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('audio_protocols', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const hangUp = useCallback(() => {
        stopRingtone();
        const currentCall = activeCallRef.current;
        if (currentCall?.toUserId && socketRef.current) {
            socketRef.current.emit('call_end', { toUserId: currentCall.toUserId });
        }
        if (currentCall?.stream) {
            currentCall.stream.getTracks().forEach(t => t.stop());
        }
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
        setActiveCall(null);
        setCallStatus(null);
    }, [stopRingtone]);

    const resolveUserId = useCallback((contact) => {
        if (!contact) return null;
        if (typeof contact === 'string') return contact;
        const id = contact.user?._id || contact.user?.id || contact.user || contact._id || contact.id;
        return typeof id === 'object' ? (id?._id || id?.id || id) : id;
    }, []);

    const createPeer = useCallback((toUserId) => {
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        });

        peer.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice_candidate', { toUserId, candidate: event.candidate });
            }
        };

        peer.ontrack = (event) => {
            console.log('[WebRTC] Remote track received:', event.track.kind);
            setActiveCall(prev => {
                if (!prev) return null;
                const currentStream = prev.remoteStream || new MediaStream();
                const tracks = currentStream.getTracks();
                if (!tracks.find(t => t.id === event.track.id)) {
                    currentStream.addTrack(event.track);
                }
                return { ...prev, remoteStream: new MediaStream(currentStream.getTracks()) };
            });
        };

        peer.onconnectionstatechange = () => {
            if (['disconnected', 'failed', 'closed'].includes(peer.connectionState)) {
                hangUp();
            }
        };

        peerRef.current = peer;
        iceCandidatesQueue.current = [];
        return peer;
    }, [hangUp]);

    const startCall = useCallback(async (contact, callType = 'voice') => {
        if (!socketRef.current || !user) return;
        
        const toUserId = resolveUserId(contact);
        console.log('[SocketContext] startCall resolved ID:', toUserId, 'for contact:', contact);

        if (!toUserId) {
            toast.error('Could not resolve recipient identity');
            return;
        }

        setCallStatus('connecting');
        toast.loading(`Establishing ${callType} connection...`, { id: 'call_path', duration: 3000 });

        stopRingtone();
        try {
            let toneUrl;
            const currentSettings = settingsRef.current || { outgoing: 'standard' };
            if (currentSettings.outgoing === 'custom') {
                toneUrl = userRef.current?.customOutgoingTone;
            } else {
                toneUrl = RINGTONE_SUITES[currentSettings.outgoing]?.outgoing;
            }
            if (toneUrl) stopRingtoneRef.current = createRingtone(toneUrl, false);
        } catch (e) {
            console.warn('Outgoing tone trigger failed', e);
        }

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callType === 'video'
            });
            setActiveCall({ contact, type: callType, stream, remoteStream: null, isCaller: true, toUserId, isRinging: false });
        } catch (err) {
            stopRingtone();
            setCallStatus(null);
            setActiveCall(null);
            toast.error('Microphone/Camera access denied');
            return;
        }

        const peer = createPeer(toUserId);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socketRef.current.emit('call_offer', {
            toUserId,
            fromUserId: user._id,
            fromUserName: user.name,
            fromUserImage: user.profileImage,
            callType,
            offer
        });

        if (callTimerRef.current) clearTimeout(callTimerRef.current);
        callTimerRef.current = setTimeout(() => {
            if (activeCallRef.current && !activeCallRef.current.remoteStream) {
                setCallStatus('no_answer');
                setTimeout(() => hangUp(), 5000);
            }
        }, 120000); 
    }, [user, createPeer, stopRingtone, hangUp, resolveUserId]);

    const processQueuedCandidates = useCallback(async () => {
        if (peerRef.current && peerRef.current.remoteDescription) {
            while (iceCandidatesQueue.current.length > 0) {
                const candidate = iceCandidatesQueue.current.shift();
                try {
                    await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.warn('Error adding queued ice candidate', e);
                }
            }
        }
    }, []);

    const acceptCall = useCallback(async () => {
        if (!incomingCall || !socketRef.current) return;
        stopRingtone();

        const { fromUserId, fromUserName, fromUserImage, callType, offer, callId } = incomingCall;

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callType === 'video'
            });
        } catch {
            toast.error('Microphone/Camera access denied.');
            return;
        }

        const peer = createPeer(fromUserId);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        await processQueuedCandidates();

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socketRef.current.emit('call_answer', { toUserId: fromUserId, answer, callId });

        setIncomingCall(null);
        incomingCallRef.current = null;
        setCallStatus('connected');
        setActiveCall({
            contact: { _id: fromUserId, name: fromUserName, profileImage: fromUserImage },
            type: callType,
            stream,
            remoteStream: null,
            isCaller: false,
            toUserId: fromUserId
        });
    }, [incomingCall, createPeer, stopRingtone, processQueuedCandidates]);

    const rejectCall = useCallback(() => {
        if (!incomingCall || !socketRef.current) return;
        stopRingtone();
        socketRef.current.emit('call_reject', { toUserId: incomingCall.fromUserId, reason: 'Call declined' });
        setIncomingCall(null);
    }, [incomingCall, stopRingtone]);

    const toggleMute = useCallback(() => {
        if (activeCall?.stream) {
            const audioTrack = activeCall.stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, [activeCall]);

    const toggleVideo = useCallback(() => {
        if (activeCall?.stream) {
            const videoTrack = activeCall.stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    }, [activeCall]);

    useEffect(() => {
        if (!user) return;

        const rawUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
        if (!rawUrl) return;
        const socketUrl = rawUrl.endsWith('/api') ? rawUrl.slice(0, -4) : rawUrl;

        const socket = io(socketUrl, {
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000,
        });
        socketRef.current = socket;
        setSocket(socket);

        socket.on('connect', () => {
            console.log('[SOCKET] Connected! socket.id:', socket.id);
            socket.emit('user_online', user._id);
        });

        socket.on('reconnect', (attempt) => {
            console.log('[SOCKET] Reconnected after', attempt, 'attempts.');
            socket.emit('user_online', user._id);
        });

        socket.on('online_users', setOnlineUsers);

        socket.on('incoming_call', (data) => {
            console.log('[Socket] Signal Received: INCOMING_CALL', data);
            
            toast('📞 Incoming Secure Line...', {
                icon: '🔔',
                duration: 6000,
                position: 'top-center',
                style: { background: 'var(--bg-highlight)', color: 'var(--text-main)', border: '1px solid var(--royal-gold)' }
            });

            if (activeCallRef.current || incomingCallRef.current?.callId === data.callId) {
                if (activeCallRef.current) socket.emit('call_reject', { toUserId: data.fromUserId, reason: 'busy' });
                return;
            }

            incomingCallRef.current = data;
            setIncomingCall(data);
            socket.emit('call_received', { toUserId: data.fromUserId });

            if (stopRingtoneRef.current) return;

            try {
                let toneUrl;
                const currentSettings = settingsRef.current;
                const currentUser = userRef.current;

                if (currentSettings?.incoming === 'custom' && currentUser?.customRingtone) {
                    toneUrl = currentUser.customRingtone;
                } else {
                    toneUrl = RINGTONE_SUITES[currentSettings?.incoming]?.incoming;
                }

                if (toneUrl) {
                    stopRingtoneRef.current = createRingtone(toneUrl, true);
                }
            } catch (e) {
                console.warn('Failed to play ringtone:', e);
            }
        });

        socket.on('ice_candidate', async ({ candidate }) => {
            if (peerRef.current) {
                if (peerRef.current.remoteDescription) {
                    try {
                        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.warn('Error adding received ice candidate', e);
                    }
                } else {
                    iceCandidatesQueue.current.push(candidate);
                }
            }
        });

        socket.on('call_answered', async ({ answer }) => {
            stopRingtone();
            if (callTimerRef.current) {
                clearTimeout(callTimerRef.current);
                callTimerRef.current = null;
            }
            setCallStatus('connected');
            setActiveCall(prev => prev ? { ...prev, isRinging: false } : prev);
            if (peerRef.current) {
                try {
                    await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    if (peerRef.current && peerRef.current.remoteDescription) {
                        while (iceCandidatesQueue.current.length > 0) {
                            const candidate = iceCandidatesQueue.current.shift();
                            try { await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
                            catch (e) { console.warn('Error adding queued ice candidate', e); }
                        }
                    }
                } catch (e) {
                    console.warn('Error setting remote description', e);
                }
            }
        });

        socket.on('call_ringing', () => {
            setCallStatus('ringing');
            setActiveCall(prev => prev ? { ...prev, isRinging: true } : prev);
        });

        socket.on('call_rejected', ({ reason }) => {
            stopRingtone();
            if (callTimerRef.current) {
                clearTimeout(callTimerRef.current);
                callTimerRef.current = null;
            }
            setCallStatus(reason === 'busy' ? 'busy' : 'declined');
            setIncomingCall(null);
            setTimeout(() => {
                const currentCall = activeCallRef.current;
                if (currentCall?.stream) currentCall.stream.getTracks().forEach(t => t.stop());
                if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
                setActiveCall(null);
                setCallStatus(null);
            }, 4000);
        });

        socket.on('call_ended', () => {
            stopRingtone();
            if (callTimerRef.current) {
                clearTimeout(callTimerRef.current);
                callTimerRef.current = null;
            }
            setIncomingCall(null);
            const currentCall = activeCallRef.current;
            if (currentCall?.stream) currentCall.stream.getTracks().forEach(t => t.stop());
            if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
            setActiveCall(null);
            setCallStatus(null);
        });

        socket.on('call_failed', ({ reason }) => {
            stopRingtone();
            if (callTimerRef.current) {
                clearTimeout(callTimerRef.current);
                callTimerRef.current = null;
            }
            setIncomingCall(null);
            setCallStatus('failed');
            setTimeout(() => {
                setActiveCall(null);
                setCallStatus(null);
            }, 3000);
        });

        socket.on('call_accepted_elsewhere', () => {
            stopRingtone();
            setIncomingCall(null);
        });

        socket.on('call_rejected_elsewhere', () => {
            stopRingtone();
            setIncomingCall(null);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setSocket(null);
        };
    }, [user?._id, createPeer, stopRingtone, hangUp]);

    const checkSubscription = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        setIsPushSupported(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
            if (subscription && user) {
                api.post('/notifications/subscribe', { subscription });
            }
        } catch (error) {
            console.error('Error checking push subscription:', error);
        }
    }, [user]);

    const subscribeToPush = useCallback(async () => {
        if (!isPushSupported) return;
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });
            await api.post('/notifications/subscribe', { subscription });
            setIsSubscribed(true);
        } catch (error) {
            console.error('Push subscription failed:', error);
            setIsSubscribed(false);
        }
    }, [isPushSupported]);

    useEffect(() => {
        if (user && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(() => {
                checkSubscription();
            });
        }
    }, [user, checkSubscription]);

    const value = useMemo(() => ({
        user, socket, onlineUsers, incomingCall, activeCall, callStatus,
        audioSettings, isMuted, isVideoOff, startCall, acceptCall, rejectCall, hangUp,
        toggleMute, toggleVideo, previewRingtone, updateAudioSettings, isAudioBlocked,
        isPushSupported, isSubscribed, subscribeToPush
    }), [
        user, socket, onlineUsers, incomingCall, activeCall, callStatus, audioSettings,
        isMuted, isVideoOff, startCall, acceptCall, rejectCall, hangUp,
        toggleMute, toggleVideo, previewRingtone, updateAudioSettings, isAudioBlocked,
        isPushSupported, isSubscribed, subscribeToPush
    ]);

    return (
        <SocketContext.Provider value={value}>
            {children}
            <AnimatePresence>
                {incomingCall && <IncomingCallModal />}
                {activeCall && (
                    <CallOverlay 
                        call={activeCall} status={callStatus} onHangUp={hangUp}
                        onToggleMute={toggleMute} onToggleVideo={toggleVideo}
                        isMuted={isMuted} isVideoOff={isVideoOff} isAudioBlocked={isAudioBlocked}
                    />
                )}
            </AnimatePresence>
        </SocketContext.Provider>
    );
};

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};
