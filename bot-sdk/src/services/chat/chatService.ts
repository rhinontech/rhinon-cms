// Chat service - handles AI conversations
import { aiApi, getAiApiUrl } from '../api';
import { ENDPOINTS } from '../api/endpoints';
import type { ChatWithAssistantRequest, GetChatHistoryRequest, Message } from '@/types';

/**
 * Set user assistant for a chatbot
 */
export const setUserAssistant = async (chatbotId: string) => {
  const response = await aiApi.post(ENDPOINTS.SET_USER_ASSISTANT, {
    chatbot_id: chatbotId,
  });
  return response.data;
};

/**
 * Chat with AI assistant using streaming
 * Updated for RAG backend (/standard/chat)
 */
export const chatWithAssistant = async (
  requestBody: ChatWithAssistantRequest,
  onToken: (token: string) => void,
  onComplete?: (data?: any) => void,
  onError?: (error: any) => void
): Promise<void> => {
  try {
    const AI_API_URL = getAiApiUrl();
    
    // Transform request to match backend format
    const backendPayload = {
      chatbot_id: requestBody.chatbot_id,
      user_id: requestBody.user_id,
      user_email: requestBody.user_email,
      prompt: requestBody.prompt,
      conversation_id: requestBody.conversation_id,
    };

    const response = await fetch(`${AI_API_URL}${ENDPOINTS.CHAT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('No readable stream');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');

      for (let i = 0; i < parts.length - 1; i++) {
        const line = parts[i];
        if (!line.startsWith('data:')) continue;

        try {
          const data = JSON.parse(line.slice(5).trim());

          // Handle thread_created event (new conversation)
          if (data.event === 'thread_created' && data.thread_id) {
            onComplete?.({ conversation_id: data.thread_id });
          }

          // Stream tokens
          if (data.token) onToken(data.token);

          // Final event
          if (data.event === 'end') {
            onComplete?.(data);
          }

          // Error
          if (data.error) onError?.(data.error);
        } catch (err) {
          console.error('Parse SSE chunk error:', err);
        }
      }

      buffer = parts[parts.length - 1];
    }
  } catch (error) {
    console.error('Streaming error:', error);
    onError?.(error);
  }
};

/**
 * Get chat history for a conversation
 */
export const getChatHistory = async (requestBody: GetChatHistoryRequest) => {
  const response = await aiApi.post(ENDPOINTS.CHAT_HISTORY, requestBody);
  return response.data;
};

/**
 * Get conversations by user ID
 */
export const getConversationByUserId = async (userId: string, appId: string) => {
  const response = await aiApi.post(ENDPOINTS.CONVERSATION_BY_USER_ID, {
    user_id: userId,
    chatbot_id: appId,
  });
  return response.data;
};
