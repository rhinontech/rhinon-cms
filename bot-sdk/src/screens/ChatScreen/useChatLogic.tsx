import { NOTIFICATION_SOUND } from '@/constants/urls';
import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';

// New imports from restructured modules
import type { Message, ChatWithAssistantRequest } from '@/types';
import { chatWithAssistant, getChatHistory } from '@/services/chat';
import {
  closeSocketConversation,
  getSocketConversationsByUserId,
  submitPostChatForm
} from '@/services/chat/socketService';
import { uploadConversationFile } from '@/services/chat/fileService';
import { savePreChatCustomValue } from '@/services/config/formService';



export type { Message, ChatWithAssistantRequest };

export const useChatLogic = ({
  userId,
  userEmail,
  appId,
  conversationId,
  isAdmin,
  chatAvatar,
  chatbot_config,
  setSelectedChatId,
  timeoutDuration = 15 * 60 * 1000,
  onConversationTimeout,
  setUserEmail,
  setIsEmailAvailable,
  isSpeakingWithRealPerson,
  setIsSpeakingWithRealPerson,
  onBack,
  setWindowWidth,
  postChatForm,
  preChatForm,
  isEmailAvailable,
  adminTestingMode,
  activeScreen,
  setShowNotification,
}: any) => {
  const [conversation, setConversation] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  const [loading, setLoading] = useState(false);
  const [convoId, setConvoId] = useState(conversationId);
  const [isfetching, setIsFetching] = useState(false);
  const [isConversationActive, setIsConversationActive] =
    useState<boolean>(true);
  const [isConversationClosed, setIsConversationClosed] = useState(false);
  const [reachedLimit, serReachedLimit] = useState(false);
  const [supportName, setSupportName] = useState<string>(
    chatbot_config.chatbotName,
  );
  // This hook mounts before the server config arrives, so the initial name is
  // the built-in default. Follow the bot's real name until an agent's name
  // replaces it (an agent's name is never equal to the previous bot name).
  const botNameRef = useRef(chatbot_config.chatbotName);
  useEffect(() => {
    const previous = botNameRef.current;
    botNameRef.current = chatbot_config.chatbotName;
    setSupportName((current) => (current === previous ? chatbot_config.chatbotName : current));
  }, [chatbot_config.chatbotName]);
  const [supportImage, setSupportImage] = useState<string | null>(null);
  const [showTyping, setShowTyping] = useState<boolean>(false);
  const [isListening, setIsListening] = useState(false);
  const [openPostChatForm, setOpenPostChatForm] = useState(false);
  const [isPostChatSubmitted, setIsPostChatSubmitted] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  // REF to hold instant value for time-sensitive checks (avoid async state race)
  const isPostChatSubmittedRef = useRef<boolean>(false);

  const lastFetchedConversationIdRef = useRef<string | null>(null);
  const socketRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const hasTimedOutRef = useRef<boolean>(false);
  const lastMessageTimeRef = useRef<Date>(new Date());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingRef = useRef<HTMLDivElement | null>(null);

  const { transcript, resetTranscript } = useSpeechRecognition();

  // sound effect on receive message
  const audioRef = useRef<HTMLAudioElement | null>(null);


  // Unlock audio + speech permissions on first click
  useEffect(() => {
    setConvoId(conversationId);
  }, [conversationId]);



  useEffect(() => {
    const unlock = () => {
      try {
        speechSynthesis.getVoices();
        audioRef.current = new Audio(NOTIFICATION_SOUND);
        audioRef.current.volume = 0.7;
        audioRef.current.load();

        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        if (ctx.state === "suspended") ctx.resume();

        console.log("🔓 Audio + Speech unlocked");
      } catch (err) {
        console.error("Audio unlock error:", err);
      }
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);
  }, []);


  // Play sound safely
  function playSound() {
    if (!audioRef.current) return;

    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => console.log(" Sound played"))
      .catch((err) => console.warn("Sound play blocked:", err));
  }




  // ====== Timeout Management ======
  const resetInactivityTimeout = () => {
    if (hasTimedOutRef.current) return;

    lastMessageTimeRef.current = new Date();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (!isConversationActive) return;

    timeoutRef.current = setTimeout(() => {
      handleConversationTimeout();
    }, timeoutDuration);

    countdownRef.current = setInterval(() => {
      if (hasTimedOutRef.current) {
        clearInterval(countdownRef.current!);
        return;
      }

      const now = new Date();
      const elapsed = now.getTime() - lastMessageTimeRef.current.getTime();
      const remaining = Math.max(0, timeoutDuration - elapsed);

      if (remaining === 0) {
        clearInterval(countdownRef.current!);
        handleConversationTimeout();
      }
    }, 1000);
  };

  const checkConversationActivity = () => {
    const now = Date.now();
    const lastMessageTime = lastMessageTimeRef.current.getTime();
    const timeSinceLastMessage = now - lastMessageTime;

    if (timeSinceLastMessage > timeoutDuration) {
      handleConversationTimeout();
      return false;
    }
    return true;
  };

  const handleConversationTimeout = async () => {
    if (hasTimedOutRef.current) return;
    if (!isSpeakingWithRealPerson) return;
    hasTimedOutRef.current = true;


    setIsConversationActive(false);

    // Use ref here to avoid async state race
    if (
      !isPostChatSubmittedRef.current &&
      postChatForm &&
      postChatForm?.enabled &&
      postChatForm?.elements?.length
    ) {
      setOpenPostChatForm(true);
    }

    const timeoutMessage: Message = {
      role: 'timeout',
      text: 'This conversation has been closed due to inactivity or customer closed the conversation. Please start a new conversation if you need further assistance.',
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, timeoutMessage]);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (socketRef.current) socketRef.current.disconnect();

    try {
      if (conversation?.id) {
        await closeSocketConversation(conversation.id);
      }
    } catch (error) {
      console.error('Error closing conversation on server', error);
    }

    onConversationTimeout?.();
  };

  // ====== Fetch chat history ======
  const fetchChats = async () => {
    setIsFetching(true);
    setIsConversationClosed(false);
    setIsConversationActive(true);
    setIsSpeakingWithRealPerson(false);
    //setChatMessages([]);

    const requestBody = {
      user_id: userId,
      chatbot_id: appId,
      conversation_id: conversationId,
    };

    try {
      let chatHistory: Message[] = [];
      let socketHistory: Message[] = [];

      try {
        const resultChat = await getChatHistory(requestBody);

        // IMPORTANT: set this FIRST, before any timeout or resets
        const submitted = !!resultChat.post_chat_review;
        setIsPostChatSubmitted(submitted);
        isPostChatSubmittedRef.current = submitted;

        // Map bot history
        chatHistory = (resultChat.chat_history || []).map(
          (msg: any, index: number) => ({
            id: index,
            text: msg.text,
            role: (msg.role as any) || 'bot',
            timestamp: msg.timestamp,
          }),
        );
      } catch (error) {
        console.error('Error fetching bot history:', error);
      }

      try {
        const resultSocket = await getSocketConversationsByUserId(
          userId,
          appId,
          conversationId,
        );

        if (resultSocket) {
          if (!resultSocket.is_closed) {
            setConversation(resultSocket);
          }

          // Update Support Name & Image if assigned
          if (resultSocket.assigned_agent) {
            setSupportName(resultSocket.assigned_agent.name);
            setSupportImage(resultSocket.assigned_agent.image);
          }


          if (typeof resultSocket.is_closed !== 'undefined') {
            setIsConversationClosed(resultSocket.is_closed);
            setIsConversationActive(!resultSocket.is_closed);
          }

          socketHistory = (resultSocket.messages || []).map(
            (msg: any, index: number) => ({
              id: chatHistory.length + index,
              text: msg.text,
              role: (msg.role as any) || 'support',
              timestamp: msg.timestamp,
            }),
          );

          // If conversation is closed, append the timeout/closed message so it persists
          if (resultSocket.is_closed) {
            const timeoutMessage: Message = {
              role: 'timeout',
              text: 'This conversation has been closed due to inactivity or customer closed the conversation. Please start a new conversation if you need further assistance.',
              timestamp: new Date().toISOString(), // Or use closed_at if available
            };
            socketHistory.push(timeoutMessage);
          }

          if (socketHistory.length > 0) {
            setIsSpeakingWithRealPerson(true);
          }
        }
      } catch (error) {
        console.error('Error fetching socket history:', error);
      }

      const combinedHistory: Message[] =
        socketHistory.length > 0
          ? [
            ...chatHistory,
            ...(chatHistory.length > 0
              ? [
                {
                  id: chatHistory.length,
                  text: '<hr>',
                  role: 'separator' as const,
                  timestamp: new Date().toISOString(),
                },
              ]
              : []),
            ...socketHistory,
          ]
          : chatHistory;

      // If we have socket history (real support), filter out the default greeting
      if (socketHistory.length > 0) {
        setChatMessages([...combinedHistory]);
      } else {
        // Determine initial messages based on conversation state
        let initialMessages: Message[] = [];

        if (conversationId === 'NEW_CHAT') {
          if (isAdmin && adminTestingMode) {
            initialMessages = [
              {
                role: 'bot',
                chatbot_id: appId,
                timestamp: new Date().toISOString(),
                user_email: userEmail,
                user_id: userId,
                text: 'Hello, how can I help you today?',
              },
            ];
          } else if (isAdmin) {
            initialMessages = [
              {
                role: 'bot',
                chatbot_id: appId,
                timestamp: new Date().toISOString(),
                user_email: userEmail,
                user_id: userId,
                text: 'Hello, how can I help you today?',
              },
              {
                role: 'user',
                chatbot_id: appId,
                timestamp: new Date().toISOString(),
                user_email: userEmail,
                user_id: userId,
                text: 'Hi, I just wanted to check if my recent order has been shipped.',
              },
              {
                role: 'bot',
                chatbot_id: appId,
                timestamp: new Date().toISOString(),
                user_email: userEmail,
                user_id: userId,
                text: 'Sure! Could you please share your order ID so I can look it up?',
              },
            ];
          } else {
            initialMessages = [
              {
                role: 'bot',
                chatbot_id: appId,
                timestamp: new Date().toISOString(),
                user_email: userEmail,
                user_id: userId,
                text: 'Hello, how can I help you today?',
              },
            ];
          }
        } else {
          initialMessages = [
            {
              role: 'bot',
              chatbot_id: appId,
              timestamp: new Date().toISOString(),
              user_email: userEmail,
              user_id: userId,
              text: 'Hello, how can I help you today?',
            },
          ];
        }

        if (!(chatHistory.length > 0) && conversationId !== 'NEW_CHAT') {
          setChatMessages((prev) => [...prev, ...combinedHistory])
        } else {
          setChatMessages([...initialMessages, ...combinedHistory]);
        }


      }

      if (combinedHistory.length > 0) {
        const lastMessage = combinedHistory[combinedHistory.length - 1];

        if (lastMessage.timestamp) {
          lastMessageTimeRef.current = new Date(lastMessage.timestamp);

          if (checkConversationActivity()) {
            resetInactivityTimeout();
          }
        }
      } else {
        // If no history at all, reset inactivity baseline to now
        lastMessageTimeRef.current = new Date();
        resetInactivityTimeout();
      }
    } catch (error) {
      console.error('Error fetching chat history or socket chats:', error);
    } finally {
      setIsFetching(false);
    }
  };

  // ====== Send Message Logic ======
  const handleSendMessage = (requestBody: ChatWithAssistantRequest) => {
    setLoading(true);
    let assistantResponse = '';
    let firstTokenReceived = false;

    chatWithAssistant(
      requestBody,
      (token) => {
        if (!firstTokenReceived) {
          setLoading(false); // Stop spinner immediately on first token
          playSound();
          setIsConversationClosed(false);
          firstTokenReceived = true;
        }
        assistantResponse += token;
        setChatMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'bot') {
            return [...prev.slice(0, -1), { ...last, text: assistantResponse }];
          } else {
            return [
              ...prev,
              {
                text: assistantResponse,
                role: 'bot',
                timestamp: new Date().toISOString(),
                user_id: requestBody.user_id,
                user_email: requestBody.user_email,
              },
            ];
          }
        });
      },
      (data) => {
        resetInactivityTimeout();

        // Handle new conversation ID from RAG backend
        if (data?.conversation_id) {
          setConvoId(data.conversation_id);
          setSelectedChatId(data.conversation_id)
        }

        // Handle limit exceeded (legacy support)
        if (data?.event === 'limit_exceeded') {
          serReachedLimit(true);
          return;
        }

        // Mark loading complete on end event
        if (data?.event === 'end') {
          setLoading(false);
          setShowNotification(true);

          // Force re-render with flag to trigger markdown parsing
          setChatMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === 'bot') {
              return [...prev.slice(0, -1), { ...last, streamComplete: true }];
            }
            return prev;
          });
        }
      },
      (error) => {
        console.error('Assistant error:', error);
        setLoading(false);
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: `Error: ${error || 'Something went wrong.'}`,
            chatbot_id: appId,
            timestamp: new Date().toISOString(),
            user_id: requestBody.user_id,
          },
        ]);
      },
    );
  };

  const handleSend = (text?: string) => {
    if (!isConversationActive) {
      alert('This conversation has expired. Please start a new conversation.');
      return;
    }

    // The admin's "test your bot" panel talks to the AI straight away.
    if (!(isAdmin && adminTestingMode) && !isEmailAvailable && !userEmail) {
      const messageText = text || message;
      setMessage('');
      if (messageText.trim() === '') {
        setLoading(false);
        return;
      }

      // Store the message to auto-send later
      setPendingMessage(messageText);

      // Echo user message locally
      const newMessage: Message = {
        user_email: 'Visitor', // Placeholder
        user_id: userId,
        chatbot_id: appId,
        role: 'user',
        text: messageText,
        chatbot_history: convoId,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, newMessage]);

      // Helper to append email request
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'email_request',
            text: 'Please provide your email to proceed further.',
            chatbot_id: appId,
            timestamp: new Date().toISOString(),
            user_id: userId,
            isEmailForm: true,
          }
        ]);
      }, 500);

      setLoading(false);
      return;
    }

    setLoading(true);
    const messageText = text || message;
    setMessage('');

    if (messageText.trim() === '') {
      setLoading(false);
      return;
    }

    const newMessage: Message = {
      user_email:
        isSpeakingWithRealPerson && !userEmail ? 'New Customer' : userEmail,
      user_id: userId,
      chatbot_id: appId,
      role: 'user',
      text: messageText,
      chatbot_history: convoId,
      timestamp: new Date().toISOString(),
    };

    // Append the new outgoing message and reset inactivity baseline
    setChatMessages((prev) => [...prev, newMessage]);
    resetInactivityTimeout();

    if (isSpeakingWithRealPerson) {
      let updatedConvoId = convoId;
      if (updatedConvoId === 'NEW_CHAT') {
        updatedConvoId = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}`;
        setConvoId(updatedConvoId);
      }

      if (socketRef.current) {
        socketRef.current.emit('message', {
          ...newMessage,
          chatbot_history: updatedConvoId,
        });
      }
      setLoading(false);
    } else {
      const requestBody: ChatWithAssistantRequest = {
        user_email: userEmail,
        user_id: userId,
        chatbot_id: appId,
        conversation_id: convoId,
        prompt: messageText,
        isFreePlan: chatbot_config.isFreePlan,
        currentPlan: chatbot_config.currentPlan,
      };
      handleSendMessage(requestBody);
    }
  };

  // ====== File Upload ======
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isConversationActive) {
      alert('This conversation has expired. Please start a new conversation.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const result = await uploadConversationFile(file);

      // Prefer key if available, otherwise fallback to url (legacy)
      const linkTarget = result.key || result.url;

      const newMessage: Message = {
        user_email: userEmail,
        chatbot_id: appId,
        user_id: userId,
        role: 'user',
        text: `<a href="${linkTarget}" target="_blank">${result.fileName}</a>`,
        chatbot_history: convoId,
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, newMessage]);
      resetInactivityTimeout();

      if (isSpeakingWithRealPerson && socketRef.current) {
        socketRef.current.emit('message', newMessage);
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Failed to upload file');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ====== Form Handlers ======
  const handleSaveEmail = async (values: Record<string, string>) => {
    // Determine email field from PreChatForm config OR check direct 'email' key
    const fields = Array.isArray(preChatForm)
      ? preChatForm
      : preChatForm?.fields || [];

    let emailValue = values['email']; // Check direct key first (from in-chat form)

    if (!emailValue) {
      const emailField = fields.find((f: any) => f.type === 'email');
      emailValue = emailField ? values[emailField.id] : null;
    }

    if (emailValue) {
      setUserEmail(emailValue);
      Cookies.set('userEmail', emailValue, { expires: 30 });
      setIsEmailAvailable(true);

      // If coming from in-chat form (values has 'email' key and no obscure ID keys usually)
      if (values['email']) {
        // Auto-send the pending message if it exists
        if (pendingMessage) {
          // We need to trigger the send logic directly since we have the new email
          // and state might not be updated fast enough for a recursive handleSend call

          const messageText = pendingMessage;
          // Clear pending immediately
          setPendingMessage(null);

          // Set loading for the AI response
          setLoading(true);


          // AI Bot flow
          const requestBody: ChatWithAssistantRequest = {
            user_email: emailValue,
            user_id: userId,
            chatbot_id: appId,
            conversation_id: convoId,
            prompt: messageText,
            isFreePlan: chatbot_config.isFreePlan,
            currentPlan: chatbot_config.currentPlan,
          };
          handleSendMessage(requestBody);

        } else {
          // Fallback if no pending message (shouldn't happen in this flow usually)
          setChatMessages((prev) => [
            ...prev,
            {
              role: 'bot',
              text: 'Thank you! Now tell me how can i help you?',
              chatbot_id: appId,
              timestamp: new Date().toISOString(),
              user_id: userId,
            }
          ]);
        }
      }
    }

    const custom_data: Record<string, string> = {};
    fields.forEach((field: any) => {
      if (field.type !== 'email' && values[field.id]) {
        const key = field.label.trim().toLowerCase().replace(/\s+/g, '_');
        custom_data[key] = values[field.id];
      }
    });

    await savePreChatCustomValue({
      email: emailValue,
      custom_data,
      chatbot_id: appId,
    });

    // Remove pre-chat from messages if it was there (legacy) and the new email_request
    setChatMessages((prevConversation) =>
      prevConversation.filter((m) => !m.isEmailForm && m.role !== 'email_request'),
    );

    resetInactivityTimeout();
  };

  const handlePostFormSubmit = async (values: Record<string, string>) => {
    try {
      // Clean keys: remove "-123456789" from field IDs
      const cleanedValues: Record<string, string> = {};

      Object.keys(values).forEach((key) => {
        const cleanKey = key.replace(/-\d+$/, ''); // remove dash + numbers
        cleanedValues[cleanKey] = values[key];
      });

      console.log('Cleaned Form Values:', cleanedValues);

      // Mark as submitted
      setIsPostChatSubmitted(true);
      isPostChatSubmittedRef.current = true;

      // Save review
      await submitPostChatForm(convoId, cleanedValues);

      console.log('Conversation ID:', convoId);

      // Close form UI
      setOpenPostChatForm(false);
      setWindowWidth('400px');
      onBack();
    } catch (error) {
      console.error('Error submitting post chat form:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  // ====== Close Chat ======
  const handleCloseChat = async () => {
    hasTimedOutRef.current = true;
    setIsConversationActive(false);

    const timeoutMessage: Message = {
      role: 'timeout',
      text: 'This conversation has been closed due to inactivity or customer closed the conversation. Please start a new conversation if you need further assistance.',
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, timeoutMessage]);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    try {
      if (conversation?.id) {
        if (socketRef.current) {
          socketRef.current.emit('conversation:closed', {
            chatbot_history: conversation.id,
            chatbot_id: appId,
          });
        }

        await closeSocketConversation(conversation.id);


        setSupportName(chatbot_config.chatbotName);
      }
    } catch (error) {
      console.error('Error closing conversation on server', error);
    }

    // Clear conversation state to hide close button
    setConversation(null);

    // Use ref-based check to avoid async state races
    if (
      !isPostChatSubmittedRef.current &&
      postChatForm &&
      postChatForm?.elements?.length !== 0 &&
      postChatForm?.enabled
    ) {
      setOpenPostChatForm(true);
    } else {
      setWindowWidth('400px');
      onBack();
    }

    if (socketRef.current) socketRef.current.disconnect();

    onConversationTimeout?.();
  };

  // ====== Voice Recognition ======
  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    // Wait a bit for the final transcript to arrive
    setTimeout(() => {
      console.log('Final transcript:', transcript);
      setMessage((prev) => prev + ' ' + transcript);
      resetTranscript();
      setIsListening(false);
    }, 500); // 0.5s delay usually enough
  };

  const cancelListening = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
    resetTranscript();
  };

  // ====== Switch to Real Person ======
  const handleSwitchToRealPerson = () => {
    if (!isConversationActive) {
      alert('This conversation has expired. Please start a new conversation.');
      return;
    }

    if (!isEmailAvailable) {
      setIsEmailAvailable(true);
    }

    setChatMessages((prev) => [
      ...prev,
      {
        id: Math.floor(Math.random() * 1000000) + 1,
        text: '<hr>',
        role: 'separator',
        timestamp: new Date().toISOString(),
      },
    ]);
    setIsSpeakingWithRealPerson(true);
    resetInactivityTimeout();
  };

  // ====== Start New Conversation ======
  const startNewConversation = () => {
    hasTimedOutRef.current = false;
    setIsConversationActive(true);
    setIsConversationClosed(false);
    setIsSpeakingWithRealPerson(false);
    setConvoId('NEW_CHAT');
    setSelectedChatId('NEW_CHAT')
    if (isAdmin && adminTestingMode) {
      setChatMessages([
        {
          role: 'bot',
          chatbot_id: appId,
          timestamp: new Date().toISOString(),
          user_email: userEmail,
          user_id: userId,
          text: 'Hello, how can I help you today?',
        },
      ]);
    } else if (isAdmin) {
      setChatMessages([
        {
          role: 'bot',
          chatbot_id: appId,
          timestamp: new Date().toISOString(),
          user_email: userEmail,
          user_id: userId,
          text: 'Hello, how can I help you today?',
        },
        {
          role: 'user',
          chatbot_id: appId,
          timestamp: new Date().toISOString(),
          user_email: userEmail,
          user_id: userId,
          text: 'Hi, I just wanted to check if my recent order has been shipped.',
        },
        {
          role: 'bot',
          chatbot_id: appId,
          timestamp: new Date().toISOString(),
          user_email: userEmail,
          user_id: userId,
          text: 'Sure! Could you please share your order ID so I can look it up?',
        },
      ]);
    } else {
      setChatMessages([
        {
          role: 'bot',
          chatbot_id: appId,
          timestamp: new Date().toISOString(),
          user_id: userId,
          user_email: userEmail,
          text: 'Hello, how can I help you today?',
        },
      ]);
    }

    // reset post chat review flags for a fresh session
    setIsPostChatSubmitted(false);
    isPostChatSubmittedRef.current = false;

    resetInactivityTimeout();
  };

  return {
    // State
    conversation,
    setConversation,
    message,
    setMessage,
    chatMessages,
    setChatMessages,
    loading,
    convoId,
    setConvoId,
    isConversationActive,
    isConversationClosed,
    reachedLimit,
    supportName,
    setSupportName,
    supportImage,
    setSupportImage,
    showTyping,
    setShowTyping,
    isListening,
    setIsListening,
    openPostChatForm,
    setOpenPostChatForm,
    isPostChatSubmitted,

    // Refs
    lastFetchedConversationIdRef,
    socketRef,
    fileInputRef,
    typingRef,
    transcript,

    // Functions
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
    userEmail,
    playSound,
  };
};
