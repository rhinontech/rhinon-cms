import { create } from "zustand";

interface UiState {
  activeOrganization: string;
  setActiveOrganization: (org: string) => void;
  
  isCommandMenuOpen: boolean;
  setCommandMenuOpen: (isOpen: boolean) => void;
  toggleCommandMenu: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeOrganization: "Core Ops",
  setActiveOrganization: (org) => set({ activeOrganization: org }),
  
  isCommandMenuOpen: false,
  setCommandMenuOpen: (isOpen) => set({ isCommandMenuOpen: isOpen }),
  toggleCommandMenu: () => set((state) => ({ isCommandMenuOpen: !state.isCommandMenuOpen })),
}));
