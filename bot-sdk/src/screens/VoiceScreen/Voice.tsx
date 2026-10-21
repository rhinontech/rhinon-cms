import React, { useEffect, useRef, useState } from 'react';
import CloudWave from './CloudWave';
import './Voice.scss';

// New imports from restructured modules
import type { VoiceScreenProps } from '@/types';
import { getVoiceSessionToken, submitVoiceLead, searchVoiceKnowledge, handoffSupport } from '@/services/voice';
import {
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeOff,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

// Helper to get user email
const getUserEmail = (): string | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get('email');
  if (emailFromUrl) return emailFromUrl;

  const emailFromStorage = localStorage.getItem('user_email');
  if (emailFromStorage) return emailFromStorage;

  return undefined;
};

// Helper to get user ID
const getUserId = (): string | undefined => {
  const stored = localStorage.getItem('userId');
  if (stored) return stored;
  return undefined;
};

// Audio Utilities
const floatTo16BitPCM = (float32Array: Float32Array) => {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const Voice: React.FC<VoiceScreenProps> = ({ appId, onButtonClick, isAdmin, userEmail }) => {
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [loading, setLoading] = useState(false); // Used for visualizer/listening state
  const [isMuted, setIsMuted] = useState(false);

  // Gemini / WebSocket Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const nextPlayTimeRef = useRef(0);
  const activeSources = useRef<AudioBufferSourceNode[]>([]); // Track active audio sources

  const initializedRef = useRef(false);
  const mountedRef = useRef(true);

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '8px 0',
  };

  const badgeBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: 500,
    fontSize: '14px',
  };

  const statusConfig: Record<
    string,
    { icon: JSX.Element; text: string; style: React.CSSProperties }
  > = {
    Connected: {
      icon: <Wifi size={16} color='#4CAF50' />,
      text: 'Connected',
      style: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
    },
    'Connection failed': {
      icon: <WifiOff size={16} color='#F44336' />,
      text: 'Connection Failed',
      style: { backgroundColor: '#FFEBEE', color: '#C62828' },
    },
    Connecting: {
      icon: <Loader2 size={16} color='#FFC107' className='spin' />,
      text: 'Connecting...',
      style: { backgroundColor: '#FFF8E1', color: '#FF8F00' },
    },
    Disconnected: {
      icon: <WifiOff size={16} color='#9E9E9E' />,
      text: 'Disconnected',
      style: { backgroundColor: '#F5F5F5', color: '#757575' },
    },
    default: {
      icon: <Loader2 size={16} color='#FFC107' className='spin' />,
      text: 'Connecting...',
      style: { backgroundColor: '#FFF8E1', color: '#FF8F00' },
    },
  };

  const cleanup = () => {
    try {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setConnectionStatus('Disconnected');
      setLoading(false);
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  };

  const stopAudioPlayback = () => {
    activeSources.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // ignore errors if already stopped
      }
    });
    activeSources.current = [];
    if (audioContextRef.current) {
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    if (!initializedRef.current) {
      initializedRef.current = true;
      initRealTimeSession();
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  const initRealTimeSession = async () => {
    if (isAdmin) return;
    try {
      cleanup();

      const emailToUse = userEmail || getUserEmail();
      // Expect GCS-compatible response with api_key, websocket_url, config
      const sessionData = await getVoiceSessionToken(appId, emailToUse);

      if (!sessionData.websocket_url || !sessionData.api_key) {
        throw new Error("Invalid GCS session config");
      }

      if (!mountedRef.current) return;

      const url = `${sessionData.websocket_url}?key=${sessionData.api_key}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = async () => {
        if (!mountedRef.current) return;
        setConnectionStatus('Connected');

        // Send Setup
        const setupMsg = { setup: sessionData.config };
        ws.send(JSON.stringify(setupMsg));

        // Init Audio Context & Mic
        await startAudioCapture();

        // Trigger Initial Greeting
        ws.send(JSON.stringify({
          client_content: {
            turns: [
              {
                role: "user",
                parts: [{ text: "Hello! Please greet me." }]
              }
            ],
            turn_complete: true
          }
        }));
      };

      ws.onclose = () => {
        if (mountedRef.current) setConnectionStatus('Disconnected');
      };

      ws.onerror = (err) => {
        console.error("WebSocket Error", err);
        if (mountedRef.current) setConnectionStatus('Connection failed');
      };

      ws.onmessage = async (event) => {
        try {
          let msg;
          if (event.data instanceof Blob) {
            msg = JSON.parse(await event.data.text());
          } else {
            msg = JSON.parse(event.data);
          }

          if (msg.toolCall) {
            handleToolCall(msg.toolCall, ws);
          }
          else if (msg.serverContent) {
            if (msg.serverContent.interrupted) {
              console.log("Interruption detected! Stopping playback.");
              stopAudioPlayback();
            }
            if (msg.serverContent.modelTurn) {
              const parts = msg.serverContent.modelTurn.parts;
              parts?.forEach((part: any) => {
                if (part.inlineData) {
                  playAudioChunk(part.inlineData.data);
                }
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      }

    } catch (err) {
      console.error('Voice session failed:', err);
      cleanup();
      setConnectionStatus('Connection failed');
    }
  };

  const startAudioCapture = async () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true
        }
      });
      mediaStreamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e: any) => {
        if (isMuted || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Basic VAD / Volume check for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += Math.abs(inputData[i]);
        const avg = sum / inputData.length;
        if (avg > 0.01) setLoading(true); else setLoading(false);

        const pcm16 = floatTo16BitPCM(inputData);
        const base64 = arrayBufferToBase64(pcm16);

        wsRef.current.send(JSON.stringify({
          realtime_input: {
            media_chunks: [{
              mime_type: "audio/pcm",
              data: base64
            }]
          }
        }));
      };

    } catch (e) {
      console.error("Audio Capture Error", e);
    }
  };

  const playAudioChunk = (base64Data: string) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current; // This is input ctx (16k)
    // We might need a separate ctx for output if rate differs, but browser handles resampling.
    // Gemini usually sends 24k.

    try {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const buffer = ctx.createBuffer(1, float32.length, 24000); // 24kHz
      buffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        activeSources.current = activeSources.current.filter(s => s !== source);
      };
      activeSources.current.push(source);

      const currentTime = ctx.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
      }
      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += buffer.duration;

    } catch (e) {
      console.error("Audio playback error", e);
    }
  };

  const handleToolCall = async (toolCall: any, ws: WebSocket) => {
    const functionCalls = toolCall.functionCalls;
    const functionResponses = [];

    for (const call of functionCalls) {
      const { name, args, id } = call;
      let result = {};

      try {
        if (name === 'search_knowledge_base') {
          const res = await searchVoiceKnowledge({ chatbot_id: appId, query: args.query });
          result = res;
        } else if (name === 'submit_pre_chat_form') {
          const res = await submitVoiceLead({ chatbot_id: appId, ...args });
          if (args.email) localStorage.setItem('user_email', args.email);
          result = res;
        } else if (name === 'handoff_to_support') {
          const emailToUse = args.email || getUserEmail();
          if (emailToUse) {
            const res = await handoffSupport({
              chatbot_id: appId,
              email: emailToUse,
              ...args,
              user_id: getUserId()
            });
            result = res;
          } else {
            result = { error: "Email missing" };
          }
        }
      } catch (e) {
        result = { error: String(e) };
      }

      functionResponses.push({
        id: id,
        name: name,
        response: { result: result }
      });
    }

    ws.send(JSON.stringify({
      toolResponse: {
        functionResponses: functionResponses
      }
    }));
  };

  const handleClose = () => {
    cleanup();
    onButtonClick();
  };

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const { icon, text, style } = statusConfig[connectionStatus] || statusConfig.default;

  return (
    <div className='voice-container'>
      <div style={baseStyle}>
        <div style={{ ...badgeBase, ...style }}>
          {icon}
          <span>{text}</span>
        </div>
      </div>
      <CloudWave isListening={loading} />
      <div
        style={{
          display: 'flex',
          marginTop: '70px',
          justifyContent: 'center',
          gap: '100px',
        }}
      >
        <button className='voice-btn' onClick={handleToggleMute}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isMuted ? '#e02f2f' : '#f1f1f1',
              color: isMuted ? 'white' : 'black',
              border: 'none',
              padding: '12px',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </div>
          <p style={{ padding: '4px 0 0 0', margin: 0 }}>
            {isMuted ? 'Unmute' : 'Mute'}
          </p>
        </button>
        <button
          onClick={handleClose}
          className='voice-btn'
          disabled={connectionStatus !== 'Connected' && connectionStatus !== 'Connection failed'}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: connectionStatus !== 'Connected' && connectionStatus !== 'Connection failed' ? '#ae2525' : '#e02f2f',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <X size={20} />
          </div>
          <p style={{ padding: '4px 0 0 0', margin: 0 }}>Leave</p>
        </button>
      </div>
    </div>
  );
};

export default Voice;
