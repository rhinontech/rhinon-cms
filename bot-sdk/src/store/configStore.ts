// Configuration store - handles chatbot settings
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatbotConfig, FormField, PostChatFormConfig } from '@/types';
import { DEFAULT_CONFIG } from '@/constants/defaults';

// Extended config that includes app_id, admin flags and the chatbot config
export interface RhinonConfig {
  app_id?: string;
  admin?: boolean;
  adminTestingMode?: boolean;
  chatbot_config?: ChatbotConfig;
}

export interface ConfigState {
  appId: string;
  isAdmin: boolean;
  adminTestingMode: boolean;
  config: ChatbotConfig;
  chatbot_config: ChatbotConfig; // Alias for backward compatibility

  // Actions
  setAppId: (id: string) => void;
  setAdmin: (isAdmin: boolean, testingMode?: boolean) => void;
  setConfig: (config: Partial<RhinonConfig>) => void;
  updateForms: (
    preChatForm: FormField[],
    postChatForm: PostChatFormConfig,
    ticketForm: FormField[]
  ) => void;
  resetConfig: () => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      appId: '',
      isAdmin: false,
      adminTestingMode: false,
      config: DEFAULT_CONFIG,
      chatbot_config: DEFAULT_CONFIG, // Alias

      setAppId: (id) => set({ appId: id }),

      setAdmin: (isAdmin, testingMode = false) =>
        set({ isAdmin, adminTestingMode: testingMode }),

      setConfig: (newConfig) =>
        set((state) => {
          // Handle RhinonConfig with nested chatbot_config
          if (newConfig.app_id !== undefined || newConfig.chatbot_config !== undefined) {
            const updatedConfig = newConfig.chatbot_config
              ? { ...state.config, ...newConfig.chatbot_config }
              : state.config;
            return {
              appId: newConfig.app_id ?? state.appId,
              isAdmin: newConfig.admin ?? state.isAdmin,
              adminTestingMode: newConfig.adminTestingMode ?? state.adminTestingMode,
              config: updatedConfig,
              chatbot_config: updatedConfig,
            };
          }
          // Simple config update
          const updatedConfig = { ...state.config, ...newConfig };
          return {
            config: updatedConfig,
            chatbot_config: updatedConfig,
          };
        }),

      updateForms: (preChatForm, postChatForm, ticketForm) =>
        set((state) => {
          const updatedConfig = {
            ...state.config,
            preChatForm,
            postChatForm,
            ticketForm,
          };
          return {
            config: updatedConfig,
            chatbot_config: updatedConfig,
          };
        }),

      resetConfig: () => set({
        config: DEFAULT_CONFIG,
        chatbot_config: DEFAULT_CONFIG,
      }),
    }),
    { name: 'rhinon-chat-config' }
  )
);

// Legacy export for backward compatibility
export const useStore = useConfigStore;
