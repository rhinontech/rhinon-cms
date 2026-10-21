// Screen component prop type definitions
// Centralized types for all screen components

import type { ChatbotConfig, FormField, PostChatFormConfig } from './config.types';
import type { TicketField } from './ticket.types';
import type { Article, Folder, NewsItem } from './help.types';

// ============ Messenger Hook Types ============

export interface SelectedNewsProps {
  title: string;
  content: string;
  img: string;
  tags: string[];
  authorImg: string;
  authorName: string;
  updatedAt: string;
}

export interface SelectedHelpArticleProps {
  articleId: string;
  title: string;
  content: string;
  status: string;
  views: number;
  likes: number;
  dislikes: number;
  createdAt: string;
  updated_at: string;
}

// ============ Screen Props Types ============

export interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  isAdmin?: boolean;
  isFreePlan?: boolean;
  userId: string;
  appId: string;
  chatbot_config?: ChatbotConfig;
  setIsTicketRaised: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedChatId: React.Dispatch<React.SetStateAction<string>>;
  ticketForm: TicketField[];
  userEmail: string;
  onChatSelect: (chatId: string) => void;
  mainLoading: boolean;
  showNotification: boolean;
}

export interface ChatHistoryScreenProps {
  isFreePlan: boolean;
  onChatSelect: (chatId: string) => void;
  setIsSpeakingWithRealPerson: React.Dispatch<React.SetStateAction<boolean>>;
  userId: string;
  appId: string;
  chatbot_config?: ChatbotConfig;
  isAdmin?: boolean;
}

export interface HelpScreenProps {
  onNavigate: (screen: string) => void;
  chatbot_config?: ChatbotConfig;
  setSelectedHelpArticle: React.Dispatch<React.SetStateAction<Article | null>>;
  setSelectedHelp: React.Dispatch<React.SetStateAction<Folder | null>>;
  selectedHelp: Folder | null;
  appId: string;
}

export interface HelpArticlePageProps {
  chatbot_config?: ChatbotConfig;
  setWindowWidth: React.Dispatch<React.SetStateAction<string>>;
  setSelectedHelpArticle: React.Dispatch<React.SetStateAction<Article | null>>;
  selectedHelpArticle: Article;
}

export interface NewsScreenProps {
  chatbot_config?: ChatbotConfig;
  setSelectedNews: React.Dispatch<React.SetStateAction<NewsItem | null>>;
}

export interface NewsPageProps {
  chatbot_config?: ChatbotConfig;
  setWindowWidth: React.Dispatch<React.SetStateAction<string>>;
  setSelectedNews: React.Dispatch<React.SetStateAction<NewsItem | null>>;
  selectedNews: NewsItem;
}

export interface VoiceScreenProps {
  appId: string;
  onButtonClick: () => void;
  isAdmin?: boolean;
  userEmail?: string;
}

export interface TicketScreenProps {
  appId: string;
  setIsTicketRaised: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenTicket: React.Dispatch<React.SetStateAction<boolean>>;
  chatbot_config: ChatbotConfig;
  ticketForm: TicketField[];
}

export interface CampaignsProps {
  setIsOpen: (val: boolean) => void;
  activeCampaign: import('./campaign.types').Campaign;
}
