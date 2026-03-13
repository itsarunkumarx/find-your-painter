import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

// ── Ringtone helpers ────────────────────────────────────────────────────────
// ── Ringtone suites ──────────────────────────────────────────────────────────
export const RINGTONE_SUITES = {
    standard: {
        incoming: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
        outgoing: 'https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3',
        label: 'Platform Default'
    },
    melodic: {
        incoming: 'https://assets.mixkit.co/active_storage/sfx/1353/1353-preview.mp3',
        outgoing: 'https://assets.mixkit.co/active_storage/sfx/1353/1353-preview.mp3',
        label: 'Soft Harmony'
    },
    urgent: {
        incoming: 'https://assets.mixkit.co/active_storage/sfx/991/991-preview.mp3',
        outgoing: 'https://assets.mixkit.co/active_storage/sfx/991/991-preview.mp3',
        label: 'High Priority'
    },
    minimal: {
        incoming: 'https://assets.mixkit.co/active_storage/sfx/1350/1350-preview.mp3',
        outgoing: 'https://assets.mixkit.co/active_storage/sfx/1350/1350-preview.mp3',
        label: 'Digital Pulse'
    }
};

function createRingtone(url) {
    const audio = new Audio(url);
    audio.loop = true;

    // Play with error handling for autoplay restrictions
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.warn('Autoplay prevented or ringtone failed:', error);
        });
    }

    return () => {
        audio.pause();
        audio.currentTime = 0;
    };
}

// ─────────────────────────────────────────────────────────────────────────────

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const peerRef = useRef(null);
    const audioCtxRef = useRef(null);
    const stopRingtoneRef = useRef(null);
    const activeCallRef = useRef(null);

    const [onlineUsers, setOnlineUsers] = useState([]);
    const [incomingCall, setIncomingCall] = useState(null); // { fromUserId, fromUserName, fromUserImage, callType, offer }
    const [activeCall, setActiveCall] = useState(null);     // { contact, type, stream, remoteStream }
    const [audioSettings, setAudioSettings] = useState(() => {
        const saved = localStorage.getItem('audio_protocols');
        return saved ? JSON.parse(saved) : { incoming: 'standard', outgoing: 'standard' };
    });

    // Sync state to ref for access in socket listeners
    useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);

    const iceCandidatesQueue = useRef([]);

    // ── getAudioCtx ───────────────────────────────────────────────────────────
    const getAudioCtx = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    };

    const stopRingtone = useCallback(() => {
        if (stopRingtoneRef.current) {
            stopRingtoneRef.current();
            stopRingtoneRef.current = null;
        }
    }, []);

    const previewRingtone = useCallback((suiteId, type = 'incoming') => {
        stopRingtone();
        const url = RINGTONE_SUITES[suiteId]?.[type];
        if (url) {
            const stop = createRingtone(url);
            stopRingtoneRef.current = stop;
            // Auto stop preview after 5s
            setTimeout(() => {
                if (stopRingtoneRef.current === stop) stopRingtone();
            }, 5000);
        }
    }, [stopRingtone]);

    const updateAudioSettings = useCallback((newSettings) => {
        setAudioSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('audio_protocols', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // ── Create RTCPeerConnection ───────────────────────────────────────────────
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
            const remoteStream = event.streams[0];
            setActiveCall(prev => prev ? { ...prev, remoteStream } : prev);
        };

        peer.onconnectionstatechange = () => {
            if (['disconnected', 'failed', 'closed'].includes(peer.connectionState)) {
                hangUp();
            }
        };

        peerRef.current = peer;
        iceCandidatesQueue.current = []; // Reset queue for new connection
        return peer;
    }, []);

    // ── Initiate call (caller side) ───────────────────────────────────────────
    const startCall = useCallback(async (contact, callType = 'voice') => {
        if (!socketRef.current || !user) return;
        const toUserId = contact._id;

        // Get media stream
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callType === 'video'
            });
        } catch {
            alert('Microphone/Camera access denied. Please allow access to make calls.');
            return;
        }

        const peer = createPeer(toUserId);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        setActiveCall({ contact, type: callType, stream, remoteStream: null, isCaller: true, toUserId, isRinging: false });

        // Play outgoing ring tone
        stopRingtone();
        const toneUrl = RINGTONE_SUITES[audioSettings.outgoing]?.outgoing;
        stopRingtoneRef.current = createRingtone(toneUrl);

        socketRef.current.emit('call_offer', {
            toUserId,
            fromUserId: user._id,
            fromUserName: user.name,
            fromUserImage: user.profileImage,
            callType,
            offer
        });
    }, [user, createPeer, stopRingtone]);

    // ── Accept incoming call (receiver side) ──────────────────────────────────
    const acceptCall = useCallback(async () => {
        if (!incomingCall || !socketRef.current) return;
        stopRingtone();

        const { fromUserId, fromUserName, fromUserImage, callType, offer } = incomingCall;

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callType === 'video'
            });
        } catch {
            alert('Microphone/Camera access denied.');
            return;
        }

        const peer = createPeer(fromUserId);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socketRef.current.emit('call_answer', { toUserId: fromUserId, answer });

        setIncomingCall(null);
        setActiveCall({
            contact: { _id: fromUserId, name: fromUserName, profileImage: fromUserImage },
            type: callType,
            stream,
            remoteStream: null,
            isCaller: false,
            toUserId: fromUserId
        });
    }, [incomingCall, createPeer, stopRingtone]);

    const rejectCall = useCallback(() => {
        if (!incomingCall || !socketRef.current) return;
        stopRingtone();
        socketRef.current.emit('call_reject', { toUserId: incomingCall.fromUserId, reason: 'Call declined' });
        setIncomingCall(null);
    }, [incomingCall, stopRingtone]);

    // ── Hang up active call ───────────────────────────────────────────────────
    const hangUp = useCallback(() => {
        stopRingtone();
        if (activeCall?.toUserId && socketRef.current) {
            socketRef.current.emit('call_end', { toUserId: activeCall.toUserId });
        }
        if (activeCall?.stream) {
            activeCall.stream.getTracks().forEach(t => t.stop());
        }
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
        setActiveCall(null);
    }, [activeCall, stopRingtone]);

    // ── Handle Call from URL (PWA Notifications) ─────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const callId = params.get('callId');
        const action = params.get('action');
        const callerName = params.get('callerName');
        const callerId = params.get('callerId');

        if (callId && callerId) {
            // Mock an incoming call state so the UI shows up
            setIncomingCall({
                fromUserId: callerId,
                fromUserName: callerName || 'Someone',
                callType: 'voice', // Default or from params
                offer: null, // We'll need to join the room or wait for socket
                isFromNotification: true
            });

            if (action === 'accept') {
                // If the user clicked "Accept" in the notification, 
                // we should ideally trigger the join logic once socket is ready.
                console.log('User accepted call from notification:', callId);
            }
        }
    }, []);

    // ── Socket setup ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;

        const socket = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL, {
            transports: ['polling', 'websocket'],
            reconnection: true,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('user_online', user._id);
        });

        socket.on('online_users', setOnlineUsers);

        // ── Incoming call notification ────────────────────────────────────────
        socket.on('incoming_call', (data) => {
            setIncomingCall(data);
            socket.emit('call_received', { toUserId: data.fromUserId });
            // Play incoming ringtone
            stopRingtone();
            try {
                const toneUrl = RINGTONE_SUITES[audioSettings.incoming]?.incoming;
                stopRingtoneRef.current = createRingtone(toneUrl);
            } catch (e) {
                console.error('Failed to play ringtone:', e);
            }
        });

        // ── ICE candidate ─────────────────────────────────────────────────────
        socket.on('ice_candidate', async ({ candidate }) => {
            if (peerRef.current) {
                if (peerRef.current.remoteDescription) {
                    try {
                        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.error('Error adding received ice candidate', e);
                    }
                } else {
                    iceCandidatesQueue.current.push(candidate);
                }
            }
        });

        // ── Process Queued ICE Candidates helper ────────────────────────────
        const processQueuedCandidates = async () => {
            if (peerRef.current && peerRef.current.remoteDescription) {
                while (iceCandidatesQueue.current.length > 0) {
                    const candidate = iceCandidatesQueue.current.shift();
                    try {
                        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.error('Error adding queued ice candidate', e);
                    }
                }
            }
        };

        // ── Caller: receive answer ────────────────────────────────────────────
        socket.on('call_answered', async ({ answer }) => {
            stopRingtone();
            setActiveCall(prev => prev ? { ...prev, isRinging: false } : prev);
            if (peerRef.current) {
                try {
                    await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    await processQueuedCandidates();
                } catch (e) {
                    console.error('Error setting remote description', e);
                }
            }
        });

        // ── Caller: receive ringing notification ──────────────────────────────
        socket.on('call_ringing', () => {
            setActiveCall(prev => prev ? { ...prev, isRinging: true } : prev);
        });

        // ── Either side: call was rejected ────────────────────────────────────
        socket.on('call_rejected', ({ reason }) => {
            stopRingtone();
            const currentCall = activeCallRef.current;
            if (currentCall?.stream) currentCall.stream.getTracks().forEach(t => t.stop());
            if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
            setActiveCall(null);
            alert(`📵 ${reason || 'Call was declined.'}`);
        });

        // ── Either side: call ended ───────────────────────────────────────────
        socket.on('call_ended', () => {
            stopRingtone();
            const currentCall = activeCallRef.current;
            if (currentCall?.stream) currentCall.stream.getTracks().forEach(t => t.stop());
            if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
            setActiveCall(null);
        });

        // ── Call failed (offline) ─────────────────────────────────────────────
        socket.on('call_failed', ({ reason }) => {
            stopRingtone();
            setActiveCall(null);
            alert(`📵 ${reason}`);
        });

        socket.on('call_waiting', ({ message }) => {
            // Optional: Show a non-blocking toast or status message
            console.log('Call status:', message);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user?._id]);

    const value = {
        socket: socketRef.current,
        onlineUsers,
        incomingCall,
        activeCall,
        audioSettings,
        startCall,
        acceptCall,
        rejectCall,
        hangUp,
        previewRingtone,
        updateAudioSettings
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
