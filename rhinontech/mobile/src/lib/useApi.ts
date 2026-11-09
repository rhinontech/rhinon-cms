import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "./api";

interface Options {
  /** Skip the request (e.g. the user lacks the permission). */
  enabled?: boolean;
  /** Re-poll every N ms while the screen is focused. */
  pollMs?: number;
}

/**
 * Minimal fetch-on-mount hook with pull-to-refresh and focus polling.
 * Keeps the last good data on a failed refresh so the screen doesn't blank out.
 */
export function useApi<T>(path: string | null, { enabled = true, pollMs }: Options = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pathRef = useRef(path);
  pathRef.current = path;

  const load = useCallback(async (mode: "initial" | "refresh" | "silent") => {
    const current = pathRef.current;
    if (!current) return;
    if (mode === "refresh") setRefreshing(true);
    try {
      const next = await api.get<T>(current);
      if (pathRef.current === current) {
        setData(next);
        setError(null);
      }
    } catch (err) {
      if (mode !== "silent") setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !path) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void load("initial");
  }, [path, enabled, load]);

  // Coming back to a screen (say, from an edit form) shows the latest data.
  const focusedBefore = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (enabled && focusedBefore.current) void load("silent");
      focusedBefore.current = true;
      if (!enabled || !pollMs) return;
      const id = setInterval(() => void load("silent"), pollMs);
      return () => clearInterval(id);
    }, [enabled, pollMs, load])
  );

  return {
    data,
    setData,
    error,
    loading,
    refreshing,
    refresh: useCallback(() => load("refresh"), [load]),
    reload: useCallback(() => load("silent"), [load]),
  };
}
