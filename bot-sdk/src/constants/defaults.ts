// Default configuration values
import type { ChatbotConfig, FormField, PostChatFormConfig } from '@/types';
import { LOGOS, BACKGROUNDS } from './urls';

export const DEFAULT_PRIMARY_COLOR = '#1403ac';
export const DEFAULT_SECONDARY_COLOR = '#f3f6ff';
export const DEFAULT_CHATBOT_NAME = 'Rhinon';

export const DEFAULT_PRE_CHAT_FORM: FormField[] = [
  {
    id: 'email-default',
    type: 'email',
    label: 'Email Address',
    required: true,
    placeholder: 'Enter your email',
  },
  {
    id: 'name-default',
    type: 'name',
    label: 'Full Name',
    required: false,
    placeholder: 'Enter your name',
  },
  {
    id: 'phone-default',
    type: 'phone',
    label: 'Phone Number',
    required: false,
    placeholder: 'Enter your phone number',
  },
];

export const DEFAULT_POST_CHAT_FORM: PostChatFormConfig = {
  enabled: true,
  elements: [
    {
      id: 'rating-default',
      type: 'rating',
      label: 'Rate your experience',
      required: true,
    },
  ],
};

export const DEFAULT_TICKET_FORM: FormField[] = [
  {
    id: 'email-ticket-default',
    type: 'email',
    label: 'Email Address',
    required: true,
    placeholder: 'Enter your email',
  },
  {
    id: 'subject-ticket-default',
    type: 'subject',
    label: 'Subject',
    required: true,
    placeholder: 'Enter ticket subject',
  },
  {
    id: 'description-ticket-default',
    type: 'description',
    label: 'Description',
    required: true,
    placeholder: 'Describe the issue',
  },
];

export const DEFAULT_NAVIGATION_OPTIONS = ['Home', 'Messages', 'Help'];

export const DEFAULT_GREETINGS = ['Hi there👋', 'How can we help?'];

export const DEFAULT_POPUP_MESSAGE = 'Hey, I am Rhinon AI Assistant, How can I help you?';

export const DEFAULT_CONFIG: ChatbotConfig = {
  theme: 'dark',
  isFreePlan: false,
  currentPlan: 'Trial',
  isBackgroundImage: false,
  backgroundImage: BACKGROUNDS.default,
  isBgFade: true,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  secondaryColor: DEFAULT_SECONDARY_COLOR,
  chatbotName: DEFAULT_CHATBOT_NAME,
  navigationOptions: DEFAULT_NAVIGATION_OPTIONS,
  popupMessage: DEFAULT_POPUP_MESSAGE,
  greetings: DEFAULT_GREETINGS,
  primaryLogo: LOGOS.primaryLight,
  secondaryLogo: LOGOS.primaryDark,
  preChatForm: DEFAULT_PRE_CHAT_FORM,
  postChatForm: DEFAULT_POST_CHAT_FORM,
  ticketForm: DEFAULT_TICKET_FORM,
};

export const DEFAULT_WELCOME_MESSAGE = 'Hello, how can I help you today?';

export const ADMIN_DEMO_MESSAGES = [
  {
    role: 'bot' as const,
    text: 'Hello, how can I help you today?',
  },
  {
    role: 'user' as const,
    text: 'Hi, I just wanted to check if my recent order has been shipped.',
  },
  {
    role: 'bot' as const,
    text: 'Sure! Could you please share your order ID so I can look it up?',
  },
];
