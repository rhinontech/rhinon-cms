"use client";

import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { AppNotification } from "./useNotifications";

export function NotificationList({ items, onOpen }: { items: AppNotification[]; onOpen: (n: AppNotification) => void }) {
  return (
    <ul className="divide-y">
      {items.map((n) => (
        <li key={n.id}>
          <button onClick={() => onOpen(n)} className={cn("flex w-full gap-2.5 px-4 py-3 text-left hover:bg-muted/50", !n.readAt && "bg-blue-500/5")}>
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-blue-500")} />
            <span className="min-w-0 flex-1">
              <span className="block break-words text-sm text-foreground">
                {n.title}
                {n.count > 1 && <span className="ml-1 text-xs text-muted-foreground">({n.count} updates)</span>}
              </span>
              {n.body && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>}
              <span className="mt-1 block text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
