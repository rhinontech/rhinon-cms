// UI store - handles UI state like open/close, active screen, etc.
import { create } from 'zustand';
import type { ActiveScreen } from '@/types';

interface UIState {
  isOpen: boolean;
  activeScreen: ActiveScreen;
  windowWidth: string;
  showPopup: boolean;
  effectiveTheme: 'light' | 'dark';
  
  // Actions
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setActiveScreen: (screen: ActiveScreen) => void;
  setWindowWidth: (width: string) => void;
  setShowPopup: (show: boolean) => void;
  setEffectiveTheme: (theme: 'light' | 'dark') => void;
  reset: () => void;
}

const initialState = {
  isOpen: false,
  activeScreen: 'home' as ActiveScreen,
  windowWidth: '400px',
  showPopup: false,
  effectiveTheme: 'light' as const,
};

export const useUIStore = create<UIState>((set) => ({
  ...initialState,

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveScreen: (screen) => set({ activeScreen: screen }),
  setWindowWidth: (width) => set({ windowWidth: width }),
  setShowPopup: (show) => set({ showPopup: show }),
  setEffectiveTheme: (theme) => set({ effectiveTheme: theme }),
  reset: () => set(initialState),
}));
