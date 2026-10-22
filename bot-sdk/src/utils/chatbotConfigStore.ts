import { LOGOS } from '@/constants/urls';
// store/useConfigStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatbotConfig {
  theme: "dark" | "light" | "system";
  isFreePlan: boolean;
  currentPlan: string;
  isBackgroundImage: boolean;
  backgroundImage: string;
  isBgFade: boolean;
  primaryColor: string;
  secondaryColor: string;
  chatbotName: string;
  navigationOptions: string[];
  popupMessage: string;
  greetings: string[];
  primaryLogo: string;
  secondaryLogo: string;
  preChatForm: any;
  postChatForm: any;
  ticketForm: any;
}

interface ConfigState {
  app_id: string;
  admin?: boolean;
  adminTestingMode?: boolean;
  chatbot_config: ChatbotConfig;

  setConfig: (newConfig: Partial<ConfigState>) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      app_id: 'app_id',
      admin: false,
      chatbot_config: {
        theme: 'dark',
        isFreePlan: false,
        currentPlan: 'Trail',
        isBackgroundImage: false,
        backgroundImage:'',
        isBgFade: true,
        primaryColor: '#1403ac',
        secondaryColor: '#f3f6ff',
        chatbotName: 'Rhinon',
        navigationOptions: ['Home', 'Chats', 'Help'],
        popupMessage: 'Hey, I am Rhinon AI Assistant, How can I help you?',
        greetings: ['Hi there👋', 'How can we help?'],
        primaryLogo: LOGOS.primaryLight,
        secondaryLogo: LOGOS.primaryDark,
        preChatForm: [
          {
            id: 'email-1757579831083',
            type: 'email',
            label: 'Email Address',
            required: true,
            placeholder: 'Enter your email',
          },
          {
            id: 'name-1757592673122',
            type: 'name',
            label: 'Full Name',
            required: false,
            placeholder: 'Enter your name',
          },
          {
            id: 'phone-1757911406275',
            type: 'phone',
            label: 'Phone Number',
            required: false,
            placeholder: 'Enter your phone number',
          },
        ],
        postChatForm: {
          enabled: true,
          elements: [
            {
              id: 'rating-1757579436771',
              type: 'rating',
              label: 'Rate your experience',
              required: true,
            },
          ],
        },
        ticketForm: [
          {
            id: 'email-1758003244699',
            type: 'email',
            label: 'Email Address',
            required: true,
            placeholder: 'Enter your email',
          },
          {
            id: 'subject-1758003246765',
            type: 'subject',
            label: 'Subject',
            required: true,
            placeholder: 'Enter ticket subject',
          },
          {
            id: 'description-1758003249732',
            type: 'description',
            label: 'Description',
            required: true,
            placeholder: 'Describe the issue',
          },
        ],
      },

      setConfig: (newConfig) =>
        set((state) => ({
          ...state,
          ...newConfig,
          chatbot_config: {
            ...state.chatbot_config,
            ...newConfig.chatbot_config,
          },
        })),
    }),
    { name: 'chatbot-config' },
  ),
);
