import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, API_URL, ApiError, setSessionToken, setUnauthorizedHandler, tokenStore } from "./api";
import type { LoginResponse, Me } from "./types";

type SignInResult = { status: "ok" } | { status: "mfa"; mfaToken: string };

interface AuthContextValue {
  /** null while the stored session is being restored. */
  status: "loading" | "signedOut" | "signedIn";
  me: Me | null;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  verifyMfa: (mfaToken: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  /** Mirrors the admin panel: superadmin passes every check. UI hint only — the API enforces. */
  can: (...anyOf: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * External collaborators live in the web portal; the mobile app is the internal
 * workspace only, so their sessions are refused here rather than half-working.
 */
function assertInternal(res: LoginResponse | Me) {
  if (res.userType === "guest" || res.roleSlug === "collaborator") {
    throw new ApiError("Collaborator accounts use the web portal — the mobile app is for team members.", 403);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [me, setMe] = useState<Me | null>(null);

  const signOut = useCallback(async () => {
    api.post("/auth/logout").catch(() => {});
    setSessionToken(null);
    await tokenStore.clear();
    setMe(null);
    setStatus("signedOut");
  }, []);

  const loadMe = useCallback(async () => {
    const profile = await api.get<Me>("/auth/me");
    assertInternal(profile);
    setMe(profile);
    setStatus("signedIn");
  }, []);

  const startSession = useCallback(
    async (res: LoginResponse) => {
      if (!res.token) throw new ApiError("Sign-in failed", 500);
      assertInternal(res);
      setSessionToken(res.token);
      await tokenStore.set(res.token);
      await loadMe();
    },
    [loadMe]
  );

  // Restore a saved session on launch.
  useEffect(() => {
    setUnauthorizedHandler(() => void signOut());
    (async () => {
      const token = await tokenStore.get();
      if (!token) return setStatus("signedOut");
      setSessionToken(token);
      try {
        // An unreachable server can hang for a minute; don't hold the first screen for it.
        await Promise.race([
          loadMe(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new ApiError(`Can't reach the server at ${API_URL}`, 0)), 8000)),
        ]);
      } catch (err) {
        // Offline at launch is not "signed out" — only a rejected token is.
        if (err instanceof ApiError && err.status === 0) {
          setStatus("signedIn");
        } else {
          await signOut();
        }
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, [loadMe, signOut]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      const res = await api.post<LoginResponse>("/auth/login", { email: email.trim(), password });
      if (res.mfaRequired && res.mfaToken) return { status: "mfa", mfaToken: res.mfaToken };
      await startSession(res);
      return { status: "ok" };
    },
    [startSession]
  );

  const verifyMfa = useCallback(
    async (mfaToken: string, code: string) => {
      const res = await api.post<LoginResponse>("/auth/login/mfa", { mfaToken, code: code.trim() });
      await startSession(res);
    },
    [startSession]
  );

  const can = useCallback(
    (...anyOf: string[]) => {
      if (!me) return false;
      if (me.roleSlug === "superadmin") return true;
      return anyOf.some((p) => me.permissions.includes(p));
    },
    [me]
  );

  const value = useMemo(
    () => ({ status, me, signIn, verifyMfa, signOut, refreshMe: loadMe, can }),
    [status, me, signIn, verifyMfa, signOut, loadMe, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
