// src/types.ts - Clean types-only file for declarations
export interface SalesziumConfig {
  app_id: string;
  admin?: boolean;
  adminTestingMode?: boolean;
  chatbot_config?: ChatbotConfig,
  container?: HTMLElement;
}

export interface ChatbotConfig {
  theme?: 'light' | 'dark' | 'system';
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
  secondaryLogo?: string;
  preChatForm?: any[];
  postChatForm?: any;
  ticketForm?: any[];
}

// Export function type
export declare function initSaleszium(config: SalesziumConfig): void;

// Export class type  
export declare class ChatBotElement extends HTMLElement {
  setConfig(config: SalesziumConfig): void;
}

// Default export
declare const _default: typeof initSaleszium;
export default _default;