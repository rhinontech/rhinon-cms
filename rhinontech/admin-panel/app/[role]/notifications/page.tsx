"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { NotificationList } from "@/components/Admin/Common/Notifications/NotificationList";
import { useNotifications, type AppNotification } from "@/components/Admin/Common/Notifications/useNotifications";

function NotificationSettings() {
  const [data, setData] = useState<{ categories: { key: string; label: string }[]; muted: string[] } | null>(null);
  useEffect(() => {
    apiFetch<typeof data>("/notifications/settings").then(setData).catch(() => setData(null));
  }, []);
  if (!data) return <p className="p-4 text-sm text-muted-foreground">Loading settings…</p>;
  const toggle = async (key: string, on: boolean) => {
    const muted = on ? data.muted.filter((k) => k !== key) : [...data.muted, key];
    setData({ ...data, muted });
    try {
      await apiFetch("/notifications/settings", { method: "PUT", body: JSON.stringify({ muted }) });
    } catch (err: any) {
      toast.error(err.message || "Could not save");
    }
  };
  return (
    <div className="mb-4 divide-y rounded-xl border">
      {data.categories.map((c) => (
        <label key={c.key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-foreground/85">
          {c.label}
          <Switch checked={!data.muted.includes(c.key)} onCheckedChange={(on) => void toggle(c.key, on)} />
        </label>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const [showSettings, setShowSettings] = useState(false);
  const { items, unread, loading, error, hasMore, load, loadMore, markRead, markAllRead } = useNotifications();
  const { role } = useParams<{ role: string }>();
  const router = useRouter();
  const open = (n: AppNotification) => {
    markRead(n);
    if (n.link) router.push(`/${role}${n.link}`);
  };

  return (
    <AdminDashboardShell>
      <div className="h-full overflow-auto rounded-xl glass-panel">
        <div className="mx-auto max-w-3xl p-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Notifications</h1>
            <div className="flex items-center gap-3">
              {unread > 0 && <button onClick={markAllRead} className="text-sm text-blue-600 hover:underline dark:text-blue-300">Mark all read</button>}
              <button onClick={() => setShowSettings((v) => !v)} className="text-sm text-foreground/70 hover:underline">Settings</button>
            </div>
          </div>
          {showSettings && <NotificationSettings />}
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Couldn&apos;t load notifications. <button onClick={load} className="text-blue-600 hover:underline dark:text-blue-300">Retry</button>
            </div>
          ) : items.length ? (
            <div className="overflow-hidden rounded-xl border">
              <NotificationList items={items} onOpen={open} />
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          )}
          {hasMore && <button onClick={() => void loadMore()} className="mx-auto mt-4 block rounded-lg border px-4 py-2 text-sm hover:bg-muted">Load more</button>}
        </div>
      </div>
    </AdminDashboardShell>
  );
}
