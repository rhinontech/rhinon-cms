import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Minus, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import './Messenger.scss';
import { io } from 'socket.io-client';
import { getSocketUrl } from '@/services/api';

const VOICE_CALLS_ENABLED = false;
import type { Message, ChatScreenProps } from '@/types';
import { getIceServers } from '@/utils/iceConfig';

// Lazy load screens for better initial bundle size
const ChatScreen = lazy(() => import('@/screens/ChatScreen/ChatScreen'));
// ChatHistoryScreen removed - using unified chat screen instead
const HelpScreen = lazy(() => import('@/screens/HelpScreen/HelpScreen'));
const HomeScreen = lazy(() => import('@/screens/HomeScreen/HomeScreen'));
const Voice = lazy(() => import('@/screens/VoiceScreen/Voice'));
const NewsScreen = lazy(() => import('@/screens/NewsScreen/NewsScreen'));
const NewsPage = lazy(() => import('@/screens/NewsPage/NewsPage'));
const HelpAriclePage = lazy(() => import('@/screens/HelpArticlePage/HelpArticlePage'));
const Campaigns = lazy(() =>
  import('@/screens/Campaigns/Campaigns').then(module => ({ default: module.Campaigns }))
);

import { AnimatePresence, motion } from 'motion/react';

// Common components
import { Loader } from '@/components/common';

// Types
import type { SalesziumConfig } from '@/types';

// Hooks - centralized state and logic
import {
  useMessengerState,
  useCampaignLogic,
  useScreenNavigation
} from './hooks';

// Components - extracted UI pieces
import { BottomNav, MessengerFooter, ChatButton } from './components';

// Utilities
import { themeVars } from '@/utils/theme';
import useTracking from '@/utils/useTracking';
import { useChatLogic } from '@src/screens/ChatScreen/useChatLogic';
import { getSocketConversationsByUserId } from '@/services/chat/socketService';
import { ChatHistoryScreen } from '@src/screens';

interface MessengerProps {
  config?: SalesziumConfig | null;
}

const Messenger: React.FC<MessengerProps> = ({ config }) => {
  // Use centralized state management hook
  const state = useMessengerState(config);
  const [isRegistered, setIsRegistered] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState('00:00');

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // Signalling can outrun the peer connection: candidates that arrive before a
  // remote description (and an offer that arrives before the peer exists) are
  // parked here and replayed once the peer is ready.
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingOfferFromRef = useRef<string | null>(null);

  const [incomingCall, setIncomingCall] = useState<null | {
    from: string;
    fromName: string;
    fromCallId: string;
  }>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeCallName, setActiveCallName] = useState<string>('');

  // --- Audio control states ---
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const {
    isOpen,
    setIsOpen,
    activeScreen,
    setActiveScreen,
    showPopup,
    windowWidth,
    setWindowWidth,
    effectiveTheme,
    selectedChatId,
    setSelectedChatId,
    isSpeakingWithRealPerson,
    setIsSpeakingWithRealPerson,
    setIsTicketRaised,
    isEmailAvailable,
    setIsEmailAvailable,
    userEmail,
    setUserEmail,
    userId,
    selectedNews,
    setSelectedNews,
    selectedHelpArticle,
    setSelectedHelpArticle,
    selectedHelp,
    setSelectedHelp,
    isApiKeyProvided,
    freePlan,
    activeCampaign,
    setActiveCampaign,
    campaignFoundRef,
    campaignsRef,
    chatbot_config,
    showNotification,
    setShowNotification,
    mainLoading,
  } = state;

  // Shared state for external trigger detection
  const [isExternalTrigger, setIsExternalTrigger] = useState(false);

  // Use screen navigation hook
  const {
    toggleChat,
    handleNavigate,
    handleChatSelect,
    handleBackToChats,
    raiseTicket,
    handleClose,
  } = useScreenNavigation({
    state: {
      setIsOpen,
      setActiveScreen,
      setSelectedChatId,
      setIsSpeakingWithRealPerson,
      setIsExternalTrigger,
      isChatHistory: chatbot_config?.isChatHistory,
    },
  });

  // Use campaign logic hook
  useCampaignLogic({
    appId: config?.app_id || '',
    campaignsRef,
    campaignFoundRef,
    setActiveCampaign,
  });

  // chat logic
  const chatLogic = useChatLogic({
    userId,
    userEmail,
    appId: config?.app_id || '',
    conversationId: selectedChatId,
    isAdmin: config?.admin,
    chatAvatar: "https://img.freepik.com/premium-photo/beautiful-woman-with-natural-makeup-women-with-clean-fresh-skin-dark-hear-blue-eyes_150254-452.jpg?semt=ais_hybrid&w=740",
    chatbot_config,
    setSelectedChatId,
    timeoutDuration: 15 * 60 * 1000,
    setUserEmail,
    setIsEmailAvailable,
    isSpeakingWithRealPerson,
    setIsSpeakingWithRealPerson,
    onBack: handleBackToChats,
    setWindowWidth,
    postChatForm: chatbot_config?.postChatForm,
    isEmailAvailable,
    preChatForm: chatbot_config?.preChatForm,
    adminTestingMode: config?.adminTestingMode,
    activeScreen,
    setShowNotification,
    isExternalTrigger,
  });

  const {
    chatMessages,
    message,
    setMessage,
    loading,
    convoId,
    setConvoId,
    isConversationActive,
    isConversationClosed,
    reachedLimit,
    supportName,
    setSupportName,
    setChatMessages,
    supportImage,
    setSupportImage,
    showTyping,
    setShowTyping,
    isListening,
    setIsListening,
    openPostChatForm,
    lastFetchedConversationIdRef,
    socketRef,
    fileInputRef,
    typingRef,
    transcript,
    resetInactivityTimeout,
    handleSend,
    handleFileUpload,
    handleSaveEmail,
    handlePostFormSubmit,
    handleCloseChat,
    startListening,
    stopListening,
    cancelListening,
    handleSwitchToRealPerson,
    fetchChats,
    isfetching,
    startNewConversation,
    setOpenPostChatForm,
    playSound,
    conversation,
    setConversation,
  } = chatLogic;

  useEffect(() => {
    if (
      selectedChatId &&
      lastFetchedConversationIdRef.current !== selectedChatId
    ) {

      lastFetchedConversationIdRef.current = selectedChatId;
      fetchChats();
    }
  }, [selectedChatId]);

  let chatAvatar = 'https://img.freepik.com/premium-photo/beautiful-woman-with-natural-makeup-women-with-clean-fresh-skin-dark-hear-blue-eyes_150254-452.jpg?semt=ais_hybrid&w=740';



  // ====== WebSocket connection ======
  useEffect(() => {
    if (isSpeakingWithRealPerson && isConversationActive) {
      let activeConvoId = convoId;
      if (activeConvoId === 'NEW_CHAT') {
        activeConvoId = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}`;
      }

      const socket = io(getSocketUrl(), {
        query: {
          user_email: userEmail,
          chatbot_id: config?.app_id,
          conversation_id: activeConvoId,
          user_id: userId,
        },
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to real-person chat');

        if (activeConvoId && activeConvoId !== 'NEW_CHAT') {
          socket.emit('join_conversation', {
            chatbot_history: activeConvoId,
            chatbot_id: config?.app_id,
          });
        }

        if (convoId === 'NEW_CHAT' && isSpeakingWithRealPerson) {
          const firstMessage: Message = {
            user_email: userEmail,
            user_id: userId,
            chatbot_id: config?.app_id,
            role: 'trigger',
            text: 'start the conversation..',
            chatbot_history: activeConvoId,
            timestamp: new Date().toISOString(),
          };
          setConvoId(activeConvoId);
          socket.emit('message', firstMessage);
        }
      });

      socket.on('message', (incoming: Message) => {
        setSupportName((prevName) => {
          if (incoming.sender_name && incoming.sender_name !== prevName) {
            return incoming.sender_name;
          }
          return prevName;
        });
        playSound();

        setShowNotification(true);


        setSupportImage((prevImage) => {
          if (
            incoming.sender_image !== null &&
            incoming.sender_image !== prevImage
          ) {
            return incoming.sender_image;
          } else if (incoming.sender_image === '') {
            return chatAvatar;
          }
          return prevImage;
        });

        if (incoming.chatbot_history === activeConvoId) {
          // Fix: Prevent duplicate messages for user's own messages
          if (incoming.role === 'user') return;

          setChatMessages((prev) => [...prev, incoming]);
          resetInactivityTimeout();

          // Fetch conversation if it's the first support message and conversation is null
          if (conversation === null && incoming.role === 'support') {
            console.log('First support message received, fetching conversation...');
            (async () => {
              try {
                const resultSocket = await getSocketConversationsByUserId(
                  userId,
                  config?.app_id,
                  activeConvoId,
                );
                if (resultSocket) {
                  setConversation(resultSocket);
                  console.log('Conversation set:', resultSocket);
                }
              } catch (error) {
                console.error('Error fetching conversation:', error);
              }
            })();
          }
        }
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from real-person chat');
      });

      return () => {
        socket.off('message');
        socket.disconnect();
      };
    }
  }, [isSpeakingWithRealPerson, userId, config?.app_id, convoId, isConversationActive]);

  // useEffect(() => {
  //   console.log("selectedChatId", selectedChatId)

  // }, [selectedChatId])

  // ======= calling logic =======
  // Voice calls (WebRTC) are not offered, so this socket is never opened.
  useEffect(() => {
    if (!VOICE_CALLS_ENABLED) return;
    const newSocket = io(getSocketUrl());
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(' Connected:', newSocket.id);

      // Auto-register with userId as callId
      if (userId) {
        newSocket.emit('register_manual', {
          callId: userId,
          username: 'Visitor',
        });
        console.log(`Auto-registering Visitor with ID: ${userId}`);
      }
    });

    newSocket.on('registered_manual', ({ callId }) => {
      setIsRegistered(true);
      console.log(`Registered with Call ID: ${callId}`);
    });

    // Incoming call
    newSocket.on('call_request_manual', ({ from, fromName, fromCallId }) => {
      console.log(`Incoming call from ${fromName} (${fromCallId})`);
      setIncomingCall({ from, fromName, fromCallId });
    });

    // ICE + offer handlers
    newSocket.on('offer_manual', async ({ offer, from }) => {
      if (!peerRef.current) {
        // The offer can beat handleAcceptCall's peer setup; keep it and let
        // handleAcceptCall answer it rather than dropping the call on the floor.
        pendingOfferRef.current = offer;
        pendingOfferFromRef.current = from;
        return;
      }
      await answerOffer(newSocket, offer, from);
    });

    newSocket.on('ice_candidate_manual', ({ candidate }) => {
      if (!candidate) return;
      const peer = peerRef.current;
      // addIceCandidate throws if there is no remote description yet, so queue
      // until the offer/answer exchange has completed.
      if (!peer || !peer.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      peer.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) => {
        console.error('Failed to add ICE candidate:', err);
      });
    });

    newSocket.on('call_ended_manual', () => {
      console.log('Call ended by other side');
      setIsInCall(false);
      setIsConnecting(false);
      setIncomingCall(null);
      setCallStartTime(null);
      pendingCandidatesRef.current = [];
      pendingOfferRef.current = null;
      pendingOfferFromRef.current = null;

      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  const flushPendingCandidates = async () => {
    const peer = peerRef.current;
    if (!peer || !peer.remoteDescription) return;
    const queued = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const candidate of queued) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Failed to add queued ICE candidate:', err);
      }
    }
  };

  const answerOffer = async (
    activeSocket: ReturnType<typeof io>,
    offer: RTCSessionDescriptionInit,
    from: string,
  ) => {
    const peer = peerRef.current;
    if (!peer) return;
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    activeSocket.emit('answer_manual', { answer, to: from });
    // Candidates queued while we had no remote description are addable now.
    await flushPendingCandidates();
  };

  const handleAcceptCall = async () => {
    if (!incomingCall || !socket) return;
    const { from } = incomingCall;
    if (activeScreen === 'voice') {
      setActiveScreen('home')
    }

    console.log('Accepting call from:', from);

    // Step 1: Ask for microphone permission FIRST
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error('Mic access error:', err);
      alert('Please allow microphone access to accept the call.');
      return;
    }

    // Step 2: Only after permission granted — proceed with connection
    const peer = new RTCPeerConnection({ iceServers: getIceServers() });
    peerRef.current = peer;

    localStreamRef.current = stream;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate)
        socket.emit('ice_candidate_manual', {
          candidate: e.candidate,
          to: from,
        });
    };

    // Surface connection failures instead of showing a running timer in silence.
    peer.oniceconnectionstatechange = () => {
      const state = peer.iceConnectionState;
      console.log('ICE connection state:', state);

      if (state === 'connected' || state === 'completed') {
        setIsConnecting(false);
        setCallStartTime((prev) => prev ?? Date.now());
      } else if (state === 'failed') {
        console.error('ICE failed - no audio route could be established.');
        setIsConnecting(false);
        handleEndCall();
      } else if (state === 'disconnected') {
        setIsConnecting(true);
      }
    };

    peer.ontrack = (e) => {
      console.log('Remote audio received:', e.streams[0]);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.autoplay = true;
      } else {
        const audio = new Audio();
        audio.srcObject = e.streams[0];
        audio.autoplay = true;
        audio.muted = false;
        document.body.appendChild(audio);
        remoteAudioRef.current = audio;
      }
    };

    // Step 3: Update state & notify server. Media is not flowing until ICE
    // connects - oniceconnectionstatechange clears isConnecting and starts the timer.
    setIncomingCall(null);
    setIsInCall(true);
    setIsConnecting(true);
    setActiveCallName(incomingCall.fromName || incomingCall.fromCallId || 'Support Agent');
    setCallStartTime(null);
    setIsMuted(false);
    setIsSpeakerOn(true);

    socket.emit('call_accepted_manual', { to: from });

    // If the offer beat this setup, answer it now that the peer exists.
    const queuedOffer = pendingOfferRef.current;
    const queuedOfferFrom = pendingOfferFromRef.current;
    pendingOfferRef.current = null;
    pendingOfferFromRef.current = null;
    if (queuedOffer && queuedOfferFrom) {
      await answerOffer(socket, queuedOffer, queuedOfferFrom);
    }
  };

  const handleRejectCall = () => {
    if (!incomingCall || !socket) return;
    const { from } = incomingCall;
    console.log('Rejected call from:', from);
    socket.emit('call_rejected_manual', { to: from });
    setIncomingCall(null);

    // Stop mic if it was accessed
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  const handleEndCall = () => {
    console.log('Ending call...');

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
      remoteAudioRef.current.muted = false;
    }

    if (socket) socket.emit('end_call_manual');

    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
    pendingOfferFromRef.current = null;

    setIsInCall(false);
    setIsConnecting(false);
    setCallStartTime(null);
    setIsMuted(false);
    setIsSpeakerOn(true);
    console.log('Call ended and audio reset');
  };

  // ====== Call Timer ======
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

  // Lock body scroll when chat is open on mobile
  useEffect(() => {
    const handleScrollLock = () => {
      const isMobile = window.innerWidth <= 480;
      if (isOpen && isMobile) {
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none'; // Prevent touch scrolling on body
      } else {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      }
    };

    handleScrollLock(); // Initial check
    window.addEventListener('resize', handleScrollLock);

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      window.removeEventListener('resize', handleScrollLock);
    };
  }, [isOpen]);



  // Compute tracking flag
  // Presence only (see useTracking) — on for every plan; off in the admin preview.
  const shouldTrack = !config?.admin;
  useTracking(config?.app_id, shouldTrack);

  // Navigation options from config
  // Voice is not offered (no Gemini Live backend), whatever an old config says.
  const navigationOptions = (chatbot_config?.navigationOptions || ['Home', 'Messages', 'Help']).filter(
    (option: string) => option !== 'Voice'
  );

  // Check if bottom nav should be hidden
  const shouldHideBottomNav = (
    (activeScreen === 'chats' && selectedChatId) ||
    (activeScreen === 'news' && selectedNews) ||
    activeScreen === 'raiseTicket' ||
    (activeScreen === 'help' && selectedHelpArticle) ||
    activeScreen === 'voice'
  );

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'home':
        return (
          <HomeScreen
            onNavigate={handleNavigate}
            isFreePlan={freePlan}
            isAdmin={config?.admin}
            appId={config?.app_id || ''}
            userId={userId}
            userEmail={userEmail}
            setSelectedChatId={setSelectedChatId}
            chatbot_config={chatbot_config}
            setIsTicketRaised={setIsTicketRaised}
            ticketForm={chatbot_config?.ticketForm}
            onChatSelect={handleChatSelect}
            mainLoading={mainLoading}
            showNotification={showNotification}
          />
        );
      case 'chats':
        // Always show unified ChatScreen directly (like WhatsApp)
        // Use 'NEW_CHAT' if no conversation selected
        if (!selectedChatId) {
          return (
            <ChatHistoryScreen
              isFreePlan={freePlan}
              onChatSelect={handleChatSelect}
              setIsSpeakingWithRealPerson={setIsSpeakingWithRealPerson}
              userId={userId}
              appId={config?.app_id || ''}
              chatbot_config={chatbot_config}
              isAdmin={config?.admin}

            />
          )
        }
        return (
          <ChatScreen
            isAdmin={config?.admin}
            isFreePlan={freePlan}
            onNavigate={handleNavigate}
            isEmailAvailable={isEmailAvailable}
            setIsEmailAvailable={setIsEmailAvailable}
            isSpeakingWithRealPerson={isSpeakingWithRealPerson}
            setIsSpeakingWithRealPerson={setIsSpeakingWithRealPerson}
            onBack={handleBackToChats}
            appId={config?.app_id || ''}
            userId={userId}
            setUserEmail={setUserEmail}
            userEmail={userEmail}
            conversationId={selectedChatId || 'NEW_CHAT'}
            setSelectedChatId={setSelectedChatId}
            chatbot_config={chatbot_config}
            preChatForm={chatbot_config?.preChatForm}
            raiseTicket={raiseTicket}
            postChatForm={chatbot_config?.postChatForm}
            setIsTicketRaised={setIsTicketRaised}
            ticketForm={chatbot_config?.ticketForm}
            setWindowWidth={setWindowWidth}
            adminTestingMode={config?.adminTestingMode}
            chatMessages={chatMessages}
            message={message}
            setMessage={setMessage}
            loading={loading}
            convoId={convoId}
            setConvoId={setConvoId}
            isConversationActive={isConversationActive}
            isConversationClosed={isConversationClosed}
            reachedLimit={reachedLimit}
            supportName={supportName}
            setSupportName={setSupportName}
            supportImage={supportImage}
            setSupportImage={setSupportImage}
            setChatMessages={setChatMessages}
            showTyping={showTyping}
            setShowTyping={setShowTyping}
            isListening={isListening}
            setIsListening={setIsListening}
            openPostChatForm={openPostChatForm}
            lastFetchedConversationIdRef={lastFetchedConversationIdRef}
            socketRef={socketRef}
            fileInputRef={fileInputRef}
            typingRef={typingRef}
            transcript={transcript}
            resetInactivityTimeout={resetInactivityTimeout}
            handleSend={handleSend}
            handleFileUpload={handleFileUpload}
            handleSaveEmail={handleSaveEmail}
            handlePostFormSubmit={handlePostFormSubmit}
            handleCloseChat={handleCloseChat}
            startListening={startListening}
            stopListening={stopListening}
            cancelListening={cancelListening}
            handleSwitchToRealPerson={handleSwitchToRealPerson}
            fetchChats={fetchChats}
            isfetching={isfetching}
            startNewConversation={startNewConversation}
            setOpenPostChatForm={setOpenPostChatForm}
            playSound={playSound}
            setShowNotification={setShowNotification}
            showNotification={showNotification}
            mainLoading={mainLoading}
            conversation={conversation}
          />
        );
      case 'voice':
        return (
          <Voice
            appId={config?.app_id || ''}
            onButtonClick={() => setActiveScreen('home')}
            isAdmin={config?.admin}
            userEmail={userEmail}
          />
        );
      case 'help':
        if (selectedHelpArticle) {
          return (
            <HelpAriclePage
              chatbot_config={chatbot_config}
              setWindowWidth={setWindowWidth}
              setSelectedHelpArticle={setSelectedHelpArticle}
              selectedHelpArticle={selectedHelpArticle}
            />
          );
        }
        return (
          <HelpScreen
            onNavigate={handleNavigate}
            setSelectedHelpArticle={setSelectedHelpArticle}
            chatbot_config={chatbot_config}
            selectedHelp={selectedHelp}
            setSelectedHelp={setSelectedHelp}
            appId={config?.app_id}
          />
        );
      case 'news':
        if (selectedNews) {
          return (
            <NewsPage
              setWindowWidth={setWindowWidth}
              setSelectedNews={setSelectedNews}
              selectedNews={selectedNews}
              chatbot_config={chatbot_config}
            />
          );
        }
        return (
          <NewsScreen
            setSelectedNews={setSelectedNews}
            chatbot_config={chatbot_config}
          />
        );
      default:
        // Default to unified chat screen instead of history
        return (
          <ChatScreen
            isAdmin={config?.admin}
            isFreePlan={freePlan}
            onNavigate={handleNavigate}
            isEmailAvailable={isEmailAvailable}
            setIsEmailAvailable={setIsEmailAvailable}
            isSpeakingWithRealPerson={isSpeakingWithRealPerson}
            setIsSpeakingWithRealPerson={setIsSpeakingWithRealPerson}
            onBack={handleBackToChats}
            appId={config?.app_id || ''}
            userId={userId}
            setUserEmail={setUserEmail}
            userEmail={userEmail}
            conversationId={selectedChatId || 'NEW_CHAT'}
            setSelectedChatId={setSelectedChatId}
            chatbot_config={chatbot_config}
            preChatForm={chatbot_config?.preChatForm}
            raiseTicket={raiseTicket}
            postChatForm={chatbot_config?.postChatForm}
            setIsTicketRaised={setIsTicketRaised}
            ticketForm={chatbot_config?.ticketForm}
            setWindowWidth={setWindowWidth}
            adminTestingMode={config?.adminTestingMode}
            chatMessages={chatMessages}
            message={message}
            setMessage={setMessage}
            loading={loading}
            convoId={convoId}
            setConvoId={setConvoId}
            isConversationActive={isConversationActive}
            isConversationClosed={isConversationClosed}
            reachedLimit={reachedLimit}
            supportName={supportName}
            setSupportName={setSupportName}
            supportImage={supportImage}
            setSupportImage={setSupportImage}
            setChatMessages={setChatMessages}
            showTyping={showTyping}
            setShowTyping={setShowTyping}
            isListening={isListening}
            setIsListening={setIsListening}
            openPostChatForm={openPostChatForm}
            lastFetchedConversationIdRef={lastFetchedConversationIdRef}
            socketRef={socketRef}
            fileInputRef={fileInputRef}
            typingRef={typingRef}
            transcript={transcript}
            resetInactivityTimeout={resetInactivityTimeout}
            handleSend={handleSend}
            handleFileUpload={handleFileUpload}
            handleSaveEmail={handleSaveEmail}
            handlePostFormSubmit={handlePostFormSubmit}
            handleCloseChat={handleCloseChat}
            startListening={startListening}
            stopListening={stopListening}
            cancelListening={cancelListening}
            handleSwitchToRealPerson={handleSwitchToRealPerson}
            fetchChats={fetchChats}
            isfetching={isfetching}
            startNewConversation={startNewConversation}
            setOpenPostChatForm={setOpenPostChatForm}
            playSound={playSound}
            setShowNotification={setShowNotification}
            showNotification={showNotification}
            mainLoading={mainLoading}
            conversation={conversation}
          />
        );
    }
  };

  return (
    <div
      className={`chatbot-container ${config?.admin ? 'admin-align' : ''}`}
      data-theme={effectiveTheme}
      style={{
        ...themeVars,
        ['--primary-color' as string]: chatbot_config?.primaryColor || '#1403ac',
        ['--secondary-color' as string]: chatbot_config?.secondaryColor || '#f3f6ff',
      }}
    >
      {/* Campaign Popup */}
      {!isOpen && showPopup && chatbot_config?.popupMessage && activeCampaign && (
        <Suspense fallback={null}>
          <Campaigns
            setIsOpen={(val) => {
              if (val === false) {
                setActiveCampaign(undefined);
              } else {
                setIsOpen(val);
              }
            }}
            activeCampaign={activeCampaign}
          />
        </Suspense>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {(isOpen || config?.admin) && (
          config?.admin ? (
            // Admin mode: no animation
            <div
              className='chat-window'
              style={{ ['--set-width' as string]: windowWidth }}
              role="dialog"
              aria-label="Chat window"
            >
              <div className='screen-wrapper'>
                <Suspense fallback={<div className="screen-loading"><Loader /></div>}>
                  {renderActiveScreen()}
                </Suspense>
              </div>

              {/* Bottom Navigation */}
              {!shouldHideBottomNav && (
                <BottomNav
                  navigationOptions={navigationOptions}
                  activeScreen={activeScreen}
                  chatbot_config={chatbot_config}
                  freePlan={freePlan}
                  onNavigate={handleNavigate}
                />
              )}

              <MessengerFooter effectiveTheme={effectiveTheme} />
            </div>
          ) : (
            // Normal mode: with animation
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className='chat-window'
              style={{ ['--set-width' as string]: windowWidth }}
              role="dialog"
              aria-label="Chat window"
            >
              {incomingCall && (
                <div
                  className='overlay'

                >
                  <motion.div
                    className='incoming-call-overlay'
                    style={{
                      position: 'absolute',
                      top: '24px',
                      left: '50%',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '24px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                      padding: '24px',
                      zIndex: 2000,
                      textAlign: 'center',
                      width: '70%',
                      maxWidth: '320px',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                    initial={{ opacity: 0, y: -50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: -50, x: '-50%' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        color: '#6b7280',
                        fontWeight: '700'
                      }}>
                        Incoming Call
                      </span>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#111827',
                        margin: 0,
                        lineHeight: '1.3'
                      }}>
                        {incomingCall.fromName || 'Unknown Caller'} <br /> <span style={{ fontSize: '15px', color: '#6b7280' }}>{incomingCall.fromCallId}</span>
                      </h3>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '32px',
                      width: '100%',
                      justifyContent: 'center',
                      marginTop: '8px'
                    }}>
                      <button
                        onClick={handleRejectCall}
                        title="Decline"
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: '#fee2e2',
                          color: '#ef4444',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <PhoneOff size={24} />
                      </button>

                      <button
                        onClick={handleAcceptCall}
                        title="Accept"
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                          animation: 'pulse 2s infinite'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Phone size={24} />
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* ====== In-Call Overlay ====== */}
              {isInCall && (
                <div
                  className='overlay'

                >
                  <motion.div
                    className='in-call-overlay'
                    style={{
                      position: 'absolute',
                      top: '24px',
                      left: '50%',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '24px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                      padding: '24px',
                      zIndex: 2000,
                      textAlign: 'center',
                      width: '70%',
                      maxWidth: '320px',
                      border: '1px solid rgba(255, 255, 255, 0.5)'
                    }}
                    initial={{ opacity: 0, y: -50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: -50, x: '-50%' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        marginBottom: '16px'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isConnecting ? '#f59e0b' : '#10b981',
                          boxShadow: isConnecting
                            ? '0 0 0 2px rgba(245, 158, 11, 0.2)'
                            : '0 0 0 2px rgba(16, 185, 129, 0.2)',
                          animation: 'pulse 2s infinite'
                        }} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: isConnecting ? '#b45309' : '#059669', letterSpacing: '0.5px' }}>
                          {isConnecting ? 'CONNECTING' : 'LIVE CALL'}
                        </span>
                      </div>

                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 4px 0'
                      }}>
                        {activeCallName || 'Support Agent'}
                      </h3>

                      <div style={{
                        fontSize: '32px',
                        fontWeight: '300',
                        color: '#374151',
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-1px'
                      }}>
                        {isConnecting ? '--:--' : callDuration}
                      </div>
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '24px' }}>
                      <button
                        title={isMuted ? "Unmute" : "Mute"}
                        onClick={() => {
                          if (localStreamRef.current) {
                            localStreamRef.current.getAudioTracks().forEach((t) => {
                              t.enabled = !t.enabled;
                            });
                            setIsMuted((prev) => !prev);
                          }
                        }}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: isMuted ? '#fee2e2' : '#f3f4f6',
                          color: isMuted ? '#ef4444' : '#4b5563',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>

                      <button
                        title={isSpeakerOn ? "Turn Speaker Off" : "Turn Speaker On"}
                        onClick={() => {
                          setIsSpeakerOn((prev) => {
                            const newVal = !prev;
                            if (remoteAudioRef.current)
                              remoteAudioRef.current.muted = !newVal;
                            return newVal;
                          });
                        }}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: isSpeakerOn ? '#d1fae5' : '#f3f4f6',
                          color: isSpeakerOn ? '#059669' : '#4b5563',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                      </button>

                      <button
                        title="End Call"
                        onClick={handleEndCall}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: '#fee2e2',
                          color: '#ef4444',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <PhoneOff size={20} />
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              <div className='chat-bot-header'>
                <button
                  className='chat-bot-header-button'
                  onClick={handleClose}
                  aria-label="Minimize chat"
                >
                  <Minus aria-hidden="true" />
                </button>
              </div>

              <div className='screen-wrapper'>
                <Suspense fallback={<div className="screen-loading"><Loader /></div>}>
                  {renderActiveScreen()}
                </Suspense>
              </div>

              {/* Bottom Navigation */}
              {!shouldHideBottomNav && (
                <BottomNav
                  navigationOptions={navigationOptions}
                  activeScreen={activeScreen}
                  chatbot_config={chatbot_config}
                  freePlan={freePlan}
                  onNavigate={handleNavigate}
                />
              )}

              <MessengerFooter effectiveTheme={effectiveTheme} />
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* Chat Button */}
      <ChatButton
        chatbot_config={chatbot_config}
        isOpen={isOpen}
        isAdmin={config?.admin || false}
        freePlan={freePlan}
        isApiKeyProvided={isApiKeyProvided}
        onToggle={toggleChat}
        onClose={handleClose}
        showNotification={showNotification}
      />
    </div>
  );
};

export default Messenger;
