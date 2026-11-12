"use client";

import { format, isToday, isYesterday } from "date-fns";
import { TbHash, TbLock, TbUsers } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { useTeamChat } from "./store";
import type { ChatUser, Conversation, Presence } from "./types";

export const PRESENCE_COLOR: Record<Presence, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-400",
  busy: "bg-rose-500",
  dnd: "bg-rose-600",
  offline: "bg-zinc-400",
};

export const PRESENCE_LABEL: Record<Presence, string> = {
  online: "Available",
  away: "Away",
  busy: "Busy",
  dnd: "Do not disturb",
  offline: "Offline",
};

const AVATAR_COLORS = ["bg-violet-500", "bg-rose-500", "bg-sky-500", "bg-amber-500", "bg-emerald-500", "bg-indigo-500", "bg-teal-500", "bg-fuchsia-500"];
const colorFor = (id: string) => AVATAR_COLORS[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";

export const firstName = (name: string) => name.split(" ")[0];

export function UserAvatar({
  userId,
  size = "md",
  showPresence = true,
  fallbackName,
}: {
  userId: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showPresence?: boolean;
  /** For people outside the directory, e.g. meeting-link guests. */
  fallbackName?: string;
}) {
  const user = useTeamChat((s) => s.users[userId]);
  const presence = useTeamChat((s) => s.presence[userId] ?? "offline");
  const name = user?.name ?? fallbackName ?? "Unknown";
  const dims = { xs: "size-5 text-[9px]", sm: "size-7 text-[10px]", md: "size-9 text-xs", lg: "size-14 text-lg", xl: "size-24 text-3xl" }[size];
  const dot = { xs: "size-2", sm: "size-2.5", md: "size-2.5", lg: "size-3.5", xl: "size-5" }[size];
  return (
    <div className="relative shrink-0">
      {user?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt={name} className={cn("rounded-full object-cover", dims)} />
      ) : (
        <div className={cn("flex items-center justify-center rounded-full font-semibold text-white", dims, colorFor(userId))}>{initials(name)}</div>
      )}
      {showPresence && (
        <span className={cn("absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-background", dot, PRESENCE_COLOR[presence])} title={PRESENCE_LABEL[presence]} />
      )}
    </div>
  );
}

export function otherMemberId(c: Conversation, meId: string | null): string {
  return c.memberIds.find((id) => id !== meId) ?? c.memberIds[0] ?? "";
}

export function conversationTitle(c: Conversation, users: Record<string, ChatUser>, meId: string | null): string {
  if (c.kind === "direct") return users[otherMemberId(c, meId)]?.name ?? "Unknown";
  if (c.name) return c.name;
  // Unnamed groups read as their members, Teams-style.
  const names = c.memberIds.filter((id) => id !== meId).map((id) => firstName(users[id]?.name ?? "?"));
  return names.length > 3 ? `${names.slice(0, 3).join(", ")} +${names.length - 3}` : names.join(", ") || "Group chat";
}

export function ConversationIcon({ conversation, meId, size = "md" }: { conversation: Conversation; meId: string | null; size?: "sm" | "md" }) {
  if (conversation.kind === "direct") return <UserAvatar userId={otherMemberId(conversation, meId)} size={size} />;
  const Icon = conversation.kind === "channel" ? (conversation.isPrivate ? TbLock : TbHash) : TbUsers;
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary", size === "sm" ? "size-7" : "size-9")}>
      <Icon className={size === "sm" ? "size-4" : "size-5"} />
    </div>
  );
}

export const shortTime = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "d MMM");
};

export const dayLabel = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, d MMMM");
};

export const fileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
