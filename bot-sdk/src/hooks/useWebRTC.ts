// WebRTC hook - handles voice call functionality
import { useRef, useState, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '@/services/api';

interface IncomingCall {
  from: string;
  fromName: string;
  fromCallId: string;
}

interface UseWebRTCProps {
  userId: string | null;
  enabled?: boolean;
}

interface UseWebRTCReturn {
  // State
  isRegistered: boolean;
  isInCall: boolean;
  incomingCall: IncomingCall | null;
  callDuration: string;
  isMuted: boolean;
  isSpeakerOn: boolean;

  // Actions
  handleAcceptCall: () => Promise<void>;
  handleRejectCall: () => void;
  handleEndCall: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
}

const ICE_SERVERS = [
  {
    urls: [
      'stun:3.109.172.202:3478',
      'turn:3.109.172.202:3478?transport=udp',
      'turn:3.109.172.202:3478?transport=tcp',
    ],
    username: 'saleszium',
    credential: 'rtWebRtc@123',
  },
];

export const useWebRTC = ({ userId, enabled = true }: UseWebRTCProps): UseWebRTCReturn => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState('00:00');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !userId) return;

    const socket = io(getSocketUrl());
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebRTC Socket Connected:', socket.id);

      // Auto-register with userId as callId
      socket.emit('register_manual', {
        callId: userId,
        username: 'Visitor',
      });
    });

    socket.on('registered_manual', ({ callId }) => {
      setIsRegistered(true);
      console.log(`Registered with Call ID: ${callId}`);
    });

    // Incoming call
    socket.on('call_request_manual', ({ from, fromName, fromCallId }) => {
      console.log(`Incoming call from ${fromName} (${fromCallId})`);
      setIncomingCall({ from, fromName, fromCallId });
    });

    // ICE + offer handlers
    socket.on('offer_manual', async ({ offer, from }) => {
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.emit('answer_manual', { answer, to: from });
    });

    socket.on('ice_candidate_manual', ({ candidate }) => {
      if (peerRef.current) {
        peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('call_ended_manual', () => {
      console.log('Call ended by other side');
      cleanupCall();
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, enabled]);

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isInCall && callStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const seconds = String(elapsed % 60).padStart(2, '0');
        setCallDuration(`${minutes}:${seconds}`);
      }, 1000);
    } else {
      setCallDuration('00:00');
    }

    return () => clearInterval(interval);
  }, [isInCall, callStartTime]);

  const cleanupCall = useCallback(() => {
    setIsInCall(false);
    setIncomingCall(null);
    setCallStartTime(null);
    setIsMuted(false);
    setIsSpeakerOn(true);

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

  const handleAcceptCall = useCallback(async () => {
    if (!incomingCall || !socketRef.current) return;
    const { from } = incomingCall;

    // Get microphone permission
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error('Mic access error:', err);
      alert('Please allow microphone access to accept the call.');
      return;
    }

    // Setup peer connection
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerRef.current = peer;
    localStreamRef.current = stream;

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit('ice_candidate_manual', {
          candidate: e.candidate,
          to: from,
        });
      }
    };

    peer.ontrack = (e) => {
      console.log('Remote audio received:', e.streams[0]);
      if (!remoteAudioRef.current) {
        const audio = new Audio();
        audio.autoplay = true;
        audio.muted = false;
        document.body.appendChild(audio);
        remoteAudioRef.current = audio;
      }
      remoteAudioRef.current.srcObject = e.streams[0];
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.autoplay = true;
    };

    // Update state & notify server
    setIncomingCall(null);
    setIsInCall(true);
    setCallStartTime(Date.now());
    setIsMuted(false);
    setIsSpeakerOn(true);

    socketRef.current.emit('call_accepted_manual', { to: from });
  }, [incomingCall]);

  const handleRejectCall = useCallback(() => {
    if (!incomingCall || !socketRef.current) return;

    socketRef.current.emit('call_rejected_manual', { to: incomingCall.from });
    setIncomingCall(null);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  }, [incomingCall]);

  const handleEndCall = useCallback(() => {
    console.log('Ending call...');
    socketRef.current?.emit('end_call_manual');
    cleanupCall();
  }, [cleanupCall]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => {
      const newVal = !prev;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = !newVal;
      }
      return newVal;
    });
  }, []);

  return {
    isRegistered,
    isInCall,
    incomingCall,
    callDuration,
    isMuted,
    isSpeakerOn,
    handleAcceptCall,
    handleRejectCall,
    handleEndCall,
    toggleMute,
    toggleSpeaker,
  };
};

export default useWebRTC;
