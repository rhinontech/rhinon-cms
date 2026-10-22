// Chatbot configuration service
import { serverApi } from '../api';
import { ENDPOINTS } from '../api/endpoints';
import type { ChatbotConfig, WhatsAppConfig } from '@/types';

export interface ChatbotConfigResponse {
  chatbot_installed: boolean;
  isApiKeyProvided: boolean;
  plan: string;
  chatbot_config: Partial<ChatbotConfig>;
}

/**
 * Get chatbot configuration
 */
export const getChatbotConfig = async (chatbotId: string): Promise<ChatbotConfigResponse> => {
  const response = await serverApi.get(ENDPOINTS.CHATBOT_CONFIG, {
    params: { chatbot_id: chatbotId },
  });

  const config = response.data;

  // If chatbot not installed, call set-installed route
  if (!config.chatbot_installed) {
    try {
      await serverApi.post(ENDPOINTS.CHATBOT_SET_INSTALLED, {}, {
        params: { chatbot_id: chatbotId },
      });
      config.chatbot_installed = true;
    } catch (err) {
      console.error('Failed to set chatbot installed:', err);
    }
  }

  return config;
};

/**
 * Get WhatsApp configuration
 */
export const getWhatsAppConfig = async (appId: string): Promise<WhatsAppConfig | null> => {
  try {
    const response = await serverApi.get(ENDPOINTS.WHATSAPP_CONFIG, {
      params: { app_id: appId },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get whatsapp config', error);
    return null;
  }
};

/**
 * Check if customer has phone number on file
 */
export const checkCustomerPhone = async (email: string): Promise<{ hasPhone: boolean; phoneNumber?: string } | null> => {
  try {
    const response = await serverApi.get(ENDPOINTS.CUSTOMER_PHONE, {
      params: { email },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to check customer phone', error);
    return null;
  }
};

/**
 * Save customer phone number
 */
export const saveCustomerPhone = async (email: string, phoneNumber: string) => {
  const response = await serverApi.post(ENDPOINTS.CUSTOMER_PHONE, {
    email,
    phoneNumber,
  });
  return response.data;
};
