import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/lib/config";
import type { SessionUser } from "@/lib/types";

const TOKEN_KEY = "rhinon_mobile_token";

let unauthorizedHandler: null | (() => Promise<void> | void) = null;
let memoryToken: string | null = null;

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function getStoredToken() {
  try {
    if (typeof SecureStore.getItemAsync === "function") {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        memoryToken = token;
        return token;
      }
    }
  } catch {
    // Fall back to AsyncStorage when SecureStore is unavailable in the current runtime.
  }

  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      memoryToken = token;
      return token;
    }
  } catch {
    // Fall back to in-memory storage when AsyncStorage is unavailable in the current runtime.
  }

  return memoryToken;
}

export async function setStoredToken(token: string) {
  memoryToken = token;

  try {
    if (typeof SecureStore.setItemAsync === "function") {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      return;
    }
  } catch {
    // Fall back to AsyncStorage when SecureStore is unavailable in the current runtime.
  }

  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Keep the token in memory when persistent storage is unavailable.
  }
}

export async function clearStoredToken() {
  memoryToken = null;

  try {
    if (typeof SecureStore.deleteItemAsync === "function") {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // Fall back to AsyncStorage when SecureStore is unavailable in the current runtime.
  }

  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore cleanup failures from the fallback store.
  }
}

export function registerUnauthorizedHandler(handler: () => Promise<void> | void) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  const token = await getStoredToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new ApiError(0, buildNetworkErrorMessage(), error);
  }

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (response.status === 401) {
    await clearStoredToken();
    await unauthorizedHandler?.();
    throw new ApiError(401, (data as any)?.error || "Unauthorized", data);
  }

  if (!response.ok) {
    throw new ApiError(response.status, (data as any)?.error || "Request failed", data);
  }

  return data as T;
}

export const mobileAuthApi = {
  login(email: string, password: string) {
    return apiRequest<{ token: string; user: SessionUser }>("/api/mobile/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  me() {
    return apiRequest<SessionUser>("/api/mobile/auth/me");
  },
  logout() {
    return apiRequest<{ success: true }>("/api/mobile/auth/logout", {
      method: "POST",
    });
  },
};

function safeJson(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

function buildNetworkErrorMessage() {
  if (API_BASE_URL.includes("localhost")) {
    return `Cannot reach ${API_BASE_URL}. If this is a physical device, replace localhost with your computer's LAN IP.`;
  }

  return `Cannot reach ${API_BASE_URL}. Verify the backend is running and the mobile API base URL is correct.`;
}
