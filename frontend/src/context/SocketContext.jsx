import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import CallOverlay from '../components/CallOverlay';
import IncomingCallModal from '../components/IncomingCallModal';
import { AnimatePresence } from 'framer-motion';
import { RINGTONE_SUITES } from '../constants/ringtones';
import api from '../utils/api';
import toast from 'react-hot-toast';
import TransferModal from '../components/TransferModal';
import safeStorage from '../utils/safeStorage';

export const SocketContext = createContext(null);

// ── Ringtone helpers ───────────────────────────────────────────────────────────
// FIX: Use ONLY audio.loop=true; the old 'ended' handler conflicted with loop, causing the
//      ringtone to silently fail after 2 plays. Removed the ended handler entirely.
const createRingtone = (url, isIncoming = true, onBlocked = null) => {
    if (!url) return null;
    const audio = new Audio(url);
    audio.loop = true;                          // browser handles continuous looping
    audio.volume = isIncoming ? 1.0 : 0.5;
    audio.preload = 'auto';

    const forcePlay = async () => {
        try {
            await audio.play();
        } catch (err) {
            if (import.meta.env.DEV) {
                console.warn('[Ringtone] Autoplay blocked — waiting for user interaction:', err.name);
            }
            if (onBlocked) onBlocked();
        }
    };

    forcePlay();

    return {
        stop: () => {
            audio.pause();
            audio.currentTime = 0;
            audio.loop = false;
        },
        play: () => forcePlay()
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

/**
 * SDP Munging: Forces Opus to high bitrate (128kbps), stereo, and enables FEC.
 * This significantly improves audio quality over the default ~32kbps mono.
 */
const preferOpus = (sdp) => {
    let lines = sdp.split('\r\n');
    let mLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf('m=audio') !== -1) {
            mLineIndex = i;
            break;
        }
    }
    if (mLineIndex === -1) return sdp;

    // Find the Opus payload type
    let opusPayload = null;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf('a=rtpmap') !== -1 && lines[i].indexOf('opus/48000') !== -1) {
            let match = lines[i].match(/a=rtpmap:(\d+) opus\/48000/);
            if (match) {
                opusPayload = match[1];
                break;
            }
        }
    }

    if (opusPayload) {
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].indexOf('a=fmtp:' + opusPayload) !== -1) {
                // Modified parameters:
                // maxaveragebitrate=128000 (standard is ~32k)
                // stereo=1 (standard is 0)
                // sprop-stereo=1 (signal stereo capability)
                // useinbandfec=1 (forward error correction)
                lines[i] = lines[i] + ';maxaveragebitrate=128000;stereo=1;sprop-stereo=1;useinbandfec=1';
            }
        }
    }

    return lines.join('\r\n');
};

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const peerRef = useRef(null);
    const stopRingtoneRef = useRef(null);
    const activeCallRef = useRef(null);
    const incomingCallRef = useRef(null);
    const userRef = useRef(user);
    const iceCandidatesQueue = useRef([]);
    const callTimerRef = useRef(null);
    const preWarmedStreamRef = useRef(null);
    // Buffers remote tracks that arrive BEFORE setActiveCall completes (React async state race)
    const pendingRemoteStreamRef = useRef(null);
    // Tracks if the user has permanently denied mic/camera permission this session
    const permissionDeniedRef = useRef(false);

    // CRITICAL FIX: useRef(() => {...}) stores the function as .current, NOT the return value.
    // Must immediately invoke the function: useRef((() => {...})())
    const settingsRef = useRef((() => {
        const saved = safeStorage.getItem('audio_protocols');
        if (!saved) return { incoming: 'standard', outgoing: 'standard' };
        try {
            return JSON.parse(saved);
        } catch {
            return { incoming: 'standard', outgoing: 'standard' };
        }
    })());

    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const location = useLocation();

    // Handle auto-accept from Push Notification
    useEffect(() => {
        const checkAutoAccept = () => {
            const params = new URLSearchParams(window.location.search);
            if (params.get('autoAccept') === 'true' && incomingCall) {
                if (import.meta.env.DEV) console.log('[Socket] Auto-accepting from query param');
                acceptCall();
            }
        };

        const handleMessage = (event) => {
            if (event.data?.type === 'ACCEPT_CALL_VIA_NOTIF' && incomingCall) {
                if (import.meta.env.DEV) console.log('[Socket] Accepting from SW message');
                acceptCall();
            }
        };

        checkAutoAccept();
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleMessage);
            return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
        }
    }, [incomingCall, location.search]);

    // TRACE: Monitor state changes (Silenced for performance)
    /*
    useEffect(() => {
        if (incomingCall) console.log('[SOCKET_STATE] incomingCall updated:', incomingCall.callId, 'from:', incomingCall.fromUserName);
    }, [incomingCall]);

    useEffect(() => {
        if (activeCall) console.log('[SOCKET_STATE] activeCall updated:', activeCall.type, 'isCaller:', activeCall.isCaller);
    }, [activeCall]);
    */
    const [isPushSupported, setIsPushSupported] = useState('serviceWorker' in navigator && 'PushManager' in window);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isPushInitializing, setIsPushInitializing] = useState(false);
    const [callStatus, setCallStatus] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isAudioBlocked, setIsAudioBlocked] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [audioSettings, setAudioSettings] = useState(() => {
        const saved = safeStorage.getItem('audio_protocols');
        if (!saved) return { incoming: 'standard', outgoing: 'standard' };
        try {
            return JSON.parse(saved);
        } catch {
            return { incoming: 'standard', outgoing: 'standard' };
        }
    });

    useTabFlashing('📞 Incoming Call...', !!incomingCall);

    useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
    useEffect(() => { userRef.current = user; }, [user]);
    // FIX: keep settingsRef in sync by calling the initializer result via a normal value
    useEffect(() => {
        settingsRef.current = audioSettings;
    }, [audioSettings]);

    const stopRingtone = useCallback(() => {
        setIsAudioBlocked(false); // Reset blocked state when stopping
        if (stopRingtoneRef.current) {
            stopRingtoneRef.current.stop();
            stopRingtoneRef.current = null;
        }
    }, []);

    // Helper: resolve ringtone URL from current settings
    const getRingtoneUrl = useCallback((type) => {
        const currentSettings = settingsRef.current || { incoming: 'standard', outgoing: 'standard' };
        const currentUser = userRef.current;
        if (currentSettings[type] === 'custom') {
            return type === 'incoming' ? currentUser?.customRingtone : currentUser?.customOutgoingTone;
        }
        return RINGTONE_SUITES[currentSettings[type] || 'standard']?.[type]
            ?? RINGTONE_SUITES['standard'][type];
    }, []);

    const manuallyPlayRingtone = useCallback(() => {
        if (stopRingtoneRef.current && stopRingtoneRef.current.play) {
            stopRingtoneRef.current.play();
            setIsAudioBlocked(false);
        }
    }, []);

    const previewRingtone = useCallback((suiteId, type = 'incoming') => {
        stopRingtone();
        let url;
        if (suiteId === 'custom') {
            url = type === 'incoming' ? userRef.current?.customRingtone : userRef.current?.customOutgoingTone;
        } else {
            url = RINGTONE_SUITES[suiteId]?.[type];
        }
        if (url) {
            const rt = createRingtone(url, type === 'incoming');
            stopRingtoneRef.current = rt;
            // Auto-stop preview after 30s
            setTimeout(() => {
                if (stopRingtoneRef.current === rt) stopRingtone();
            }, 30000);
        }
    }, [stopRingtone]);

    const updateAudioSettings = useCallback((newSettings) => {
        setAudioSettings(prev => {
            const updated = { ...prev, ...newSettings };
            safeStorage.setItem('audio_protocols', JSON.stringify(updated));
            settingsRef.current = updated; // keep ref in sync immediately
            return updated;
        });
    }, []);

    // Check browser permission state BEFORE calling getUserMedia to give a proactive warning
    const checkPermission = useCallback(async (callType) => {
        if (!navigator.permissions) {
            // Permissions API not available — always allow getUserMedia to decide
            permissionDeniedRef.current = false;
            return true;
        }
        try {
            const micPerm = await navigator.permissions.query({ name: 'microphone' });
            if (micPerm.state === 'denied') {
                permissionDeniedRef.current = true;
                return false;
            }
            if (callType === 'video') {
                const camPerm = await navigator.permissions.query({ name: 'camera' });
                if (camPerm.state === 'denied') {
                    permissionDeniedRef.current = true;
                    return false;
                }
            }
            // FIX: If we reach here, permission is either 'granted' or 'prompt'.
            // Reset the denied flag so a previously-failed pre-warm doesn't block future calls.
            permissionDeniedRef.current = false;
        } catch {
            // Permissions API may throw on some browsers (e.g. Capacitor WebView) — fall through
            permissionDeniedRef.current = false;
        }
        return true;
    }, []);

    const preWarmMedia = useCallback(async (callType) => {
        if (preWarmedStreamRef.current) return preWarmedStreamRef.current;
        // FIX: Do NOT block pre-warm based on permissionDeniedRef — it may be stale.
        // Pre-warm is best-effort; if it fails, the real getUserMedia in startCall/acceptCall will run.
        try {
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 2,
                    googEchoCancellation: true,
                    googAutoGainControl: true,
                    googNoiseSuppression: true,
                    googHighpassFilter: true,
                    googTypingNoiseDetection: true
                },
                video: callType === 'video' ? { facingMode: 'user' } : false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            preWarmedStreamRef.current = stream;
            permissionDeniedRef.current = false; // Confirmed granted — reset
            return stream;
        } catch (err) {
            // FIX: Only mark as denied for hard 'NotAllowedError'. For other errors (NotFoundError,
            // NotReadableError), don't permanently block — the device may become available later.
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                permissionDeniedRef.current = true;
            }
            if (import.meta.env.DEV) console.warn('[PreWarm] Failed to pre-warm media:', err.name);
            return null; // Pre-warm is best-effort; startCall/acceptCall will handle the real request
        }
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
        if (preWarmedStreamRef.current) {
            preWarmedStreamRef.current.getTracks().forEach(t => t.stop());
            preWarmedStreamRef.current = null;
        }
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
        // FIX: Clear pending remote stream buffer to prevent ghost tracks on next call
        pendingRemoteStreamRef.current = null;
        setActiveCall(null);
        setCallStatus(null);
        setShowTransfer(false);
        if (callTimerRef.current) {
            clearTimeout(callTimerRef.current);
            callTimerRef.current = null;
        }
    }, [stopRingtone]);

    const resolveUserId = useCallback((contact) => {
        if (!contact) return null;
        if (typeof contact === 'string') return contact.trim();
        
        // Priority order: user._id > user > _id > id
        // This ensures if we have a worker profile, we get the associated User ID
        const id = contact.user?._id || contact.user?.id || contact.user || contact._id || contact.id;
        
        if (typeof id === 'object' && id !== null) {
            const rawId = id?._id || id?.id || String(id);
            return String(rawId).trim();
        }
        return id ? String(id).trim() : null;
    }, []);

    const createPeer = useCallback((toUserId) => {
        // Reset pending stream buffer for new call
        pendingRemoteStreamRef.current = null;

        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                // TURN relay servers — required for calls on restricted networks (mobile data, NAT, firewalls)
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                }
            ],
            iceCandidatePoolSize: 10
        });

        peer.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice_candidate', { toUserId, candidate: event.candidate });
            }
        };

        // FIX: Remote tracks can arrive BEFORE setActiveCall(). Store them in a ref buffer first.
        // When setActiveCall runs, it picks up the pending stream.
        peer.ontrack = (event) => {
            if (import.meta.env.DEV) console.log('[WebRTC] ontrack:', event.track.kind);

            if (!pendingRemoteStreamRef.current) {
                pendingRemoteStreamRef.current = new MediaStream();
            }
            const pendingStream = pendingRemoteStreamRef.current;
            
            if (!pendingStream.getTracks().some(t => t.id === event.track.id)) {
                pendingStream.addTrack(event.track);
            }

            setActiveCall(prev => {
                if (!prev) return prev;
                if (prev.remoteStream && prev.remoteStream.getTracks().length > 0) return prev;
                return { ...prev, remoteStream: pendingStream };
            });
        };

        peer.onconnectionstatechange = () => {
            // console.log('[WebRTC] Connection state:', peer.connectionState);
            if (peer.connectionState === 'connected') {
                if (pendingRemoteStreamRef.current && pendingRemoteStreamRef.current.getTracks().length > 0) {
                    setActiveCall(prev => prev ? { ...prev, remoteStream: pendingRemoteStreamRef.current } : prev);
                }
            }
            if (['disconnected', 'failed', 'closed'].includes(peer.connectionState)) {
                hangUp();
            }
        };

        peer.onicegatheringstatechange = () => {
            if (import.meta.env.DEV) console.log('[WebRTC] ICE gathering:', peer.iceGatheringState);
        };

        peerRef.current = peer;
        iceCandidatesQueue.current = [];
        return peer;
    }, [hangUp]);

    const drainIceCandidates = useCallback(async () => {
        // FIX: Improved ICE draining — process all queued candidates safely
        if (!peerRef.current || !peerRef.current.remoteDescription) return;
        const queue = [...iceCandidatesQueue.current];
        iceCandidatesQueue.current = [];
        for (const candidate of queue) {
            try {
                await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.warn('[ICE] Error adding queued candidate:', e.message);
            }
        }
    }, []);

    const startCall = useCallback(async (contact, callType = 'voice') => {
        if (!socketRef.current || !user) return;

        const toUserId = resolveUserId(contact);
        if (!toUserId) {
            toast.error('Could not resolve recipient ID');
            return;
        }

        if (toUserId === user._id?.toString()) {
            toast.error('Cannot call yourself');
            return;
        }

        // FIX: Check permission BEFORE showing any UI or playing ringtone.
        // This catches the "permanently denied" case and avoids a confusing partial-UI state.
        const hasPermission = await checkPermission(callType);
        if (!hasPermission) {
            const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
            toast.error(
                isMobile
                    ? '📵 Camera/Mic blocked! Go to Phone Settings → App Permissions → allow Camera & Microphone for this browser.'
                    : '🎙️ Microphone/Camera access is blocked. Click the 🔒 lock icon in your browser address bar and allow mic & camera, then refresh.',
                { duration: 8000, id: 'media-denied' }
            );
            return;
        }

        setCallStatus('connecting');
        stopRingtone();
        
        // Play outgoing ringtone immediately
        const toneUrl = getRingtoneUrl('outgoing');
        if (toneUrl) stopRingtoneRef.current = createRingtone(toneUrl, false);

        // INSTANT UI: Show overlay immediately
        setActiveCall({ 
            contact, 
            type: callType, 
            stream: null, 
            remoteStream: null, 
            isCaller: true, 
            toUserId, 
            isRinging: false 
        });

        // Parallelize media capture and peer initialization
        const mediaPromise = (async () => {
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 2,
                    googEchoCancellation: true,
                    googAutoGainControl: true,
                    googNoiseSuppression: true,
                    googHighpassFilter: true,
                    googTypingNoiseDetection: true
                },
                video: callType === 'video' ? { facingMode: 'user' } : false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setActiveCall(prev => prev ? { ...prev, stream } : prev);
            return stream;
        })();

        try {
            const stream = await mediaPromise;
            const peer = createPeer(toUserId);
            stream.getTracks().forEach(track => peer.addTrack(track, stream));

            const offer = await peer.createOffer();
            const mungedOffer = { type: 'offer', sdp: preferOpus(offer.sdp) };
            await peer.setLocalDescription(mungedOffer);

            socketRef.current.emit('call_offer', {
                toUserId,
                fromUserId: user._id,
                fromUserName: user.name,
                fromUserImage: user.profileImage,
                callType,
                offer: mungedOffer
            });

            // FIX: Only register the no-answer timeout AFTER the offer is successfully sent.
            // Previously this ran even when media failed, causing a phantom hangUp() 120s later.
            if (callTimerRef.current) clearTimeout(callTimerRef.current);
            callTimerRef.current = setTimeout(() => {
                if (activeCallRef.current && !activeCallRef.current.remoteStream) {
                    setCallStatus('no_answer');
                    setTimeout(() => hangUp(), 4000);
                }
            }, 120000);

        } catch (err) {
            stopRingtone();
            setCallStatus(null);
            if (activeCallRef.current?.stream) activeCallRef.current.stream.getTracks().forEach(t => t.stop());
            setActiveCall(null);
            if (socketRef.current) socketRef.current.emit('call_cancel', { toUserId, reason: 'caller_media_denied' });

            // Mark permission as denied if that's the cause
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                permissionDeniedRef.current = true;
            }

            let message = '🎙️ Media access failed. Please check mic/camera permissions.';
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                message = '🎙️ Access Denied: Click the 🔒 lock icon in your browser address bar and allow Microphone & Camera.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                message = '📵 No camera or microphone detected on this device.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                message = '📵 Camera/Microphone is already in use by another app. Close it and try again.';
            }
            toast.error(message, { duration: 8000, id: 'media-fail' });
            // FIX: return early — do NOT fall through to set the timeout after failure
            return;
        }
    }, [user, createPeer, stopRingtone, hangUp, resolveUserId, getRingtoneUrl, checkPermission]);

    // Call transfer — forward active call to another user
    const transferCall = useCallback((toUserId) => {
        if (!socketRef.current || !activeCallRef.current) return;
        const currentCall = activeCallRef.current;
        socketRef.current.emit('call_transfer', {
            fromUserId: user?._id,
            originalCalleeId: currentCall.toUserId,
            newCalleeId: toUserId,
            callType: currentCall.type
        });
        hangUp();
        toast.success('Call transferred successfully');
    }, [user, hangUp]);

    const processQueuedCandidates = useCallback(async () => {
        await drainIceCandidates();
    }, [drainIceCandidates]);

    const acceptCall = useCallback(async () => {
        if (!incomingCall || !socketRef.current) return;
        
        const { fromUserId, fromUserName, fromUserImage, callType, offer, callId } = incomingCall;

        // FIX: Always do a LIVE permission check instead of relying on the potentially stale
        // permissionDeniedRef (which may have been set by a background preWarmMedia failure
        // even when the user has since granted permission).
        // Only block if the permission is ACTUALLY 'denied' right now, not just historically.
        if (!preWarmedStreamRef.current) {
            const hasPermission = await checkPermission(callType);
            if (!hasPermission) {
                const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
                toast.error(
                    isMobile
                        ? '📵 Camera/Mic blocked! Go to Phone Settings → App Permissions → allow Camera & Microphone for this browser.'
                        : '🎙️ Access Denied: Click the 🔒 lock icon in your browser address bar and allow Microphone & Camera, then refresh.',
                    { duration: 8000, id: 'media-denied' }
                );
                socketRef.current.emit('call_reject', { toUserId: fromUserId, reason: 'media_denied' });
                return;
            }
        }

        // INSTANT UI: Clear incoming call state and set active call immediately
        setIncomingCall(null);
        incomingCallRef.current = null;
        stopRingtone();
        
        setActiveCall({
            contact: { _id: fromUserId, name: fromUserName, profileImage: fromUserImage },
            type: callType,
            stream: null,
            remoteStream: pendingRemoteStreamRef.current ? new MediaStream(pendingRemoteStreamRef.current.getTracks()) : null,
            isCaller: false,
            toUserId: fromUserId,
            startTime: Date.now()
        });

        let stream = preWarmedStreamRef.current;
        try {
            if (!stream) {
                const constraints = {
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 48000,
                        channelCount: 2,
                        googEchoCancellation: true,
                        googAutoGainControl: true,
                        googNoiseSuppression: true,
                        googHighpassFilter: true,
                        googTypingNoiseDetection: true
                    },
                    video: callType === 'video' ? { facingMode: 'user' } : false
                };
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            }
            preWarmedStreamRef.current = null; // Consume pre-warmed stream
            permissionDeniedRef.current = false; // Reset flag — user granted access
        } catch (err) {
            if (import.meta.env.DEV) console.error('[acceptCall] getUserMedia failed:', err);

            // Mark as denied so the next call attempt shows the error immediately
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                permissionDeniedRef.current = true;
            }
            
            let message = '🎙️ Camera/Microphone access denied.';
            if (!window.isSecureContext) {
                message = '🎙️ Browser Error: WebRTC requires HTTPS. Media is blocked on insecure pages.';
            } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                message = '🎙️ Access Denied: Click the 🔒 lock icon in your browser address bar and allow Microphone & Camera.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                message = '📵 No camera or microphone detected on this device.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                message = '📵 Camera/Microphone is already in use by another app. Close it and try again.';
            } else if (err.name === 'OverconstrainedError') {
                message = '⚠️ Your device does not support the required media quality settings.';
            }

            const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
            toast.error(
                isMobile && err.name === 'NotAllowedError'
                    ? '📵 Camera/Mic blocked! Go to Phone Settings → App Permissions → allow Camera & Microphone for this browser.'
                    : message,
                { duration: 8000, id: 'media-denied' }
            );
            socketRef.current.emit('call_reject', { toUserId: fromUserId, reason: 'media_denied' });
            // Also tear down the active call overlay we already set
            setActiveCall(null);
            return;
        }

        let peer;
        try {
            peer = createPeer(fromUserId);
            stream.getTracks().forEach(track => peer.addTrack(track, stream));

            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            await drainIceCandidates();

            const answer = await peer.createAnswer();
            const mungedAnswer = { type: 'answer', sdp: preferOpus(answer.sdp) };
            await peer.setLocalDescription(mungedAnswer);

            socketRef.current.emit('call_answer', { toUserId: fromUserId, answer: mungedAnswer, callId });

            setCallStatus('connected');
            
            setActiveCall(prev => prev ? {
                ...prev,
                stream,
                remoteStream: pendingRemoteStreamRef.current ? new MediaStream(pendingRemoteStreamRef.current.getTracks()) : prev.remoteStream
            } : null);
        } catch (e) {
            if (import.meta.env.DEV) console.error('[acceptCall] handshake failed:', e);
            toast.error('Call synchronization failed.');
            if (stream) stream.getTracks().forEach(t => t.stop());
            socketRef.current.emit('call_end', { toUserId: fromUserId });
        }
    }, [incomingCall, createPeer, stopRingtone, drainIceCandidates, checkPermission]);

    const rejectCall = useCallback(() => {
        if (!incomingCall || !socketRef.current) return;
        stopRingtone();
        socketRef.current.emit('call_reject', { toUserId: incomingCall.fromUserId, reason: 'Call declined' });
        setIncomingCall(null);
        incomingCallRef.current = null;
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

    // ── Socket connection ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;

        // Explicitly point to the backend port in development to avoid proxy-induced WebSocket connection drops
        const socketUrl = (import.meta.env.DEV) 
            ? 'http://localhost:5000' 
            : (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '').replace(/(\/api)+$/, '');

        if (import.meta.env.DEV) console.log('[SOCKET] Initializing with URL:', socketUrl);
        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            rememberUpgrade: true,
            reconnection: true,
            reconnectionAttempts: 15,
            reconnectionDelay: 500,
            timeout: 15000,
        });
        socketRef.current = socket;
        setSocket(socket);

        socket.on('connect', () => {
            // socket.emit('user_online', user._id);
            socket.emit('user_online', user._id);
            // Verify channel with a ping
            socket.emit('ping_server', { timestamp: Date.now(), uid: user._id });
        });

        socket.on('pong_client', (data) => {
             // Latency tracking silenced
        });

        socket.on('connect_error', (error) => {
            // Silently log transport errors (like websocket failure) as long as polling fallback exists
            if (import.meta.env.DEV) {
                console.warn('[SOCKET] Handshake/Transport Error:', error.message);
            }
            
            // Only show error toast if the socket has completely given up
            if (!socket.connected && socket.reconnectionAttempts >= 5) {
                toast.error(`Signaling unstable: ${error.message}`, { id: 'socket-status' });
            }
        });

        socket.on('error', (error) => {
            if (import.meta.env.DEV) {
                console.error('[SOCKET] Socket Error:', error);
            }
        });

        socket.on('reconnect', () => {
            if (import.meta.env.DEV) console.log('[SOCKET] Reconnected');
            socket.emit('user_online', user._id);
        });

        socket.on('online_users', setOnlineUsers);

        socket.on('call_signal_sent', ({ targetUid, socketCount }) => {
            // console.log(`[SOCKET] Server confirmed signal sent to ${socketCount} sockets for target ${targetUid}`);
            // toast.success(`Signal delivered to ${socketCount} receiver window(s)`, { id: 'call_path', duration: 3000 });
        });

        socket.on('call_target_offline', ({ targetUid }) => {
            if (import.meta.env.DEV) console.error(`[SOCKET] Server reports target ${targetUid} is OFFLINE`);
            toast.error('Recipient is offline. Sending alert notification...', { id: 'call_path', duration: 4000 });
            setCallStatus('failed');
            stopRingtone();
            setTimeout(() => setCallStatus(null), 3000);
        });

        socket.on('incoming_call', (data) => {
            // Reject if already on a call
            if (activeCallRef.current) {
                toast.error(`Blocked call from ${data.fromUserName}: Line busy`, { id: 'busy-reject' });
                socket.emit('call_rejected', { toUserId: data.fromUserId, reason: 'busy' });
                return;
            }

            // Ignore duplicate event for same call
            if (incomingCallRef.current?.callId === data.callId) return;

            incomingCallRef.current = data;
            setIncomingCall(data);
            socket.emit('call_received', { toUserId: data.fromUserId });

            // OPTIMIZATION: "Pre-warm" media immediately when call is received
            // This makes the 'Accept' button feel instant as the stream is ready before the click.
            preWarmMedia(data.callType);

            socket.on('call_id_update', ({ callId }) => {
                setIncomingCall(prev => prev ? { ...prev, callId } : prev);
                if (incomingCallRef.current) incomingCallRef.current.callId = callId;
            });

            // Play incoming ringtone (continuously via loop=true)
            if (!stopRingtoneRef.current) {
                try {
                    const toneUrl = getRingtoneUrl('incoming');
                    if (toneUrl) {
                        stopRingtoneRef.current = createRingtone(toneUrl, true, () => {
                            setIsAudioBlocked(true); // Notify UI if autoplay fails
                        });
                    }
                } catch (e) {
                    console.warn('[Ringtone] Failed to play incoming:', e);
                }
            }
        });

        socket.on('ice_candidate', async ({ candidate }) => {
            if (!peerRef.current || !candidate) return;
            if (peerRef.current.remoteDescription) {
                try {
                    await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.warn('[ICE] Error adding live candidate:', e.message);
                }
            } else {
                iceCandidatesQueue.current.push(candidate);
            }
        });

        socket.on('call_answered', async ({ answer }) => {
            stopRingtone();
            if (callTimerRef.current) { clearTimeout(callTimerRef.current); callTimerRef.current = null; }
            // FIX: Always set startTime to NOW when the callee picks up so the caller's timer is accurate
            const answerTime = Date.now();
            setCallStatus('connected');
            setActiveCall(prev => prev ? { 
                ...prev, 
                isRinging: false,
                startTime: answerTime
            } : prev);
            if (peerRef.current && answer) {
                try {
                    await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    await drainIceCandidates();
                } catch (e) {
                    console.warn('[call_answered] setRemoteDescription error:', e.message);
                }
            }
        });

        socket.on('call_ringing', () => {
            setCallStatus('ringing');
            setActiveCall(prev => prev ? { ...prev, isRinging: true } : prev);
        });

        socket.on('call_rejected', ({ reason }) => {
            stopRingtone();
            if (callTimerRef.current) { clearTimeout(callTimerRef.current); callTimerRef.current = null; }
            // FIX: Show specific messages based on rejection reason
            if (reason === 'media_denied') {
                toast.error('📵 Recipient\'s Camera/Microphone is blocked. Ask them to allow mic/camera access and call again.', { duration: 7000, id: 'call-reject-reason' });
            } else if (reason === 'busy') {
                toast.error('📞 Recipient is on another call.', { id: 'call-reject-reason', duration: 4000 });
            } else {
                toast('📵 Call was declined.', { id: 'call-reject-reason', duration: 3000 });
            }
            setCallStatus(reason === 'busy' ? 'busy' : reason === 'media_denied' ? 'declined' : 'declined');
            setIncomingCall(null);
            incomingCallRef.current = null;
            setTimeout(() => {
                const currentCall = activeCallRef.current;
                if (currentCall?.stream) currentCall.stream.getTracks().forEach(t => t.stop());
                if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
                pendingRemoteStreamRef.current = null;
                setActiveCall(null);
                setCallStatus(null);
            }, 4000);
        });

        socket.on('call_ended', () => {
            // FIX: Stop ringtone first, then clean up — ensures ringtone always stops on remote hangup
            stopRingtone();
            if (callTimerRef.current) { clearTimeout(callTimerRef.current); callTimerRef.current = null; }
            setIncomingCall(null);
            incomingCallRef.current = null;
            const currentCall = activeCallRef.current;
            if (currentCall?.stream) currentCall.stream.getTracks().forEach(t => t.stop());
            if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
            pendingRemoteStreamRef.current = null;
            setActiveCall(null);
            setCallStatus(null);
        });

        socket.on('call_failed', () => {
            // FIX: Stop ringtone on failure too
            stopRingtone();
            if (callTimerRef.current) { clearTimeout(callTimerRef.current); callTimerRef.current = null; }
            setIncomingCall(null);
            incomingCallRef.current = null;
            const currentCall = activeCallRef.current;
            if (currentCall?.stream) currentCall.stream.getTracks().forEach(t => t.stop());
            if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
            pendingRemoteStreamRef.current = null;
            setCallStatus('failed');
            setTimeout(() => { setActiveCall(null); setCallStatus(null); }, 3000);
        });

        socket.on('call_accepted_elsewhere', () => {
            stopRingtone();
            setIncomingCall(null);
            incomingCallRef.current = null;
        });

        socket.on('call_rejected_elsewhere', () => {
            stopRingtone();
            setIncomingCall(null);
            incomingCallRef.current = null;
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setSocket(null);
        };
    }, [user?._id, createPeer, stopRingtone, hangUp, getRingtoneUrl, drainIceCandidates]);

    // ── Push notifications ─────────────────────────────────────────────────────
    const checkSubscription = useCallback(async () => {
        if (!isPushSupported) return;
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
            if (subscription && user) api.post('/notifications/subscribe', { subscription });
        } catch (error) {
            // Service worker might not be registered in dev, that's fine
            if (import.meta.env.DEV) return;
            if (import.meta.env.DEV) console.error('[Push] Subscription check failed:', error);
        }
    }, [user, isPushSupported]);

    const subscribeToPush = useCallback(async () => {
        if (!isPushSupported || isPushInitializing) return;
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
            toast.error('VAPID Key missing from environment.');
            return;
        }

        setIsPushInitializing(true);
        const toastId = toast.loading('Initializing secure push signal...');
        try {
            if (import.meta.env.DEV) console.log('[Push] Probing service worker state...');
            
            // Check if we already have a registration
            let registration = await navigator.serviceWorker.getRegistration();
            
            if (!registration) {
                if (import.meta.env.DEV) console.warn('[Push] No registration found, waiting for .ready...');
                // Robust initialization with 7s timeout for slower devices
                registration = await Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('SW_TIMEOUT')), 7000))
                ]);
            }

            if (import.meta.env.DEV) console.log('[Push] Service Worker Ready. Scope:', registration.scope);
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });
            await api.post('/notifications/subscribe', { subscription });
            setIsSubscribed(true);
            toast.success('Push Intelligence Active', { id: toastId });
        } catch (error) {
            if (import.meta.env.DEV) console.error('[Push] Subscribe failed:', error);
            setIsSubscribed(false);
            if (error.name === 'NotAllowedError') {
                toast.error('Permission denied. Please allow notifications in your browser.', { id: toastId });
            } else if (error.message === 'SW_TIMEOUT') {
                toast.error('Bootstrap timeout. Refresh and try again.', { id: toastId });
            } else {
                toast.error('Could not activate push signal. Check connection.', { id: toastId });
            }
        } finally {
            setIsPushInitializing(false);
        }
    }, [isPushSupported, isPushInitializing]);

    const unsubscribeFromPush = useCallback(async () => {
        if (!isPushSupported || isPushInitializing) return;
        setIsPushInitializing(true);
        const toastId = toast.loading('Deactivating push signal...');
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                await api.post('/notifications/unsubscribe', { endpoint: subscription.endpoint });
            }
            setIsSubscribed(false);
            toast.success('Push Intelligence Offline', { id: toastId });
        } catch (error) {
            if (import.meta.env.DEV) console.error('[Push] Unsubscribe failed:', error);
            toast.error('Could not deactivate signal.', { id: toastId });
        } finally {
            setIsPushInitializing(false);
        }
    }, [isPushSupported, isPushInitializing]);

    useEffect(() => {
        if (user && isPushSupported) {
            checkSubscription();
        }
    }, [user, isPushSupported, checkSubscription]);

    const sendTestNotification = useCallback(async () => {
        try {
            await api.post('/notifications/test-push');
        } catch (error) {
            if (import.meta.env.DEV) console.error('[Push] Test failed:', error);
        }
    }, []);

    const value = useMemo(() => ({
        user, socket, onlineUsers, incomingCall, activeCall, callStatus,
        audioSettings, isMuted, isVideoOff, startCall, acceptCall, rejectCall, hangUp,
        toggleMute, toggleVideo, previewRingtone, updateAudioSettings, isAudioBlocked,
        manuallyPlayRingtone, isPushSupported, isSubscribed, isPushInitializing, subscribeToPush, unsubscribeFromPush, transferCall,
        showTransfer, setShowTransfer, sendTestNotification
    }), [
        user, socket, onlineUsers, incomingCall, activeCall, callStatus, audioSettings,
        isMuted, isVideoOff, startCall, acceptCall, rejectCall, hangUp,
        toggleMute, toggleVideo, previewRingtone, updateAudioSettings, isAudioBlocked,
        manuallyPlayRingtone, isPushSupported, isSubscribed, isPushInitializing, subscribeToPush, unsubscribeFromPush, transferCall,
        showTransfer, sendTestNotification
    ]);

    return (
        <SocketContext.Provider value={value}>
            {children}
            {/* ── Portals Layer: Guaranteed Visibility ───────────────────── */}
            {typeof document !== 'undefined' && document.body && createPortal(
                <div id="comms-portal-root" style={{ position: 'relative', zIndex: 99999 }}>
                    <AnimatePresence mode="wait">
                        {incomingCall ? (
                            <IncomingCallModal 
                                key={`incoming-${incomingCall.callId || Date.now()}`}
                                data={incomingCall}
                                onAccept={acceptCall}
                                onReject={rejectCall}
                                isAudioBlocked={isAudioBlocked}
                                manuallyPlayRingtone={manuallyPlayRingtone}
                            />
                        ) : null}
                        {activeCall && (
                            <CallOverlay
                                key={`active-${activeCall.callId || 'current'}`}
                                call={activeCall}
                                status={callStatus}
                                onHangUp={hangUp}
                                onToggleMute={toggleMute}
                                onToggleVideo={toggleVideo}
                                isMuted={isMuted}
                                isVideoOff={isVideoOff}
                                isAudioBlocked={isAudioBlocked}
                                onTransfer={() => setShowTransfer(true)}
                            />
                        )}
                        {showTransfer && (
                            <TransferModal
                                key="transfer-modal"
                                mode="call"
                                onClose={() => setShowTransfer(false)}
                            />
                        )}
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </SocketContext.Provider>
    );
};

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
};
