/**
 * Lazy loaded screen components
 * Uses React.lazy() for code splitting and on-demand loading
 */
import { lazy } from 'react';

// Lazy load all screens for better initial bundle size
export const LazyHomeScreen = lazy(() => import('./HomeScreen/HomeScreen'));
export const LazyChatScreen = lazy(() => import('./ChatScreen/ChatScreen'));
export const LazyChatHistoryScreen = lazy(() => import('./ChatHistoryScreen/ChatHistoryScreen'));
export const LazyHelpScreen = lazy(() => import('./HelpScreen/HelpScreen'));
export const LazyHelpArticlePage = lazy(() => import('./HelpArticlePage/HelpArticlePage'));
export const LazyNewsScreen = lazy(() => import('./NewsScreen/NewsScreen'));
export const LazyNewsPage = lazy(() => import('./NewsPage/NewsPage'));
export const LazyVoiceScreen = lazy(() => import('./VoiceScreen/Voice'));
export const LazyTicketScreen = lazy(() => import('./TicketScreen/RaiseTicket'));
export const LazyCampaigns = lazy(() => 
  import('./Campaigns/Campaigns').then(module => ({ default: module.Campaigns }))
);
