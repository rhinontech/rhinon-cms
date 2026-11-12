"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { acquireTeamChatSocket, releaseTeamChatSocket } from "@/components/Admin/Chat/teamChatApi";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  count: number;
  readAt: string | null;
  updatedAt: string;
}

const PAGE = 20;

/** The user's notifications, live over the socket Team Chat already keeps open. */
export function useNotifications() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<{ items: AppNotification[]; unread: number }>(`/notifications?limit=${PAGE}`);
      setItems(d.items);
      setUnread(d.unread);
      setHasMore(d.items.length === PAGE);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const socket = acquireTeamChatSocket();
    if (!socket) return;
    const onNotification = (n: AppNotification) => {
      setItems((cur) => [n, ...cur.filter((x) => x.id !== n.id)]);
      // A regrouped one may already be counted; ask the server rather than guess.
      load();
    };
    socket.on("notification", onNotification);
    // Catch anything sent while the connection was down.
    socket.io.on("reconnect", load);
    return () => {
      socket.off("notification", onNotification);
      socket.io.off("reconnect", load);
      releaseTeamChatSocket();
    };
  }, [load]);

  const loadMore = useCallback(async () => {
    const last = items[items.length - 1];
    if (!last) return;
    const d = await apiFetch<{ items: AppNotification[] }>(`/notifications?limit=${PAGE}&before=${encodeURIComponent(last.updatedAt)}`);
    setItems((cur) => [...cur, ...d.items]);
    setHasMore(d.items.length === PAGE);
  }, [items]);

  const markRead = useCallback((n: AppNotification) => {
    if (n.readAt) return;
    const now = new Date().toISOString();
    setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, readAt: now } : x)));
    setUnread((u) => Math.max(0, u - 1));
    apiFetch(`/notifications/${n.id}/read`, { method: "POST" }).catch(load);
  }, [load]);

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    setItems((cur) => cur.map((x) => x.readAt ? x : { ...x, readAt: now }));
    setUnread(0);
    apiFetch("/notifications/read-all", { method: "POST" }).catch(load);
  }, [load]);

  return { items, unread, loading, error, hasMore, load, loadMore, markRead, markAllRead };
}
