"use client";

import { useEffect, useMemo, useState } from "react";
import { TbCheck, TbHash, TbLoader2, TbLock, TbSearch, TbUser, TbUsers } from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { teamChatApi } from "./teamChatApi";
import { useTeamChat } from "./store";
import { ConversationIcon, UserAvatar, conversationTitle, shortTime } from "./shared";
import type { ChatMessage, Conversation } from "./types";

function PeoplePicker({
  selected,
  onToggle,
  exclude = [],
  single,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  exclude?: string[];
  single?: boolean;
}) {
  const users = useTeamChat((s) => s.users);
  const [q, setQ] = useState("");
  const list = useMemo(
    () =>
      Object.values(users)
        .filter((u) => !exclude.includes(u.id))
        .filter((u) => !q || `${u.name} ${u.title ?? ""} ${u.department ?? ""}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users, q, exclude]
  );
  return (
    <div className="space-y-2">
      <div className="relative">
        <TbSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" className="pl-8" />
      </div>
      <div className="max-h-64 space-y-0.5 overflow-y-auto">
        {list.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No one matches.</p>}
        {list.map((u) => {
          const on = selected.includes(u.id);
          return (
            <button
              key={u.id}
              onClick={() => onToggle(u.id)}
              className={cn("flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left", on ? "bg-primary/10" : "hover:bg-muted")}
            >
              <UserAvatar userId={u.id} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{[u.title, u.department].filter(Boolean).join(" · ") || u.email}</p>
              </div>
              {!single && on && <TbCheck className="size-4 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type NewKind = "direct" | "group" | "channel";

export function NewChatDialog({
  open,
  onOpenChange,
  meId,
  initialKind = "direct",
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meId: string | null;
  initialKind?: NewKind;
  onCreated: (c: Conversation) => void;
}) {
  const [kind, setKind] = useState<NewKind>(initialKind);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setSelected([]);
    setName("");
    setDescription("");
    setIsPrivate(false);
    setProjectId("");
  }, [open, initialKind]);

  useEffect(() => {
    if (!open || kind !== "channel" || projects.length) return;
    // Optional: link the channel to a Work project. Hidden if Work isn't readable.
    apiFetch<{ id: string; name: string }[]>("/work/projects")
      .then((p) => setProjects(p.map(({ id, name }) => ({ id, name }))))
      .catch(() => {});
  }, [open, kind, projects.length]);

  const finish = (c: Conversation) => {
    useTeamChat.getState().upsertConversation(c);
    onCreated(c);
    onOpenChange(false);
  };

  const toggle = async (id: string) => {
    if (kind === "direct") {
      setBusy(true);
      try {
        finish(await teamChatApi.openDirect(id));
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setBusy(false);
      }
      return;
    }
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const create = async () => {
    setBusy(true);
    try {
      finish(
        await teamChatApi.create({
          kind: kind === "channel" ? "channel" : "group",
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          isPrivate,
          memberIds: selected,
          projectId: projectId || null,
        })
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const canCreate = kind === "group" ? selected.length >= 1 : kind === "channel" ? !!name.trim() : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New chat</DialogTitle>
          <DialogDescription>Message one person, start a group, or create a channel for a team or project.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {([
            ["direct", "Person", TbUser],
            ["group", "Group", TbUsers],
            ["channel", "Channel", TbHash],
          ] as const).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn("flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium", kind === k ? "bg-background shadow-sm" : "text-muted-foreground")}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        {kind === "channel" && (
          <div className="space-y-3">
            <Input value={name} onChange={(e) => setName(e.target.value.replace(/^#/, ""))} placeholder="Channel name, e.g. engineering" maxLength={80} />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's it for? (optional)" rows={2} maxLength={500} />
            {projects.length > 0 && (
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  const p = projects.find((x) => x.id === e.target.value);
                  if (p && !name.trim()) setName(p.name.toLowerCase().replace(/\s+/g, "-").slice(0, 80));
                }}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Not linked to a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{`Project: ${p.name}`}</option>
                ))}
              </select>
            )}
            <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <TbLock className="size-4" /> Private — only invited people can see it
              </span>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </label>
          </div>
        )}
        {kind === "group" && <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name (optional)" maxLength={80} />}

        <PeoplePicker selected={selected} onToggle={toggle} exclude={meId ? [meId] : []} single={kind === "direct"} />

        {kind !== "direct" && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={create} disabled={!canCreate || busy}>
              {busy && <TbLoader2 className="animate-spin" />}
              {kind === "channel" ? "Create channel" : `Start group${selected.length ? ` (${selected.length + 1})` : ""}`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AddMembersDialog({
  open,
  onOpenChange,
  conversation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => setSelected([]), [open]);
  const add = async () => {
    setBusy(true);
    try {
      useTeamChat.getState().upsertConversation(await teamChatApi.addMembers(conversation.id, selected));
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add people</DialogTitle>
        </DialogHeader>
        <PeoplePicker
          selected={selected}
          onToggle={(id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
          exclude={conversation.memberIds}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={add} disabled={!selected.length || busy}>
            {busy && <TbLoader2 className="animate-spin" />}
            {`Add${selected.length ? ` ${selected.length}` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BrowseChannelsDialog({
  open,
  onOpenChange,
  onJoined,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoined: (c: Conversation) => void;
}) {
  const [channels, setChannels] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setChannels(null);
    setError(null);
    teamChatApi.browseChannels().then(setChannels).catch((e) => setError(e.message));
  }, [open]);
  const join = async (id: string) => {
    setJoining(id);
    try {
      const c = await teamChatApi.join(id);
      useTeamChat.getState().upsertConversation(c);
      onJoined(c);
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setJoining(null);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Browse channels</DialogTitle>
          <DialogDescription>Public channels in your workspace you haven&apos;t joined yet.</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {error && <p className="py-6 text-center text-sm text-destructive">{error}</p>}
          {!channels && !error && (
            <div className="flex justify-center py-8"><TbLoader2 className="size-5 animate-spin text-muted-foreground" /></div>
          )}
          {channels?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">You&apos;re in every public channel.</p>}
          {channels?.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted">
              <ConversationIcon conversation={c} meId={null} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{`#${c.name}`}</p>
                <p className="truncate text-xs text-muted-foreground">{c.description || `${c.memberIds.length} members`}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => join(c.id)} disabled={joining === c.id}>
                {joining === c.id && <TbLoader2 className="animate-spin" />} Join
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SearchDialog({
  open,
  onOpenChange,
  meId,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meId: string | null;
  onPick: (m: ChatMessage) => void;
}) {
  const users = useTeamChat((s) => s.users);
  const conversations = useTeamChat((s) => s.conversations);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ChatMessage[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQ("");
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      teamChatApi
        .search(query)
        .then(setResults)
        .catch((e) => toast.error(e.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const highlight = (text: string) => {
    const i = text.toLowerCase().indexOf(q.trim().toLowerCase());
    if (i < 0) return text.slice(0, 160);
    const start = Math.max(0, i - 40);
    const len = q.trim().length;
    return (
      <>
        {start > 0 && "…"}
        {text.slice(start, i)}
        <mark className="rounded bg-amber-200 px-0.5 text-foreground dark:bg-amber-500/40">{text.slice(i, i + len)}</mark>
        {text.slice(i + len, i + len + 100)}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Search messages</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <TbSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search across all your chats" className="pl-8" />
          {loading && <TbLoader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
        <div className="max-h-96 space-y-1 overflow-y-auto">
          {results?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No messages found.</p>}
          {!results && <p className="py-6 text-center text-sm text-muted-foreground">Type at least 2 characters.</p>}
          {results?.map((m) => {
            const conv = conversations[m.conversationId];
            return (
              <button
                key={m.id}
                onClick={() => {
                  onPick(m);
                  onOpenChange(false);
                }}
                className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted"
              >
                <UserAvatar userId={m.authorId} size="sm" showPresence={false} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 text-xs">
                    <span className="font-semibold">{users[m.authorId]?.name ?? "Unknown"}</span>
                    {conv && <span className="truncate text-muted-foreground">{`in ${conversationTitle(conv, users, meId)}`}</span>}
                    <span className="ml-auto shrink-0 text-muted-foreground">{shortTime(m.createdAt)}</span>
                  </div>
                  <p className="text-sm">{highlight(m.body)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
