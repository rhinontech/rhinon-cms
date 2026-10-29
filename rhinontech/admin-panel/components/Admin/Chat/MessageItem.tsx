"use client";

import { memo, useState } from "react";
import { format } from "date-fns";
import {
  TbCopy,
  TbDots,
  TbEdit,
  TbFile,
  TbFileSpreadsheet,
  TbFileText,
  TbMessageCircle,
  TbPin,
  TbPinnedOff,
  TbTrash,
  TbAlertCircle,
} from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { teamChatApi } from "./teamChatApi";
import { useTeamChat } from "./store";
import { UserAvatar, fileSize } from "./shared";
import type { Attachment, ChatMessage } from "./types";

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

function AttachmentView({ attachment }: { attachment: Attachment }) {
  if (attachment.mimeType.startsWith("image/") && attachment.url) {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer" className="mt-1.5 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={attachment.url} alt={attachment.name} className="max-h-64 max-w-xs rounded-lg border object-cover" />
      </a>
    );
  }
  const kind = attachment.mimeType.includes("pdf")
    ? { Icon: TbFileText, tint: "text-rose-500" }
    : /sheet|excel|csv/.test(attachment.mimeType)
      ? { Icon: TbFileSpreadsheet, tint: "text-emerald-600" }
      : { Icon: TbFile, tint: "text-blue-600" };
  return (
    <a
      href={attachment.url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="mt-1.5 flex w-full max-w-xs items-center gap-3 rounded-lg border bg-background p-2.5 text-left text-foreground transition hover:bg-muted"
    >
      <kind.Icon className={cn("size-7 shrink-0", kind.tint)} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">{fileSize(attachment.size)}</p>
      </div>
    </a>
  );
}

/** Highlights @mentions of people in the message's mention list, and links URLs. */
function MessageBody({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const users = useTeamChat((s) => s.users);
  const names = message.mentions.map((id) => users[id]?.name).filter(Boolean) as string[];
  const pattern = new RegExp(
    `(https?://[^\\s]+${names.length ? `|${names.map((n) => `@${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).join("|")}` : ""})`,
    "g"
  );
  const parts = message.body.split(pattern);
  return (
    <p className="whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (/^https?:\/\//.test(part)) {
          return (
            <a key={i} href={part} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {part}
            </a>
          );
        }
        if (part.startsWith("@") && names.includes(part.slice(1))) {
          return (
            <span key={i} className={cn("rounded px-0.5 font-semibold", mine ? "bg-white/20" : "bg-primary/10 text-primary")}>
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

interface Props {
  message: ChatMessage;
  meId: string | null;
  grouped: boolean;
  /** Thread view renders without reply affordances. */
  inThread?: boolean;
  onOpenThread?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onRetry?: (message: ChatMessage) => void;
}

function MessageItemInner({ message, meId, grouped, inThread, onOpenThread, onEdit, onRetry }: Props) {
  const author = useTeamChat((s) => s.users[message.authorId]);
  const confirm = useConfirm();
  const [menuOpen, setMenuOpen] = useState(false);
  const mine = message.authorId === meId;

  if (message.isSystem) {
    // Call history lines ("📞 Video call ended · 4:12") read as call events.
    if (message.body.startsWith("📞")) {
      const missed = message.body.includes("Missed");
      return (
        <div className="flex justify-center py-2">
          <span className={cn("flex items-center gap-2 rounded-full border px-3 py-1 text-xs", missed ? "border-rose-300 text-rose-600 dark:border-rose-500/40 dark:text-rose-400" : "bg-background text-muted-foreground")}>
            {message.body.replace(/^📞\s*/, "")}
            <span className="opacity-60">{format(new Date(message.createdAt), "h:mm a")}</span>
          </span>
        </div>
      );
    }
    return <p className="py-2 text-center text-xs text-muted-foreground">{message.body}</p>;
  }

  const react = (emoji: string) => teamChatApi.react(message.id, emoji).catch((e) => toast.error(e.message));
  const pin = () => teamChatApi.pin(message.id).catch((e) => toast.error(e.message));
  const remove = async () => {
    const ok = await confirm({ title: "Delete message?", description: "This can't be undone.", confirmLabel: "Delete", destructive: true });
    if (ok) teamChatApi.remove(message.id).catch((e) => toast.error(e.message));
  };
  const mentionsMe = !!meId && message.mentions.includes(meId);

  return (
    <div className={cn("group relative flex gap-3", mine && "flex-row-reverse", grouped ? "mt-0.5" : "mt-4")}>
      <div className="w-9 shrink-0">{!grouped && !mine && <UserAvatar userId={message.authorId} showPresence={false} />}</div>
      <div className={cn("flex min-w-0 max-w-[75%] flex-col", mine && "items-end")}>
        {!grouped && (
          <div className={cn("mb-1 flex items-baseline gap-2 text-xs", mine && "flex-row-reverse")}>
            {!mine && <span className="font-semibold">{author?.name ?? "Unknown"}</span>}
            <span className="text-muted-foreground" title={format(new Date(message.createdAt), "PPpp")}>
              {format(new Date(message.createdAt), "h:mm a")}
            </span>
            {message.pinnedAt && <TbPin className="size-3 text-amber-500" title="Pinned" />}
          </div>
        )}
        <div className="relative">
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
              message.deleted
                ? "bg-muted italic text-muted-foreground"
                : mine
                  ? "rounded-tr-sm bg-primary text-primary-foreground"
                  : "rounded-tl-sm bg-background shadow-sm ring-1 ring-border",
              mentionsMe && !mine && !message.deleted && "ring-2 ring-amber-400/70",
              message.pending === "sending" && "opacity-60",
            )}
          >
            {message.deleted ? (
              <p>This message was deleted</p>
            ) : (
              <>
                {message.body && <MessageBody message={message} mine={mine} />}
                {message.attachments.map((a) => <AttachmentView key={a.key} attachment={a} />)}
                {message.editedAt && <span className="mt-0.5 block text-[10px] opacity-70">Edited</span>}
              </>
            )}
          </div>

          {!message.deleted && !message.pending && (
            <div
              className={cn(
                "absolute -top-4 z-10 items-center gap-0.5 rounded-lg border bg-background p-0.5 text-foreground shadow-sm",
                menuOpen ? "flex" : "hidden group-hover:flex",
                mine ? "left-0 -translate-x-2" : "right-0 translate-x-2",
              )}
            >
              {QUICK_REACTIONS.slice(0, 4).map((e) => (
                <button key={e} onClick={() => react(e)} className="rounded px-1 text-sm hover:bg-muted">{e}</button>
              ))}
              {!inThread && onOpenThread && (
                <button onClick={() => onOpenThread(message)} className="rounded p-1 hover:bg-muted" title="Reply in thread">
                  <TbMessageCircle className="size-4" />
                </button>
              )}
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="rounded p-1 hover:bg-muted" title="More"><TbDots className="size-4" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={mine ? "start" : "end"}>
                  <div className="flex gap-1 px-1 py-1">
                    {QUICK_REACTIONS.map((e) => (
                      <button key={e} onClick={() => { react(e); setMenuOpen(false); }} className="rounded px-1 text-base hover:bg-muted">{e}</button>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  {message.body && (
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.body).then(() => toast.success("Copied"))}>
                      <TbCopy /> Copy text
                    </DropdownMenuItem>
                  )}
                  {!inThread && (
                    <DropdownMenuItem onClick={pin}>
                      {message.pinnedAt ? <><TbPinnedOff /> Unpin</> : <><TbPin /> Pin</>}
                    </DropdownMenuItem>
                  )}
                  {mine && onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(message)}><TbEdit /> Edit</DropdownMenuItem>
                  )}
                  {mine && (
                    <DropdownMenuItem onClick={remove} className="text-destructive focus:text-destructive"><TbTrash /> Delete</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {message.pending === "failed" && (
          <button onClick={() => onRetry?.(message)} className="mt-1 flex items-center gap-1 text-xs text-destructive">
            <TbAlertCircle className="size-3.5" /> Not sent — tap to retry
          </button>
        )}

        {(message.reactions.length > 0 || (!inThread && message.replyCount > 0)) && (
          <div className={cn("mt-1 flex flex-wrap items-center gap-1", mine && "justify-end")}>
            {message.reactions.map((r) => (
              <ReactionChip key={r.emoji} emoji={r.emoji} userIds={r.userIds} meId={meId} onClick={() => react(r.emoji)} />
            ))}
            {!inThread && message.replyCount > 0 && (
              <button onClick={() => onOpenThread?.(message)} className="text-xs font-medium text-primary hover:underline">
                {message.replyCount === 1 ? "1 reply" : `${message.replyCount} replies`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReactionChip({ emoji, userIds, meId, onClick }: { emoji: string; userIds: string[]; meId: string | null; onClick: () => void }) {
  const users = useTeamChat((s) => s.users);
  const who = userIds.map((id) => (id === meId ? "You" : users[id]?.name ?? "Someone")).join(", ");
  return (
    <button
      onClick={onClick}
      title={who}
      className={cn(
        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition hover:border-primary/40",
        meId && userIds.includes(meId) ? "border-primary/40 bg-primary/10" : "bg-background",
      )}
    >
      {emoji} {userIds.length}
    </button>
  );
}

export const MessageItem = memo(MessageItemInner);
