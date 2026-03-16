"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearStoredToken,
  getStoredToken,
  mobileAuthApi,
  registerUnauthorizedHandler,
  setStoredToken,
} from "@/lib/api";
import type { SessionUser } from "@/lib/types";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unregister = registerUnauthorizedHandler(async () => {
      setUser(null);
      queryClient.clear();
    });

    void hydrate();
    return unregister;
  }, [queryClient]);

  async function hydrate() {
    try {
      const token = await getStoredToken();

      if (!token) {
        setUser(null);
        return;
      }

      const currentUser = await mobileAuthApi.me();
      setUser(currentUser);
    } catch {
      setUser(null);
      await clearStoredToken();
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { token, user: loggedInUser } = await mobileAuthApi.login(email, password);
    await setStoredToken(token);
    setUser(loggedInUser);
    queryClient.clear();
  }

  async function logout() {
    try {
      await mobileAuthApi.logout();
    } catch {
      // Ignore logout API failures and clear local state regardless.
    } finally {
      await clearStoredToken();
      setUser(null);
      queryClient.clear();
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
