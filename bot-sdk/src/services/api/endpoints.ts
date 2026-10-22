// API endpoint constants

export const ENDPOINTS = {
  // Chatbot config
  CHATBOT_CONFIG: '/chatbot/chatbot',
  CHATBOT_SET_INSTALLED: '/chatbot/set-installed',
  WHATSAPP_CONFIG: '/chatbot/whatsapp-config',
  CUSTOMER_PHONE: '/chatbot/customer-phone',

  // Chat & Conversations
  CHAT: '/gcs/standard/chat', // Updated to use GCS endpoint
  CHAT_HISTORY: '/chat_history',
  CONVERSATION_BY_USER_ID: '/conversation_by_user_id',
  SET_USER_ASSISTANT: '/standard/set_user_assistant', // Updated to use RAG endpoint

  // Socket Conversations
  SOCKET_CONVERSATION: '/conversations/socketConversation',
  SOCKET_CONVERSATION_CLOSE: '/conversations/socketConversation/close',
  SUBMIT_REVIEW: '/conversations/submit-review',

  // Forms
  CHATBOT_FORMS: '/forms/chatbot-forms',
  SAVE_PRECHAT_VALUES: '/forms/save-prechat-forms-values',

  // Tickets
  CREATE_TICKET: '/tickets/create-from-ticket',
  GET_TICKETS: '/tickets/get-tickets',
  TICKET_RATING: '/tickets/ticket-rating',

  // Help / Articles
  FOLDERS_STRUCTURE: '/folders/chatbot-structure',
  ARTICLES: '/articles',

  // Campaigns
  CAMPAIGNS_CHATBOT: '/campaigns/chatbot/all',

  // Files
  FILE_UPLOAD_CONVERSATION: '/aws/fileUploadForConversation',
  PRESIGNED_URL: '/aws/presigned-url',

  // SEO / Analytics
  SEO_PAGEVIEW: '/seo/pageview',
  SEO_BOUNCE: '/seo/bounce',
  SEO_SCROLL: '/seo/scroll',
  SEO_CLICK: '/seo/click',
  SEO_TIME_ON_PAGE: '/seo/timeOnPage',
  SEO_COMPLAINT_URL: '/seo/complaint-url',
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
