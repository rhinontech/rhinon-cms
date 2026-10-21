// API client configuration with axios instances and interceptors
import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Where the backend is. A production build carries no URL: it is served by the
 * backend itself (/widget/rhinonbot.js), so the script's own address says which
 * one — prod, beta or local — and a build can never point at the wrong server.
 * `currentScript` is only set while the bundle executes, which is when this runs.
 */
const scriptBase = (() => {
  try {
    const src = (typeof document !== 'undefined' && (document.currentScript as HTMLScriptElement | null)?.src) || '';
    if (!src) return '';
    const url = new URL(src);
    return `${url.origin}${url.pathname.replace(/\/rhinonbot\.js$/, '')}`;
  } catch {
    return '';
  }
})();

const API_BASE_URL = process.env.REACT_APP_NEW_SERVER_API_URL || scriptBase;
const AI_API_URL = process.env.REACT_APP_API_URL_AI || scriptBase;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || (scriptBase ? new URL(scriptBase).origin : '');

// Create axios instance for main server API
export const serverApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for AI API
export const aiApi: AxiosInstance = axios.create({
  baseURL: AI_API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response error handler
const handleResponseError = (error: AxiosError): Promise<never> => {
  if (error.response) {
    // Server responded with error status
    console.error('API Error Response:', error.response.status, error.response.data);
  } else if (error.request) {
    // Request made but no response
    console.error('API No Response:', error.request);
  } else {
    // Error setting up request
    console.error('API Request Error:', error.message);
  }
  return Promise.reject(error);
};

// Add response interceptors
serverApi.interceptors.response.use(
  (response) => response,
  handleResponseError
);

aiApi.interceptors.response.use(
  (response) => response,
  handleResponseError
);

// Export URLs for socket connections
/**
 * The bot this page embeds. Every backend call carries it, because the server
 * scopes everything to the bot's own workspace — Saleszium's phone lookup and
 * file-link endpoints took no id and searched or signed across every tenant.
 */
let currentAppId = '';
export const setCurrentAppId = (appId: string) => {
  currentAppId = appId;
};
export const getCurrentAppId = (): string => currentAppId;

const attachAppId = (config: any) => {
  if (!currentAppId) return config;
  config.params = { chatbot_id: currentAppId, ...(config.params || {}) };
  return config;
};
serverApi.interceptors.request.use(attachAppId);
aiApi.interceptors.request.use(attachAppId);

export const getSocketUrl = (): string => SOCKET_URL;
export const getAiApiUrl = (): string => AI_API_URL;
export const getServerApiUrl = (): string => API_BASE_URL;

export default serverApi;
