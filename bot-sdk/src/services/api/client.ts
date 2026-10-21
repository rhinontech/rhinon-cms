// API client configuration with axios instances and interceptors
import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Where the backend is, in order:
 *   1. `api_url` passed to RhinonChat({ … }) — see setApiBase, applied at init;
 *   2. the script's own address, when loaded as the hosted
 *      /widget/rhinon-chat.js (or the old /widget/rhinonbot.js) — so the same
 *      file served by prod, beta or a laptop talks to that same server;
 *   3. production, for the npm package (bundled into the customer's own app,
 *      where `currentScript` is their bundle, not ours).
 * `currentScript` is only set while the bundle executes, which is when this runs.
 */
const PRODUCTION_API = 'https://api.rhinontech.in/widget';

const scriptBase = (() => {
  try {
    const src = (typeof document !== 'undefined' && (document.currentScript as HTMLScriptElement | null)?.src) || '';
    const url = new URL(src);
    if (!/\/(rhinon-chat|rhinonbot)\.js$/.test(url.pathname)) return '';
    return `${url.origin}${url.pathname.replace(/\/(rhinon-chat|rhinonbot)\.js$/, '')}`;
  } catch {
    return '';
  }
})();

const normalizeBase = (base: string) => base.replace(/\/+$/, '');
let API_BASE_URL = normalizeBase(process.env.REACT_APP_NEW_SERVER_API_URL || scriptBase || PRODUCTION_API);
let AI_API_URL = normalizeBase(process.env.REACT_APP_API_URL_AI || API_BASE_URL);
let SOCKET_URL = process.env.REACT_APP_SOCKET_URL || new URL(API_BASE_URL).origin;

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

/** Admin "test your bot" mode: chats are tagged so they stay out of Live chats and the CRM. */
let testingMode = false;
export const setTestingMode = (on: boolean) => {
  testingMode = on;
};
export const asVisitorId = (id: string): string => (testingMode && !id.startsWith('admin-test-') ? `admin-test-${id}` : id);

const attachAppId = (config: any) => {
  if (!currentAppId) return config;
  config.params = { chatbot_id: currentAppId, ...(config.params || {}) };
  return config;
};
serverApi.interceptors.request.use(attachAppId);
aiApi.interceptors.request.use(attachAppId);

/** Point the widget at a specific backend (RhinonChat({ api_url })). Call before it renders. */
export const setApiBase = (base: string) => {
  API_BASE_URL = normalizeBase(base);
  AI_API_URL = API_BASE_URL;
  SOCKET_URL = new URL(API_BASE_URL).origin;
  serverApi.defaults.baseURL = API_BASE_URL;
  aiApi.defaults.baseURL = AI_API_URL;
};

export const getSocketUrl = (): string => SOCKET_URL;
export const getAiApiUrl = (): string => AI_API_URL;
export const getServerApiUrl = (): string => API_BASE_URL;

export default serverApi;
