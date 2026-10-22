// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import Messenger from './Messenger/Messenger';
import { setApiBase, setCurrentAppId, setTestingMode } from './services/api';

export interface RhinonChatConfig {
  app_id: string;
  /** Backend for this bot, e.g. "https://api.rhinontech.in/widget". Defaults to production. */
  api_url?: string;
  admin?: boolean;
  adminTestingMode?: boolean;
  container?: HTMLElement;
  chatbot_config?: Record<string, unknown>;
}
/** Older names, kept so code written for earlier versions keeps compiling. */
export type SalesziumConfig = RhinonChatConfig;
export type RhinontechConfig = RhinonChatConfig;

// Create custom element
export class ChatBotElement extends HTMLElement {
  private config: RhinonChatConfig | null = null;
  private root: any = null;

  connectedCallback() {
    console.log('[chat-bot] connected');
    this.render();
  }

  private render() {
    const shadow = this.shadowRoot || this.attachShadow({ mode: 'open' });

    if (!this.root) {
      const style = document.createElement('style');
      style.textContent = require('./Messenger/Messenger.scss').toString();
      shadow.appendChild(style);

      const container = document.createElement('div');
      shadow.appendChild(container);

      this.root = createRoot(container);
    }

    this.root.render(<Messenger config={this.config} />);
  }

  setConfig(config: RhinonChatConfig) {
    console.log('[Messenger] Setting config:', config);
    this.config = config;
    if (this.root) {
      this.render();
    }
  }
}

// Define custom element once
if (!customElements.get('chat-bot')) {
  customElements.define('chat-bot', ChatBotElement);
}

/**
 * The widget's font. @font-face inside a shadow root is ignored by Chrome, so
 * it is added to the host page once. Harmless if the page already has Inter.
 */
function loadFont() {
  if (typeof document === 'undefined' || document.getElementById('rhinon-chat-font')) return;
  const link = document.createElement('link');
  link.id = 'rhinon-chat-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
}

// Track if manual initialization has been called
let manuallyInitialized = false;

// Updated initialization function with container support
function initRhinonChat(config: RhinonChatConfig): ChatBotElement {
  manuallyInitialized = true;
  loadFont();
  if (config.api_url) setApiBase(config.api_url);
  setCurrentAppId(config.app_id);
  setTestingMode(!!(config as any).admin && !!(config as any).adminTestingMode);

  const chatBotElement = document.createElement('chat-bot') as ChatBotElement;

  // Append to specified container or body
  const targetContainer = config.container || document.body;
  targetContainer.appendChild(chatBotElement);

  chatBotElement.setConfig(config);

  return chatBotElement; // Return element for further manipulation
}

// Auto-initialize only if not manually initialized
function autoInit() {
  if (!manuallyInitialized && !document.querySelector('chat-bot')) {
    if (process.env.NODE_ENV === 'development') {
      const defaultConfig = {
        app_id: 'HCQ6XF',
        // admin: true,
        // chatbot_config: {
        //   isBgFade: false,
        //   isBackgroundImage: true,
        //   selectedPage: 'Home',
        //   primaryColor: '#272196f5',
        //   secondaryColor: '#f3f6ff',
        //   chatbotName: 'Rhinon',
        //   navigationOptions: ['Home', 'Messages', 'Help', 'Voice'],
        //   popupMessage: 'Hey, I am Rhinon AI Assistant, How can I help you?',
        //   greetings: ['Hi there👋', 'How can we help?'],
        //   primaryLogo:
        //     'https://www.saleszium.com/assets/Saleszium_Dark_Logo_small.png',
        //   secondaryLogo:
        //     'https://www.saleszium.com/assets/Saleszium_Dark_Logo_small.png',

        //   preChatForm: [
        //     {
        //       id: 'email-1757579831083',
        //       type: 'email',
        //       label: 'Email Address',
        //       required: true,
        //       placeholder: 'Enter your email',
        //     },
        //     {
        //       id: 'name-1757592673122',
        //       type: 'name',
        //       label: 'Full Name',
        //       required: false,
        //       placeholder: 'Enter your name',
        //     },
        //     {
        //       id: 'phone-1757911406275',
        //       type: 'phone',
        //       label: 'Phone Number',
        //       required: false,
        //       placeholder: 'Enter your phone number',
        //     },
        //   ],
        //   postChatForm: {
        //     enabled: true,
        //     elements: [
        //       {
        //         id: 'rating-1757579436771',
        //         type: 'rating',
        //         label: 'Rate your experience',
        //         required: true,
        //       },
        //     ],
        //   },
        //   ticketForm: [
        //     {
        //       id: 'email-1758003244699',
        //       type: 'email',
        //       label: 'Email Address',
        //       required: true,
        //       placeholder: 'Enter your email',
        //     },
        //     {
        //       id: 'subject-1758003246765',
        //       type: 'subject',
        //       label: 'Subject',
        //       required: true,
        //       placeholder: 'Enter ticket subject',
        //     },
        //     {
        //       id: 'description-1758003249732',
        //       type: 'description',
        //       label: 'Description',
        //       required: true,
        //       placeholder: 'Describe the issue',
        //     },
        //   ],
        // },
      };
      initRhinonChat(defaultConfig);
    }
  }
}

// Only auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}

// Export for package consumers. initRhinontech/initSaleszium: names used by
// earlier @rhinon/botsdk and @saleszium/botsdk releases.
export { initRhinonChat, initRhinonChat as initRhinontech, initRhinonChat as initSaleszium };
export default initRhinonChat;

if (typeof window !== 'undefined') {
  (window as any).RhinonChat = initRhinonChat;
  (window as any).RhinonBot = initRhinonChat; // snippets from before the rename
}

/**
 * One-tag install: <script async src=".../widget/rhinonbot.js" data-app-id="ABC123">.
 * `currentScript` is only set while this file is executing, so it is read now.
 */
const installTag =
  typeof document !== 'undefined'
    ? ((document.currentScript as HTMLScriptElement | null) ?? document.querySelector('script[data-app-id]'))
    : null;
const tagAppId = installTag?.getAttribute('data-app-id');
if (tagAppId && process.env.NODE_ENV !== 'development') {
  const start = () => {
    if (!manuallyInitialized && !document.querySelector('chat-bot')) initRhinonChat({ app_id: tagAppId });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}
