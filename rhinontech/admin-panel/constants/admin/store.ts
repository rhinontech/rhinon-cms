import { create } from "zustand";
import { persist } from "zustand/middleware";
 
interface ColorState {
  primaryColor: string;
  setPrimaryColor: (newColor: string) => void;
  secondaryColor: string;
  setSecondaryColor: (newColor: string) => void;
  greeting: string[];
  setGreeting: (value: string[]) => void;
  firstConversation: string;
  setFirstConversation: (value: string) => void;
}
 
export const useColorStore = create<ColorState>()(
  persist(
    (set) => ({
      primaryColor: "#172554",
      setPrimaryColor: (newColor: string) => set({ primaryColor: newColor }),
      secondaryColor: "#172554",
      setSecondaryColor: (newColor: string) => set({ secondaryColor: newColor }),
      greeting: ['Hi there👋', 'How can we help?'],
      setGreeting: (value: string[]) => set({ greeting: value }),
      firstConversation: "Hi there. I’m Rino. How can I help you today?",
      setFirstConversation: (value: string) => set({ firstConversation: value }),
    }),
    {
      name: "color-storage",
    }
  )
);
 