// useMessengerState - Main state management hook for Messenger
import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { LOGOS } from '@/constants/urls';
import type {
  Campaign,
  Folder,
  SalesziumConfig,
  ChatbotConfig,
  SelectedNewsProps,
  SelectedHelpArticleProps,
  ConversationItem,
} from '@/types';
import { useConfigStore } from '@/store';
import { getChatbotConfig, getForms, type FormsResponse } from '@/services/config';
import { getEffectiveTheme } from '@/constants/theme';
import {
  DEFAULT_PRE_CHAT_FORM,
  DEFAULT_POST_CHAT_FORM,
  DEFAULT_TICKET_FORM,
} from '@/constants/defaults';
import {
  getChatHistory,
  getConversationByUserId,
  getSocketConversationsByUserId,
} from '@/services/chat';

export interface UseMessengerStateReturn {
  // UI State
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeScreen: string;
  setActiveScreen: React.Dispatch<React.SetStateAction<string>>;
  showPopup: boolean;
  setShowPopup: React.Dispatch<React.SetStateAction<boolean>>;
  windowWidth: string;
  setWindowWidth: React.Dispatch<React.SetStateAction<string>>;
  effectiveTheme: 'light' | 'dark';
  setEffectiveTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  showNotification: boolean;
  mainLoading: boolean;

  // Chat State
  selectedChatId: string | null;
  setSelectedChatId: React.Dispatch<React.SetStateAction<string | null>>;
  isSpeakingWithRealPerson: boolean;
  setIsSpeakingWithRealPerson: React.Dispatch<React.SetStateAction<boolean>>;
  isTicketRaised: boolean;
  setIsTicketRaised: React.Dispatch<React.SetStateAction<boolean>>;

  // User State
  isEmailAvailable: boolean;
  setIsEmailAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  userEmail: string | null;
  setUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
  userId: string | null;
  setUserId: React.Dispatch<React.SetStateAction<string | null>>;

  // Content State
  selectedNews: SelectedNewsProps | null;
  setSelectedNews: React.Dispatch<
    React.SetStateAction<SelectedNewsProps | null>
  >;
  selectedHelpArticle: SelectedHelpArticleProps | null;
  setSelectedHelpArticle: React.Dispatch<
    React.SetStateAction<SelectedHelpArticleProps | null>
  >;
  selectedHelp: Folder | null;
  setSelectedHelp: React.Dispatch<React.SetStateAction<Folder | null>>;
  setShowNotification: React.Dispatch<React.SetStateAction<boolean>>;

  // API State
  isApiKeyProvided: boolean;
  freePlan: boolean;

  // Campaign State
  activeCampaign: Campaign | undefined;
  setActiveCampaign: React.Dispatch<React.SetStateAction<Campaign | undefined>>;
  campaignFoundRef: React.MutableRefObject<boolean>;
  campaignsRef: React.MutableRefObject<Campaign[]>;

  // Config
  chatbot_config: ChatbotConfig;
}

export function useMessengerState(
  config: SalesziumConfig | null | undefined,
): UseMessengerStateReturn {
  const { chatbot_config, setConfig } = useConfigStore();

  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('home');
  const [showPopup, setShowPopup] = useState(false);
  const [windowWidth, setWindowWidth] = useState<string>('400px');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(
    'light',
  );
  const [showNotification, setShowNotification] = useState(false);

  // Chat State
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isSpeakingWithRealPerson, setIsSpeakingWithRealPerson] =
    useState(false);
  const [isTicketRaised, setIsTicketRaised] = useState<boolean>(false);

  // User State
  const [isEmailAvailable, setIsEmailAvailable] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // Initialize userId synchronously from localStorage to prevent race condition
  // Generate a new ID if one doesn't exist
  const [userId, setUserId] = useState<string | null>(() => {
    let id = localStorage.getItem('userId');
    if (!id) {
      // Generate new userId if it doesn't exist
      id = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('userId', id);
    }
    return id;
  });

  // Content State
  const [selectedNews, setSelectedNews] = useState<SelectedNewsProps | null>(
    null,
  );
  const [selectedHelpArticle, setSelectedHelpArticle] =
    useState<SelectedHelpArticleProps | null>(null);
  const [selectedHelp, setSelectedHelp] = useState<Folder | null>(null);

  // API State
  const [isApiKeyProvided, setIsApiKeyProvided] = useState<boolean>(false);
  const [freePlan, setFreePlan] = useState<boolean>(false);

  // Campaign State
  const [activeCampaign, setActiveCampaign] = useState<Campaign | undefined>(
    undefined,
  );
  const campaignFoundRef = useRef(false);
  const campaignsRef = useRef<Campaign[]>([]);

  const [mainLoading, setMainLoading] = useState(false);

  // Initialize / Fetch config
  useEffect(() => {
    const fetchConfig = async () => {
      if (config?.admin && config.chatbot_config) {
        const { selectedPage, ...restConfig } = config.chatbot_config;

        setConfig({
          app_id: config.app_id,
          admin: true,
          chatbot_config: restConfig,
        });

        if (selectedPage) {
          setActiveScreen(selectedPage.toLowerCase());
        } else {
          setActiveScreen('home');
        }
      } else if (config?.app_id) {
        try {
          console.log('Fetching chatbot config from server...');
          const response = await getChatbotConfig(config.app_id);

          setIsApiKeyProvided(response.isApiKeyProvided);
          setFreePlan(response.plan === 'Free');
          const isFree = response.plan === 'Free';

          const cfg = response.chatbot_config || {};
          let formResponse: FormsResponse = {
            pre_chat_form: DEFAULT_PRE_CHAT_FORM,
            post_chat_form: DEFAULT_POST_CHAT_FORM,
            ticket_form: DEFAULT_TICKET_FORM,
          };
          try {
            formResponse = await getForms(config.app_id);
          } catch (e) {
            console.warn('[useMessengerState] Form fetch failed, using fallback:', e);
          }

          setConfig({
            app_id: config.app_id,
            // Saleszium stored `true` here for every visitor; this branch is the
            // public (non-admin) one.
            admin: !!config.admin,
            adminTestingMode: config.adminTestingMode,
            chatbot_config: {
              theme: cfg.theme || 'dark',
              isFreePlan: isFree,
              currentPlan: response.plan || 'Trail',
              isBackgroundImage: cfg.isBackgroundImage || false,
              backgroundImage: cfg.backgroundImage || '',
              isBgFade: cfg.isBgFade ?? true,
              primaryColor: cfg.primaryColor || '#1403ac',
              secondaryColor: cfg.secondaryColor || '#f3f6ff',
              chatbotName: cfg.chatbotName || 'Rhinon',
              navigationOptions: cfg.navigationOptions,
              popupMessage:
                cfg.popupMessage ||
                'Hey, I am Rhinon AI Assistant, How can I help you?',
              greetings: cfg.greetings?.length
                ? cfg.greetings
                : ['Hi there👋', 'How can we help?'],
              primaryLogo:
                cfg.primaryLogo || LOGOS.primaryLight,
              secondaryLogo:
                cfg.secondaryLogo || LOGOS.primaryDark,
              launcherIcon: cfg.launcherIcon || '',
              preChatForm: formResponse.pre_chat_form,
              postChatForm: formResponse.post_chat_form,
              ticketForm: formResponse.ticket_form,
              isChatHistory: cfg.isChatHistory ?? false,
            },
          });
        } catch (err) {
          console.error('Failed to fetch chatbot config', err);
        }
      }
    };

    fetchConfig();
  }, [config, setConfig]);

  // Handle system theme detection and changes
  useEffect(() => {
    setEffectiveTheme(getEffectiveTheme(chatbot_config?.theme));

    if (chatbot_config?.theme === 'system' || !chatbot_config?.theme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleThemeChange = (e: MediaQueryListEvent) => {
        setEffectiveTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleThemeChange);
      return () => mediaQuery.removeEventListener('change', handleThemeChange);
    }
  }, [chatbot_config?.theme]);

  // Resolve saved user email
  useEffect(() => {
    const savedEmail = Cookies.get('userEmail');
    if (savedEmail) {
      setUserEmail(savedEmail);
      setIsEmailAvailable(true);
    } else {
      setIsEmailAvailable(false);
      setUserEmail(
        isSpeakingWithRealPerson && !savedEmail
          ? 'New Customer'
          : savedEmail || null,
      );
    }
  }, [isSpeakingWithRealPerson]);

  // Auto open if admin
  useEffect(() => {
    if (config?.admin) {
      setIsOpen(true);
    }
  }, [config?.admin]);

  // Popup delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Update campaign found ref
  useEffect(() => {
    if (activeCampaign) {
      campaignFoundRef.current = true;
    }
  }, [activeCampaign]);



  const fetchConversation = async () => {
    if (!userId || !config?.app_id) return;
    setMainLoading(true);

    try {
      const response = await getConversationByUserId(userId, config.app_id);
      const sortedConversations = response.conversation.sort(
        (a: ConversationItem, b: ConversationItem) =>
          new Date(b.last_chat_time).getTime() -
          new Date(a.last_chat_time).getTime(),
      );


      if (config.adminTestingMode || !chatbot_config.isChatHistory) {
        setSelectedChatId(
          sortedConversations.length > 0
            ? sortedConversations[0].conversation_id
            : 'NEW_CHAT',
        );

      } else {
        setSelectedChatId(null);
      }

      if (!chatbot_config.isChatHistory && config.admin && !config.adminTestingMode) {
        setSelectedChatId('NEW_CHAT');
      }



      if (sortedConversations.length > 0) {
        const resultSocket = await getSocketConversationsByUserId(
          userId,
          config.app_id,
          sortedConversations[0].conversation_id,
        );
        // Null when the latest chat never reached a person — nothing to check.
        if (resultSocket?.is_closed) {
          setSelectedChatId('NEW_CHAT');
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMainLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [userId, config.app_id, chatbot_config.isChatHistory]);

  return {
    // UI State
    isOpen,
    setIsOpen,
    activeScreen,
    setActiveScreen,
    showPopup,
    setShowPopup,
    windowWidth,
    setWindowWidth,
    effectiveTheme,
    setEffectiveTheme,
    showNotification,
    mainLoading,

    // Chat State
    selectedChatId,
    setSelectedChatId,
    isSpeakingWithRealPerson,
    setIsSpeakingWithRealPerson,
    isTicketRaised,
    setIsTicketRaised,

    // User State
    isEmailAvailable,
    setIsEmailAvailable,
    userEmail,
    setUserEmail,
    userId,
    setUserId,

    // Content State
    selectedNews,
    setSelectedNews,
    selectedHelpArticle,
    setSelectedHelpArticle,
    selectedHelp,
    setSelectedHelp,
    setShowNotification,

    // API State
    isApiKeyProvided,
    freePlan,

    // Campaign State
    activeCampaign,
    setActiveCampaign,
    campaignFoundRef,
    campaignsRef,

    // Config
    chatbot_config,
  };
}
