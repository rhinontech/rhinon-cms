"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { TbBell, TbLoader } from "react-icons/tb";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationList } from "./NotificationList";
import { useNotifications, type AppNotification } from "./useNotifications";

export function NotificationBell() {
  const { items, unread, loading, error, load, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const role = pathname.split("/")[1];

  const openItem = (n: AppNotification) => {
    markRead(n);
    setOpen(false);
    if (n.link) router.push(`/${role}${n.link}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <TbBell size={18} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(380px,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          {unread > 0 && <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline dark:text-blue-300">Mark all read</button>}
        </div>
        <div className="max-h-[420px] overflow-auto">
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><TbLoader className="animate-spin" size={15} /> Loading…</p>
          ) : error ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Couldn&apos;t load notifications.{" "}
              <button onClick={load} className="text-blue-600 hover:underline dark:text-blue-300">Retry</button>
            </div>
          ) : items.length ? (
            <NotificationList items={items} onOpen={openItem} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          )}
        </div>
        <Link href={`/${role}/notifications`} onClick={() => setOpen(false)} className="block border-t px-4 py-2.5 text-center text-xs font-medium text-foreground/75 hover:bg-muted/50">
          See all notifications
        </Link>
      </PopoverContent>
    </Popover>
  );
}
