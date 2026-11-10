import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CONFIGURED_URL = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

/**
 * In development the laptop's address changes with the network, and a stale one
 * leaves the app waiting on a host that isn't there. Metro's host is by definition
 * reachable from this device, so a local backend URL follows it. Real hostnames
 * (and release builds, which have no Metro) are left alone.
 */
function resolveApiUrl(): string {
  const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (!__DEV__ || !metroHost) return CONFIGURED_URL;
  return CONFIGURED_URL.replace(/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.[\d.]+|10\.[\d.]+|172\.(?:1[6-9]|2\d|3[01])\.[\d.]+)(?=:|$)/, `http://${metroHost}`);
}

export const API_URL = resolveApiUrl();

const TOKEN_KEY = "rhinon.authToken";

/**
 * The session token lives in the platform keychain (SecureStore), never in
 * AsyncStorage — the web admin panel keeps it in a JS-readable cookie, which is
 * exactly what this app should not copy. Web has no SecureStore, so the dev web
 * build falls back to localStorage.
 */
export const tokenStore = {
  async get(): Promise<string | null> {
    if (Platform.OS === "web") return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async set(token: string): Promise<void> {
    if (Platform.OS === "web") return void globalThis.localStorage?.setItem(TOKEN_KEY, token);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clear(): Promise<void> {
    if (Platform.OS === "web") return void globalThis.localStorage?.removeItem(TOKEN_KEY);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

/** Same shape as the admin panel's ApiError: the server's message, plus status and code. */
export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

// Held in memory so every request doesn't hit the keychain.
let currentToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setSessionToken(token: string | null) {
  currentToken = token;
}

export function getSessionToken() {
  return currentToken;
}

/** Called once by the auth provider so an expired session signs the user out. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } catch {
    throw new ApiError(`Can't reach the server at ${API_URL}`, 0);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as Record<string, unknown>);
    if (res.status === 401 && currentToken) onUnauthorized?.();
    const message = (body.message as string) || (body.error as string) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body.code as string | undefined);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
