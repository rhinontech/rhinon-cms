// Chat store - handles current chat state
import { create } from 'zustand';
import type { Message, Campaign } from '@/types';

interface ChatState {
  // Conversation state
  selectedChatId: string | null;
  isSpeakingWithRealPerson: boolean;
  isTicketRaised: boolean;
  
  // Campaign state
  activeCampaign: Campaign | undefined;
  
  // Feature flags
  isApiKeyProvided: boolean;
  isFreePlan: boolean;
  
  // Actions
  setSelectedChatId: (id: string | null) => void;
  setIsSpeakingWithRealPerson: (isSpeaking: boolean) => void;
  setIsTicketRaised: (isRaised: boolean) => void;
  setActiveCampaign: (campaign: Campaign | undefined) => void;
  setIsApiKeyProvided: (provided: boolean) => void;
  setIsFreePlan: (isFree: boolean) => void;
  reset: () => void;
}

const initialState: Omit<ChatState, 'setSelectedChatId' | 'setIsSpeakingWithRealPerson' | 'setIsTicketRaised' | 'setActiveCampaign' | 'setIsApiKeyProvided' | 'setIsFreePlan' | 'reset'> = {
  selectedChatId: null as string | null,
  isSpeakingWithRealPerson: false,
  isTicketRaised: false,
  activeCampaign: undefined as Campaign | undefined,
  isApiKeyProvided: false,
  isFreePlan: false,
};

export const useChatStore = create<ChatState>((set) => ({
  ...initialState,

  setSelectedChatId: (id) => set({ selectedChatId: id }),
  setIsSpeakingWithRealPerson: (isSpeaking) => 
    set({ isSpeakingWithRealPerson: isSpeaking }),
  setIsTicketRaised: (isRaised) => set({ isTicketRaised: isRaised }),
  setActiveCampaign: (campaign) => set({ activeCampaign: campaign }),
  setIsApiKeyProvided: (provided) => set({ isApiKeyProvided: provided }),
  setIsFreePlan: (isFree) => set({ isFreePlan: isFree }),
  reset: () => set(initialState),
}));
