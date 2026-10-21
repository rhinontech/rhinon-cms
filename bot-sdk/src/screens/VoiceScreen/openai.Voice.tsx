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
  // 1. URL Params
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get('email');
  if (emailFromUrl) return emailFromUrl;

  // 2. Local Storage
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

const Voice: React.FC<VoiceScreenProps> = ({ appId, onButtonClick, isAdmin, userEmail }) => {
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [loading, setLoading] = useState(false);

  const [isMuted, setIsMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const initializedRef = useRef(false);

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
    default: {
      icon: <Loader2 size={16} color='#FFC107' className='spin' />,
      text: 'Connecting...',
      style: { backgroundColor: '#FFF8E1', color: '#FF8F00' },
    },
  };

  const mountedRef = useRef(true); // Track mount status

  //Cleanup function (safe to call multiple times)
  const cleanup = () => {
    try {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
        if (remoteAudioRef.current.parentNode) {
          remoteAudioRef.current.parentNode.removeChild(remoteAudioRef.current);
        }
        remoteAudioRef.current = null;
      }
      setConnectionStatus('Disconnected');
      setLoading(false);
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  };

  //Initialize once
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

  // ... (Other useEffects remain same) ...

  // Initialize WebRTC real-time session
  const initRealTimeSession = async () => {
    if (isAdmin) return;
    try {
      cleanup(); // close any old connection

      const emailToUse = userEmail || getUserEmail();
      const { client_secret } = await getVoiceSessionToken(appId, emailToUse);

      // Check if unmounted during await
      if (!mountedRef.current) return;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Local mic stream
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Check if unmounted during await
      if (!mountedRef.current) {
        localStream.getTracks().forEach(track => track.stop());
        pc.close();
        return;
      }

      localStreamRef.current = localStream;
      localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStream));

      // Remote audio
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      document.body.appendChild(audioEl); // 🔥 Attach to maximize compatibility
      remoteAudioRef.current = audioEl;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
        audioEl.play().catch((e) => console.error('Autoplay failed:', e));
        setLoading(false);
      };

      // Data channel
      const dataChannel = pc.createDataChannel('oai-events');
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        if (!mountedRef.current) return;
        setConnectionStatus('Connected');
        // Trigger AI to speak first
        const responseCreate = {
          type: "response.create",
          response: {
            modalities: ["text", "audio"],
            instructions: "Greet the user warmly based on the instructions.",
          }
        };
        dataChannel.send(JSON.stringify(responseCreate));
      };
      dataChannel.onclose = () => setConnectionStatus('Disconnected');
      dataChannel.onerror = (err) => console.error('DataChannel Error:', err);

      dataChannel.onmessage = async (event) => {
        try {
          const payload = JSON.parse(event.data);

          // Debugging
          console.log("Realtime Event:", payload.type, payload);

          if (
            payload.type.includes('input_audio_buffer') ||
            payload.type.includes('output_audio_buffer.stopped')
          ) {
            setLoading(true);
          } else if (payload.type.includes('output_audio_buffer.started')) {
            setLoading(false);
          }

          // Handle Function Calls (Tools)
          if (payload.type === 'response.function_call_arguments.done') {
            const functionName = payload.name;
            const callId = payload.call_id;
            const argsString = payload.arguments;

            if (functionName === 'submit_pre_chat_form') {
              console.log("📝 Tool Triggered: submit_pre_chat_form", argsString);

              try {
                const args = JSON.parse(argsString);

                // 1. Call Backend to Save Lead
                const result = await submitVoiceLead({
                  chatbot_id: appId,
                  email: args.email,
                  name: args.name,
                  phone: args.phone
                });

                // Save email to local storage for future sessions
                if (args.email) {
                  localStorage.setItem('user_email', args.email);
                }

                console.log("✅ Lead Saved:", result);

                // 2. Send Tool Output back to OpenAI (Required to continue flow)
                const toolOutput = {
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: callId,
                    output: JSON.stringify(result) // Return success message
                  }
                };
                dataChannel.send(JSON.stringify(toolOutput));

                // 3. Trigger Bot Response (to say "Thanks!")
                const responseCreate = {
                  type: "response.create"
                };
                dataChannel.send(JSON.stringify(responseCreate));

              } catch (e) {
                console.error("Error processing tool call:", e);
              }
            } else if (functionName === 'search_knowledge_base') {
              console.log("🔍 Tool Triggered: search_knowledge_base", argsString);

              try {
                const args = JSON.parse(argsString);

                // 1. Call Backend to Search
                const result = await searchVoiceKnowledge({
                  chatbot_id: appId,
                  query: args.query
                });

                console.log("✅ Knowledge Found:", result);

                // 2. Send Tool Output back
                const toolOutput = {
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: callId,
                    output: JSON.stringify(result) // Return chunks
                  }
                };
                dataChannel.send(JSON.stringify(toolOutput));

                // 3. Trigger Bot Response
                const responseCreate = {
                  type: "response.create"
                };
                dataChannel.send(JSON.stringify(responseCreate));

              } catch (e) {
                console.error("Error processing search tool:", e);
              }
            } else if (functionName === 'handoff_to_support') {
              console.log("🤝 Tool Triggered: handoff_to_support", argsString);

              try {
                const args = JSON.parse(argsString);

                // Prioritize email from tool args, fallback to storage
                const emailToUse = args.email || getUserEmail();

                let result: any = { result: "Handoff initiated." };

                if (emailToUse) {
                  const handoffRes = await handoffSupport({
                    chatbot_id: appId,
                    email: emailToUse,
                    name: args.name,
                    phone: args.phone,
                    urgency: args.urgency,
                    user_id: getUserId()
                  });
                  console.log("✅ Handoff Result:", handoffRes);
                  result = handoffRes;
                } else {
                  console.warn("⚠️ No email found for handoff.");
                  result = { error: "Email missing. Please provide email." };
                }

                // 2. Send Tool Output back
                const toolOutput = {
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: callId,
                    output: JSON.stringify(result)
                  }
                };
                dataChannel.send(JSON.stringify(toolOutput));

                // 3. Trigger Bot Response
                const responseCreate = {
                  type: "response.create"
                };
                dataChannel.send(JSON.stringify(responseCreate));

              } catch (e) {
                console.error("Error processing handoff tool:", e);
              }
            }
          }

        } catch (err) {
          console.error('Message parsing error:', err);
        }
      };

      // Offer/Answer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Connect to OpenAI Realtime API using the session token from backend
      // IMPORTANT: No model parameter - this tells OpenAI to use the existing session
      // that was created by the backend (which has tools and instructions configured)
      const response = await fetch(
        `https://api.openai.com/v1/realtime`,
        {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${client_secret.value}`,
            'Content-Type': 'application/sdp',
          },
        },
      );

      const answerSDP = await response.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSDP });

      setConnectionStatus('Connected');
    } catch (err) {
      console.error('Voice session failed:', err);
      cleanup();
      setConnectionStatus('Connection failed');
    }
  };
  const handleClose = () => {
    cleanup();
    onButtonClick();
  };
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      setIsMuted((prevMuted) => {
        const newMuted = !prevMuted;
        localStreamRef.current?.getAudioTracks().forEach((track) => {
          track.enabled = !newMuted; // disable mic if muted
        });
        return newMuted;
      });
    }
  };
  const { icon, text, style } =
    statusConfig[connectionStatus] || statusConfig.default;

  return (
    <div className='voice-container'>
      {/* <h3
        className='voice-status'
        style={{
          width: '100%',
          fontSize: 14,
          fontWeight: 500,
          color: connectionStatus === 'Connected' ? '#4CAF50' : '#FF5722',
          background: '#f1f1f1',
          padding: '10px 20px',
          margin: 0,
        }}
      >
        Status: {connectionStatus}
      </h3> */}
      {/* <h3
        style={{
          textAlign: 'center',
          fontSize: 42,
          margin: '40px 0 20px 0',
          display:'flex',
          gap:"10px"
        }}
      >
        Talk to 
        <img
          src='https://www.saleszium.com/assets/bot.png'
          alt='artical-img'
          width={50}
          style={{ borderRadius: '8px', marginTop:'-10px'  }}
        />
      </h3> */}
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
          disabled={
            connectionStatus !== 'Connected' &&
            connectionStatus !== 'Connection failed'
          }
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                connectionStatus !== 'Connected' &&
                  connectionStatus !== 'Connection failed'
                  ? '#ae2525'
                  : '#e02f2f',
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
