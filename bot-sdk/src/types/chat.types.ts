// Chat and conversation type definitions

import type { Message } from './message.types';
import type { ChatbotConfig, FormField, PostChatFormConfig, WhatsAppConfig } from './config.types';

export interface Conversation {
  id: string;
  messages: Message[];
  is_closed: boolean;
  post_chat_review?: Record<string, string>;
}

export interface ConversationSummary {
  conversation_id: string;
  title: string;
  last_chat_time: string;
  avatar?: string;
  name?: string;
  isOnline?: boolean;
  unreadCount?: number;
  lastMessage?: string;
  type?: 'bot' | 'support';
}

// Alias for ConversationSummary - used in ChatHistoryScreen
export type ConversationItem = ConversationSummary;

export interface ChatScreenProps {
  isAdmin: boolean;
  isFreePlan?: boolean;
  onNavigate: (screen: string) => void;
  chatName?: string;
  chatAvatar?: string;
  userId: string;
  userEmail: string;
  setUserEmail: React.Dispatch<React.SetStateAction<string>>;
  appId: string;
  preChatForm: FormField[];
  postChatForm: PostChatFormConfig;
  raiseTicket: () => void;
  conversationId: string;
  onBack?: () => void;
  isEmailAvailable: boolean;
  setIsEmailAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedChatId: React.Dispatch<React.SetStateAction<string>>;
  isSpeakingWithRealPerson: boolean;
  setIsSpeakingWithRealPerson: React.Dispatch<React.SetStateAction<boolean>>;
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  timeoutDuration?: number;
  onConversationTimeout?: () => void;
  chatbot_config: ChatbotConfig;
  setIsTicketRaised: React.Dispatch<React.SetStateAction<boolean>>;
  ticketForm: FormField[];
  setWindowWidth: React.Dispatch<React.SetStateAction<string>>;
  adminTestingMode?: boolean;
  chatMessages: Message[];
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  convoId: string;
  setConvoId: React.Dispatch<React.SetStateAction<string>>;
  isConversationActive: boolean;
  isConversationClosed: boolean;
  reachedLimit: boolean;
  supportName: string;
  setSupportName: React.Dispatch<React.SetStateAction<string>>;
  supportImage: string | null;
  setSupportImage: React.Dispatch<React.SetStateAction<string | null>>;
  showTyping: boolean;
  setShowTyping: React.Dispatch<React.SetStateAction<boolean>>;
  isListening: boolean;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;
  openPostChatForm: boolean;
  lastFetchedConversationIdRef: React.MutableRefObject<string | null>;
  socketRef: React.MutableRefObject<any>;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  typingRef: React.MutableRefObject<HTMLDivElement | null>;
  transcript: string;
  resetInactivityTimeout: () => void;
  handleSend: (text?: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveEmail: (values: Record<string, string>) => Promise<void>;
  handlePostFormSubmit: (values: Record<string, string>) => Promise<void>;
  handleCloseChat: () => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  cancelListening: () => void;
  handleSwitchToRealPerson: () => void;
  fetchChats: () => Promise<void>;
  isfetching: boolean;
  startNewConversation: () => void;
  setOpenPostChatForm: React.Dispatch<React.SetStateAction<boolean>>;
  playSound: () => void;
  setShowNotification: React.Dispatch<React.SetStateAction<boolean>>;
  showNotification: boolean;
  mainLoading: boolean;
  conversation: Conversation | null;
}

export interface ChatLogicProps {
  userId: string;
  userEmail: string;
  appId: string;
  conversationId: string;
  isAdmin: boolean;
  chatAvatar: string;
  chatbot_config: ChatbotConfig;
  timeoutDuration?: number;
  onConversationTimeout?: () => void;
  setUserEmail: React.Dispatch<React.SetStateAction<string>>;
  setIsEmailAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  isSpeakingWithRealPerson: boolean;
  setIsSpeakingWithRealPerson: React.Dispatch<React.SetStateAction<boolean>>;
  onBack?: () => void;
  setWindowWidth: React.Dispatch<React.SetStateAction<string>>;
  postChatForm: PostChatFormConfig;
  preChatForm: FormField[];
  isEmailAvailable: boolean;
  adminTestingMode?: boolean;
}

export interface ChatLogicReturn {
  // State
  conversation: Conversation | null;
  setConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  chatMessages: Message[];
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  loading: boolean;
  convoId: string;
  setConvoId: React.Dispatch<React.SetStateAction<string>>;
  isConversationActive: boolean;
  isConversationClosed: boolean;
  reachedLimit: boolean;
  supportName: string;
  setSupportName: React.Dispatch<React.SetStateAction<string>>;
  supportImage: string | null;
  setSupportImage: React.Dispatch<React.SetStateAction<string | null>>;
  showTyping: boolean;
  setShowTyping: React.Dispatch<React.SetStateAction<boolean>>;
  isListening: boolean;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;
  openPostChatForm: boolean;
  setOpenPostChatForm: React.Dispatch<React.SetStateAction<boolean>>;
  isPostChatSubmitted: boolean;
  isfetching: boolean;

  // Refs
  lastFetchedConversationIdRef: React.MutableRefObject<string | null>;
  socketRef: React.MutableRefObject<any>;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  typingRef: React.MutableRefObject<HTMLDivElement | null>;
  transcript: string;

  // Functions
  resetInactivityTimeout: () => void;
  handleSend: (text?: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveEmail: (values: Record<string, string>) => Promise<void>;
  handlePostFormSubmit: (values: Record<string, string>) => Promise<void>;
  handleCloseChat: () => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  cancelListening: () => void;
  handleSwitchToRealPerson: () => void;
  fetchChats: () => Promise<void>;
  startNewConversation: () => void;
  userEmail: string;
}

export type ActiveScreen = 'home' | 'chats' | 'help' | 'voice' | 'news' | 'raiseTicket';
