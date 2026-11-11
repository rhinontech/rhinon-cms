import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/** Android emulators reach the host machine at 10.0.2.2; iOS simulators and web use localhost. */
const DEFAULT_BASE = Platform.OS === "android" ? "http://10.0.2.2:5055" : "http://localhost:5055";
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE;

const KEY = "rhinon-session";
export type Session = { token: string; userId: string; fullName: string; roleSlug: string; orgName: string };

let session: Session | null = null;
/** The brand (site) the Inbox, CRM, Outreach and Analytics are scoped to; the API reads it from X-Site-Slug. */
let siteSlug: string | null = null;
export const setSiteSlug = (slug: string | null) => { siteSlug = slug; };
const listeners = new Set<() => void>();
export const getSession = () => session;
export const onSession = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

const store = {
  get: async () => (Platform.OS === "web" ? globalThis.localStorage?.getItem(KEY) ?? null : SecureStore.getItemAsync(KEY)),
  set: async (v: string) => (Platform.OS === "web" ? void globalThis.localStorage?.setItem(KEY, v) : SecureStore.setItemAsync(KEY, v)),
  del: async () => (Platform.OS === "web" ? void globalThis.localStorage?.removeItem(KEY) : SecureStore.deleteItemAsync(KEY)),
};

export async function restoreSession(): Promise<Session | null> {
  try { const raw = await store.get(); session = raw ? (JSON.parse(raw) as Session) : null; } catch { session = null; }
  return session;
}
export async function setSession(s: Session | null) {
  session = s;
  try { if (s) await store.set(JSON.stringify(s)); else await store.del(); } catch { /* session just won't survive a restart */ }
  listeners.forEach((l) => l());
}

export class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }

export async function api<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method ?? "GET",
    headers: { "Content-Type": "application/json", ...(init.auth !== false && session ? { Authorization: `Bearer ${session.token}` } : {}), ...(siteSlug ? { "X-Site-Slug": siteSlug } : {}) },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (res.status === 401 && init.auth !== false) await setSession(null);
  if (!res.ok) throw new ApiError(data.message ?? `Request failed (${res.status})`, res.status);
  return data as T;
}

type LoginReply = { token?: string; fullName?: string; roleSlug?: string; organization?: { name: string }; mfaRequired?: boolean; mfaToken?: string };
const userIdOf = (token: string): string => {
  try { const b = token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/"); return (JSON.parse(globalThis.atob(b)) as { userId?: string }).userId ?? ""; } catch { return ""; }
};
const toSession = (r: LoginReply): Session => ({ token: r.token!, userId: userIdOf(r.token!), fullName: r.fullName ?? "", roleSlug: r.roleSlug ?? "", orgName: r.organization?.name ?? "" });

/** Returns an mfaToken when the account needs a code, else signs in. */
export async function login(email: string, password: string): Promise<{ mfaToken: string } | null> {
  const r = await api<LoginReply>("/auth/login", { method: "POST", body: { email, password }, auth: false });
  if (r.mfaRequired && r.mfaToken) return { mfaToken: r.mfaToken };
  await setSession(toSession(r));
  return null;
}
export async function loginMfa(mfaToken: string, code: string) {
  await setSession(toSession(await api<LoginReply>("/auth/login/mfa", { method: "POST", body: { mfaToken, code }, auth: false })));
}
export const logout = () => setSession(null);

/** POST a multipart form (a receipt, a document). The boundary header is set by fetch. */
export async function upload<T>(path: string, form: FormData, method = "POST"): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method, headers: { ...(session ? { Authorization: `Bearer ${session.token}` } : {}), ...(siteSlug ? { "X-Site-Slug": siteSlug } : {}) }, body: form });
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (res.status === 401) await setSession(null);
  if (!res.ok) throw new ApiError(data.message ?? `Upload failed (${res.status})`, res.status);
  return data as T;
}
