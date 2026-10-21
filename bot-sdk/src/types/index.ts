// Re-export all types from a single entry point

// Message types
export {
  type MessageRole,
  type Message,
  type ChatWithAssistantRequest,
  type GetChatHistoryRequest,
} from './message.types';

// Config types
export {
  type Theme,
  type ChatbotConfig,
  type FormField,
  type PostChatFormConfig,
  type SalesziumConfig,
  type WhatsAppConfig,
} from './config.types';

// Campaign types
export {
  type ButtonElement,
  type TemplateMedia,
  type CampaignContent,
  type CampaignCondition,
  type CampaignRules,
  type CampaignTrigger,
  type CampaignTargeting,
  type Campaign,
  type VisitorData,
  type CampaignView,
  type CampaignViews,
} from './campaign.types';

// Chat types
export {
  type Conversation,
  type ConversationSummary,
  type ConversationItem,
  type ChatScreenProps,
  type ChatLogicProps,
  type ChatLogicReturn,
  type ActiveScreen,
} from './chat.types';

// Ticket types
export {
  type TicketConversation,
  type TicketCreatePayload,
  type Ticket,
  type TicketField,
} from './ticket.types';

// Help types
export {
  type Article,
  type Folder,
  type NewsItem,
} from './help.types';

// Screen prop types
export {
  type SelectedNewsProps,
  type SelectedHelpArticleProps,
  type HomeScreenProps,
  type ChatHistoryScreenProps,
  type HelpScreenProps,
  type HelpArticlePageProps,
  type NewsScreenProps,
  type NewsPageProps,
  type VoiceScreenProps,
  type TicketScreenProps,
  type CampaignsProps,
} from './screen.types';
