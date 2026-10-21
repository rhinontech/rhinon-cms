// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import Messenger from './Messenger/Messenger';
import { setCurrentAppId } from './services/api';

export interface SalesziumConfig {
  app_id: string;
  admin?: boolean;
  container?: HTMLElement; // Add container option
}

// Create custom element
export class ChatBotElement extends HTMLElement {
  private config: SalesziumConfig | null = null;
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

  setConfig(config: SalesziumConfig) {
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

// Track if manual initialization has been called
let manuallyInitialized = false;

// Updated initialization function with container support
function initSaleszium(config: SalesziumConfig): ChatBotElement {
  manuallyInitialized = true;
  setCurrentAppId(config.app_id);

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
      initSaleszium(defaultConfig);
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

// Export for package consumers
export { initSaleszium };
export default initSaleszium;

if (typeof window !== 'undefined') {
  (window as any).RhinonBot = initSaleszium;
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
    if (!manuallyInitialized && !document.querySelector('chat-bot')) initSaleszium({ app_id: tagAppId });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}
