"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { TbLoader2, TbMoodSmile, TbPaperclip, TbSend, TbX } from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { teamChatApi, teamChatSocket } from "./teamChatApi";
import { useTeamChat } from "./store";
import { UserAvatar, fileSize } from "./shared";
import type { Attachment, ChatMessage } from "./types";

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎", "🤔", "😅", "😬", "🙃", "😴", "😢", "😭", "😡",
  "👍", "👎", "👏", "🙌", "🙏", "💪", "👀", "🤝", "✅", "❌", "🔥", "🎉", "🚀", "💯", "❤️", "⭐",
];

export interface ComposerHandle {
  addFiles: (files: File[]) => void;
  focus: () => void;
}

interface UploadItem {
  id: string;
  name: string;
  size: number;
  done?: Attachment;
}

interface Props {
  conversationId: string;
  memberIds: string[];
  meId: string | null;
  placeholder: string;
  parentId?: string | null;
  /** When set, the composer edits this message instead of sending a new one. */
  editing?: ChatMessage | null;
  onCancelEdit?: () => void;
  disabled?: boolean;
}

export const Composer = forwardRef<ComposerHandle, Props>(function Composer(
  { conversationId, memberIds, meId, placeholder, parentId = null, editing, onCancelEdit, disabled },
  ref
) {
  const users = useTeamChat((s) => s.users);
  const [draft, setDraft] = useState("");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastTyping = useRef(0);
  const draftKey = `team-chat:draft:${conversationId}:${parentId ?? ""}`;

  // Drafts survive switching chats (per-viewer convenience, so localStorage).
  useEffect(() => {
    if (editing) return;
    try {
      setDraft(localStorage.getItem(draftKey) ?? "");
    } catch {
      setDraft("");
    }
    setUploads([]);
  }, [draftKey, editing]);

  useEffect(() => {
    if (editing) {
      setDraft(editing.body);
      requestAnimationFrame(() => textRef.current?.focus());
    }
  }, [editing]);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft]);

  const saveDraft = (value: string) => {
    if (editing) return;
    try {
      if (value) localStorage.setItem(draftKey, value);
      else localStorage.removeItem(draftKey);
    } catch {
      /* storage unavailable */
    }
  };

  const addFiles = (files: File[]) => {
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} is over 25 MB`);
        continue;
      }
      const id = crypto.randomUUID();
      setUploads((u) => [...u, { id, name: file.name, size: file.size }]);
      teamChatApi
        .upload(file)
        .then((done) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, done } : x))))
        .catch((e) => {
          toast.error(`Couldn't upload ${file.name}: ${e.message}`);
          setUploads((u) => u.filter((x) => x.id !== id));
        });
    }
  };

  useImperativeHandle(ref, () => ({ addFiles, focus: () => textRef.current?.focus() }));

  const candidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return memberIds
      .filter((id) => id !== meId && users[id])
      .map((id) => users[id])
      .filter((u) => u.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionQuery, memberIds, meId, users]);

  const onChange = (value: string) => {
    setDraft(value);
    saveDraft(value);
    const caret = textRef.current?.selectionStart ?? value.length;
    const match = /(^|\s)@([^\s@]{0,30})$/.exec(value.slice(0, caret));
    setMentionQuery(match ? match[2] : null);
    setMentionIndex(0);
    if (!editing && Date.now() - lastTyping.current > 2500) {
      lastTyping.current = Date.now();
      teamChatSocket()?.emit("typing", { conversationId, parentId });
    }
  };

  const insertMention = (name: string) => {
    const el = textRef.current;
    const caret = el?.selectionStart ?? draft.length;
    const before = draft.slice(0, caret).replace(/@([^\s@]{0,30})$/, `@${name} `);
    const next = before + draft.slice(caret);
    setDraft(next);
    saveDraft(next);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(before.length, before.length);
    });
  };

  const insertEmoji = (emoji: string) => {
    const el = textRef.current;
    const caret = el?.selectionStart ?? draft.length;
    const next = draft.slice(0, caret) + emoji + draft.slice(caret);
    setDraft(next);
    saveDraft(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret + emoji.length, caret + emoji.length);
    });
  };

  const uploading = uploads.some((u) => !u.done);

  const submit = async () => {
    const body = draft.trim();
    if (editing) {
      if (!body && !editing.attachments.length) return;
      try {
        await teamChatApi.edit(editing.id, body);
        onCancelEdit?.();
        setDraft("");
      } catch (e) {
        toast.error((e as Error).message);
      }
      return;
    }
    const attachments = uploads.map((u) => u.done).filter(Boolean) as Attachment[];
    if ((!body && !attachments.length) || uploading) return;
    // Only names still present in the text count as mentions.
    const mentions = memberIds.filter((id) => users[id] && body.includes(`@${users[id].name}`));
    const clientId = crypto.randomUUID();
    const store = useTeamChat.getState();
    if (!parentId) {
      store.addPending({
        id: `pending-${clientId}`,
        clientId,
        pending: "sending",
        conversationId,
        authorId: meId ?? "",
        parentId: null,
        body,
        attachments,
        mentions,
        isSystem: false,
        replyCount: 0,
        lastReplyAt: null,
        editedAt: null,
        deleted: false,
        pinnedAt: null,
        reactions: [],
        createdAt: new Date().toISOString(),
      });
    }
    setDraft("");
    saveDraft("");
    setUploads([]);
    try {
      await teamChatApi.send(conversationId, { body, attachments, parentId, mentions, clientId });
    } catch (e) {
      if (!parentId) store.failPending(conversationId, clientId);
      toast.error((e as Error).message || "Message not sent");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (candidates.length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i + (e.key === "ArrowDown" ? 1 : candidates.length - 1)) % candidates.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(candidates[mentionIndex].name);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === "Escape" && editing) {
      onCancelEdit?.();
      setDraft("");
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className="relative">
      {candidates.length > 0 && (
        <div className="absolute bottom-full left-0 z-20 mb-2 w-64 overflow-hidden rounded-lg border bg-popover p-1 shadow-lg">
          {candidates.map((u, i) => (
            <button
              key={u.id}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(u.name);
              }}
              className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm", i === mentionIndex ? "bg-muted" : "hover:bg-muted")}
            >
              <UserAvatar userId={u.id} size="sm" />
              <div className="min-w-0">
                <p className="truncate">{u.name}</p>
                {u.title && <p className="truncate text-xs text-muted-foreground">{u.title}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      <div
        className={cn(
          "rounded-xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-primary/30",
          editing && "border-amber-400 ring-1 ring-amber-400/40",
        )}
      >
        {editing && (
          <div className="flex items-center justify-between border-b px-3.5 py-1.5 text-xs text-amber-700 dark:text-amber-400">
            Editing message · Esc to cancel
            <button onClick={() => { onCancelEdit?.(); setDraft(""); }}><TbX className="size-3.5" /></button>
          </div>
        )}
        {uploads.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-3">
            {uploads.map((u) => (
              <div key={u.id} className="flex items-center gap-2 rounded-lg border bg-muted/50 px-2.5 py-1.5 text-xs">
                {!u.done && <TbLoader2 className="size-3.5 animate-spin" />}
                <span className="max-w-40 truncate">{u.name}</span>
                <span className="text-muted-foreground">{fileSize(u.size)}</span>
                <button onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))} title="Remove"><TbX className="size-3.5" /></button>
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={textRef}
          value={draft}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData.files);
            if (files.length && !editing) {
              e.preventDefault();
              addFiles(files);
            }
          }}
          rows={1}
          placeholder={disabled ? "Join to send messages" : placeholder}
          className="block max-h-[200px] min-h-[44px] w-full resize-none bg-transparent px-3.5 pt-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-1 px-2 pb-2">
          {!editing && (
            <>
              <input
                ref={fileRef}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
              <Button size="icon" variant="ghost" title="Attach files" disabled={disabled} onClick={() => fileRef.current?.click()}>
                <TbPaperclip className="size-4" />
              </Button>
            </>
          )}
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" title="Emoji" disabled={disabled}><TbMoodSmile className="size-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="start">
              <div className="grid grid-cols-8 gap-1">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => insertEmoji(e)} className="rounded p-1 text-lg hover:bg-muted">{e}</button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <span className="ml-auto hidden text-[11px] text-muted-foreground sm:block">Enter to send · Shift+Enter for new line · @ to mention</span>
          <Button size="icon" onClick={() => void submit()} disabled={disabled || uploading || (!draft.trim() && !uploads.length)} title={editing ? "Save" : "Send"}>
            <TbSend className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
