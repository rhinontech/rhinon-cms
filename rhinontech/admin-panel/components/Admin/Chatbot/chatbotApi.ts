"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { io, type Socket } from "socket.io-client";
import { API_URL, apiFetch } from "@/lib/api";

export interface ChatbotForms {
  pre_chat_form: FormField[];
  post_chat_form: { enabled?: boolean; elements?: FormField[] } & Record<string, unknown>;
  ticket_form: FormField[];
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface ChatbotConfig {
  chatbotName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  theme?: "dark" | "light" | "system";
  greetings?: string[];
  popupMessage?: string;
  persona?: string;
  primaryLogo?: string;
  secondaryLogo?: string;
  isBgFade?: boolean;
  isBackgroundImage?: boolean;
  backgroundImage?: string;
  navigationOptions?: string[];
  isChatHistory?: boolean;
  [key: string]: unknown;
}

export interface Chatbot {
  id: string;
  publicId: string;
  isActive: boolean;
  config: ChatbotConfig;
  forms: ChatbotForms;
  installedAt: string | null;
  trainingStatus: "idle" | "training" | "failed";
  trainingProgress: number;
  trainingMessage: string | null;
  lastTrainedAt: string | null;
  createdAt: string;
}

export interface ChatbotState {
  chatbot: Chatbot | null;
  snippet: string | null;
  widgetUrl: string;
  plan: { used: number; blockedReason: string | null };
}

export interface ChatbotSource {
  id: string;
  kind: "url" | "sitemap" | "file" | "text";
  title: string;
  url: string | null;
  fileName: string | null;
  content: string | null;
  status: "pending" | "training" | "trained" | "failed";
  error: string | null;
  chunkCount: number;
  pageCount: number;
  trainedAt: string | null;
  createdAt: string;
}

export interface TrainingState {
  running: boolean;
  status: Chatbot["trainingStatus"];
  progress: number;
  message: string | null;
  lastTrainedAt: string | null;
}

export interface ChatConversation {
  id: string;
  chatbotId: string;
  publicKey: string;
  visitorId: string;
  visitorEmail: string | null;
  visitorName: string | null;
  visitorPhone: string | null;
  title: string;
  mode: "bot" | "human";
  status: "open" | "closed";
  assignedUserId: string | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
  isPinned: boolean;
  review: Record<string, string> | null;
  leadId: string | null;
  meta: Record<string, unknown>;
  closedAt: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "bot" | "support" | "system";
  phase: "bot" | "human";
  text: string;
  attachments: { key: string; name: string }[];
  agentUserId: string | null;
  agentName: string | null;
  createdAt: string;
}

/** The current brand's bot, plus its install snippet and plan headroom. */
export function useChatbot() {
  const [state, setState] = useState<ChatbotState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setState(await apiFetch<ChatbotState>("/chatbots"));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the chatbot");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(async (patch: { config?: Partial<ChatbotConfig>; forms?: Partial<ChatbotForms>; isActive?: boolean }) => {
    const res = await apiFetch<{ chatbot: Chatbot }>("/chatbots", { method: "PATCH", body: JSON.stringify(patch) });
    setState((prev) => (prev ? { ...prev, chatbot: res.chatbot } : prev));
    return res.chatbot;
  }, []);

  return { state, error, reload, save, setState };
}

/* ------------------------------------------------------------------ *
 * Live events. One socket per tab, shared by every screen that listens,
 * so moving between Overview, Live chats and Training doesn't reconnect.
 * ------------------------------------------------------------------ */

let socket: Socket | null = null;
let users = 0;

function acquire(): Socket | null {
  const token = Cookies.get("authToken");
  if (!token) return null;
  if (!socket) {
    socket = io(API_URL, { auth: { token }, transports: ["websocket"], reconnectionDelayMax: 10_000 });
  }
  users += 1;
  return socket;
}

function release() {
  users -= 1;
  if (users <= 0 && socket) {
    socket.disconnect();
    socket = null;
    users = 0;
  }
}

/**
 * Subscribes to live chatbot events: "chat:message", "chat:conversation",
 * "chat:visitor", "chat:handoff", "chatbot:training", "chatbot:source" …
 * The handler map may change every render; the latest one is always used.
 */
export function useChatEvents(handlers: Record<string, (data: any) => void>) {
  const ref = useRef(handlers);
  ref.current = handlers;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = acquire();
    if (!s) return;
    const onAny = (event: string, data: unknown) => ref.current[event]?.(data);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.onAny(onAny);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    setConnected(s.connected);
    return () => {
      s.offAny(onAny);
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      release();
    };
  }, []);

  return { connected };
}

/** Pops the widget open on a visitor's screen (they must be on the site now). */
export function openChatForVisitor(chatbotId: string, visitorId: string, conversationId?: string) {
  socket?.emit("open_chat", { chatbotId, visitorId, conversationId });
}

export function errorText(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}
