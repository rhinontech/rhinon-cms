// Message type definitions

export type MessageRole =
  | 'user'
  | 'bot'
  | 'separator'
  | 'support'
  | 'trigger'
  | 'timeout'
  | 'whatsapp_qr'
  | 'email_request'
  | 'phone_request'
  | 'whatsapp_trigger';

export interface Message {
  id?: number;
  text: string;
  role: MessageRole;
  timestamp: string;
  user_email?: string;
  user_id?: string;
  chatbot_id?: string;
  chatbot_history?: string;
  isEmailForm?: boolean;
  sender_name?: string;
  sender_image?: string;
  streamComplete?: boolean; // Flag to indicate streaming is done
}

export interface ChatWithAssistantRequest {
  user_id: string;
  user_email: string;
  chatbot_id: string;
  conversation_id: string;
  prompt: string;
  isFreePlan: boolean;
  currentPlan: string;
}

export interface GetChatHistoryRequest {
  user_id: string;
  chatbot_id: string;
  conversation_id: string;
}
