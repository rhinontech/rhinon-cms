// Configuration type definitions

export type Theme = 'dark' | 'light' | 'system';

export interface ChatbotConfig {
  theme?: Theme;
  isFreePlan?: boolean;
  currentPlan?: string;
  isBackgroundImage?: boolean;
  backgroundImage?: string;
  isBgFade?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  chatbotName?: string;
  navigationOptions?: string[];
  popupMessage?: string;
  greetings?: string[];
  primaryLogo?: string;
  /** The launcher button's own icon (Appearance → Launcher icon), inset on the primary colour. */
  launcherIcon?: string;
  /** Seconds before the pop-up message appears beside the launcher (default 3). */
  popupDelay?: number;
  secondaryLogo?: string;
  preChatForm?: FormField[];
  postChatForm?: PostChatFormConfig;
  ticketForm?: FormField[];
  selectedPage?: string; // For admin preview mode
  isChatHistory?:boolean;
}

export interface FormField {
  id: string;
  type: 'email' | 'name' | 'phone' | 'subject' | 'description' | 'text' | 'rating' | 'choice' | 'multiple-choice';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface PostChatFormConfig {
  enabled: boolean;
  elements: FormField[];
  fields?: FormField[]; // For backwards compatibility
}

export interface SalesziumConfig {
  app_id: string;
  admin?: boolean;
  adminTestingMode?: boolean;
  chatbot_config?: Partial<ChatbotConfig>;
  container?: HTMLElement;
}

export interface WhatsAppConfig {
  phoneNumber: string;
  enabled?: boolean;
}
