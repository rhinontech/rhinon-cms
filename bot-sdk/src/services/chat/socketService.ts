// Socket conversation service
import { serverApi } from '../api';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Get socket conversations by user ID
 */
export const getSocketConversationsByUserId = async (
  userId: string,
  chatbotId: string,
  chatbotHistory: string
) => {
  const response = await serverApi.get(ENDPOINTS.SOCKET_CONVERSATION, {
    params: { 
      user_id: userId, 
      chatbot_id: chatbotId, 
      chatbot_history: chatbotHistory 
    },
  });
  return response.data;
};

/**
 * Close a socket conversation
 */
export const closeSocketConversation = async (conversationId: string) => {
  const response = await serverApi.post(ENDPOINTS.SOCKET_CONVERSATION_CLOSE, {
    conversation_id: conversationId,
  });
  return response.data;
};

/**
 * Submit post-chat form review
 */
export const submitPostChatForm = async (
  conversationId: string,
  reviewData: Record<string, string>
) => {
  const response = await serverApi.post(ENDPOINTS.SUBMIT_REVIEW, {
    conversation_id: conversationId,
    review_data: reviewData,
  });
  return response.data;
};
