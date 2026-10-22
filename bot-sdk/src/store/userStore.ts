// User store - handles user/visitor information
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { STORAGE_KEYS, COOKIE_KEYS } from '@/constants/storage';
import { USER_EMAIL_COOKIE_EXPIRY } from '@/constants/timing';

interface UserState {
  userId: string | null;
  userEmail: string | null;
  sessionId: string | null;
  isEmailAvailable: boolean;

  // Actions
  initUser: () => void;
  setUserEmail: (email: string) => void;
  clearUserEmail: () => void;
  setIsEmailAvailable: (available: boolean) => void;
  getUserId: () => string;
  getSessionId: () => string;
}

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: null as string | null,
      userEmail: null as string | null,
      sessionId: null as string | null,
      isEmailAvailable: false,

      initUser: () => {
        // Get or create user ID (persistent)
        let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (!userId) {
          userId = generateId();
          localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
        }

        // Get or create session ID (per tab)
        let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
        if (!sessionId) {
          sessionId = generateId();
          sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
        }

        // Get email from cookie
        const userEmail = Cookies.get(COOKIE_KEYS.USER_EMAIL) || null;

        set({
          userId,
          sessionId,
          userEmail,
          isEmailAvailable: !!userEmail,
        });
      },

      setUserEmail: (email) => {
        Cookies.set(COOKIE_KEYS.USER_EMAIL, email, { expires: USER_EMAIL_COOKIE_EXPIRY });
        set({ userEmail: email, isEmailAvailable: true });
      },

      clearUserEmail: () => {
        Cookies.remove(COOKIE_KEYS.USER_EMAIL);
        set({ userEmail: null, isEmailAvailable: false });
      },

      setIsEmailAvailable: (available) => set({ isEmailAvailable: available }),

      getUserId: () => {
        const state = get();
        if (state.userId) return state.userId;

        let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (!userId) {
          userId = generateId();
          localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
        }
        return userId;
      },

      getSessionId: () => {
        const state = get();
        if (state.sessionId) return state.sessionId;

        let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
        if (!sessionId) {
          sessionId = generateId();
          sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
        }
        return sessionId;
      },
    }),
    {
      name: 'rhinon-chat-user',
      partialize: (state) => ({ userId: state.userId }), // Only persist userId
    }
  )
);
