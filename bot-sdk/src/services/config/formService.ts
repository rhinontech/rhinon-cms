// Form services
import { serverApi } from '../api';
import { ENDPOINTS } from '../api/endpoints';
import type { FormField, PostChatFormConfig } from '@/types';

import { DEFAULT_PRE_CHAT_FORM, DEFAULT_POST_CHAT_FORM, DEFAULT_TICKET_FORM } from '@/constants/defaults';

export interface FormsResponse {
  pre_chat_form: FormField[];
  post_chat_form: PostChatFormConfig;
  ticket_form: FormField[];
}

/**
 * Get forms configuration for a chatbot
 */
export const getForms = async (chatbotId: string): Promise<FormsResponse> => {
  try {
    const response = await serverApi.get(ENDPOINTS.CHATBOT_FORMS, {
      params: { chatbot_id: chatbotId },
    });
    return response.data;
  } catch (error) {
    console.warn('[formService] Form configuration not found or failed, using defaults');
    return {
      pre_chat_form: DEFAULT_PRE_CHAT_FORM,
      post_chat_form: DEFAULT_POST_CHAT_FORM,
      ticket_form: DEFAULT_TICKET_FORM,
    };
  }
};

export interface PreChatFormData {
  email: string;
  chatbot_id: string;
  custom_data: Record<string, string>;
}

/**
 * Save pre-chat form custom values
 */
export const savePreChatCustomValue = async (data: PreChatFormData) => {
  const response = await serverApi.post(ENDPOINTS.SAVE_PRECHAT_VALUES, data);
  return response.data;
};
