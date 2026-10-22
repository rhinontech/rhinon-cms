// src/types.ts — the public type surface, emitted as dist/types.d.ts.

export interface RhinonChatConfig {
  /** Your bot's id, from Admin → Chatbot → Overview. */
  app_id: string;
  /** Backend for this bot, e.g. "https://api.rhinontech.in/widget". Defaults to production. */
  api_url?: string;
  admin?: boolean;
  adminTestingMode?: boolean;
  chatbot_config?: ChatbotConfig;
  /** Mount inside this element instead of document.body. */
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

export declare class ChatBotElement extends HTMLElement {
  setConfig(config: RhinonChatConfig): void;
}

export declare function initRhinonChat(config: RhinonChatConfig): ChatBotElement;

/** Names from earlier releases (@rhinon/botsdk, @saleszium/botsdk). */
export type RhinontechConfig = RhinonChatConfig;
export type SalesziumConfig = RhinonChatConfig;
export declare const initRhinontech: typeof initRhinonChat;
export declare const initSaleszium: typeof initRhinonChat;

declare const _default: typeof initRhinonChat;
export default _default;
