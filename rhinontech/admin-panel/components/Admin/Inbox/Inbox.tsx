"use client";

import Cookies from "js-cookie";
import type { ElementType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Clock3,
  Inbox as InboxIcon,
  Mail,
  MailOpen,
  Paperclip,
  PenLine,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MailFolder = "inbox" | "sent" | "drafts" | "archive" | "trash";

interface EmailItem {
  id: string;
  threadKey: string;
  folder: MailFolder;
  fromName: string;
  fromEmail: string;
  toEmails: string[];
  ccEmails: string[];
  subject: string;
  body: string;
  snippet: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachment: boolean;
  sentAt: string;
  thread?: EmailItem[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const folders: Array<{ value: MailFolder; label: string; icon: ElementType }> =
  [
    { value: "inbox", label: "Inbox", icon: InboxIcon },
    { value: "sent", label: "Sent", icon: Send },
    { value: "drafts", label: "Drafts", icon: PenLine },
    { value: "archive", label: "Archive", icon: Archive },
    { value: "trash", label: "Trash", icon: Trash2 },
  ];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Inbox() {
  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [search, setSearch] = useState("");
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [compose, setCompose] = useState({ to: "", subject: "", body: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = useMemo(() => {
    const token = Cookies.get("authToken");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ folder });
    if (search.trim()) params.set("search", search.trim());

    try {
      const response = await fetch(`${API_URL}/inbox?${params.toString()}`, {
        headers: authHeaders,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load mail");

      setEmails(data);
      setSelectedId((current) =>
        data.some((email: EmailItem) => email.id === current)
          ? current
          : data[0]?.id || null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load mail");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, folder, search]);

  const fetchEmail = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`${API_URL}/inbox/${id}`, {
          headers: authHeaders,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Could not load email");
        setSelectedEmail(data);
        setEmails((items) =>
          items.map((item) =>
            item.id === id ? { ...item, isRead: true } : item,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load email");
      }
    },
    [authHeaders],
  );

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    if (selectedId) fetchEmail(selectedId);
    else setSelectedEmail(null);
  }, [fetchEmail, selectedId]);

  const patchEmail = async (id: string, payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/inbox/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Could not update email");

      if (payload.folder && payload.folder !== folder) {
        setEmails((items) => items.filter((item) => item.id !== id));
        setSelectedId(null);
        setSelectedEmail(null);
      } else {
        setEmails((items) =>
          items.map((item) => (item.id === id ? data : item)),
        );
        setSelectedEmail((current) =>
          current?.id === id ? { ...current, ...data } : current,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update email");
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async () => {
    if (!selectedEmail || !reply.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/inbox/${selectedEmail.id}/reply`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ body: reply }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not send reply");
      setReply("");
      setSelectedEmail((current) =>
        current
          ? { ...current, thread: [...(current.thread || []), data] }
          : current,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reply");
    } finally {
      setSaving(false);
    }
  };

  const sendEmail = async (asDraft = false) => {
    const toEmails = compose.to
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
    if (!toEmails.length || !compose.subject.trim() || !compose.body.trim())
      return;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/inbox`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          toEmails,
          subject: compose.subject,
          body: compose.body,
          folder: asDraft ? "drafts" : "sent",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not send email");
      setCompose({ to: "", subject: "", body: "" });
      setShowCompose(false);
      if (data.folder === folder) await fetchEmails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send email");
    } finally {
      setSaving(false);
    }
  };

  const selectedThread =
    selectedEmail?.thread || (selectedEmail ? [selectedEmail] : []);

  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl bg-stone-50">
      <aside className="flex h-full w-56 shrink-0 flex-col border-r bg-stone-50 p-3">
        <Button
          variant={"outline"}
          className="mb-4 justify-between gap-2 py-6 px-3"
          onClick={() => setShowCompose(true)}
        >
          <div className="flex items-center gap-2a">
            <PenLine className="h-4 w-4" />
            Compose
          </div>
          <Plus className="h-4 w-4 justify-end" />
        </Button>
        <nav className="space-y-1">
          {folders.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                onClick={() => {
                  setFolder(item.value);
                  setSelectedId(null);
                }}
                className={`flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm ${
                  folder === item.value
                    ? "bg-stone-900 font-medium text-white"
                    : "text-stone-700 hover:bg-stone-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="flex h-full w-[420px] shrink-0 flex-col border-r">
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <Mail className="h-5 w-5 text-stone-700" />
          <h1 className="text-base font-semibold">Mail</h1>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={fetchEmails}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search mail"
              className="h-9 pl-9"
            />
          </div>
        </div>
        {error && (
          <div className="border-b bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {loading && (
            <p className="p-4 text-sm text-stone-500">Loading mail...</p>
          )}
          {!loading && emails.length === 0 && (
            <p className="p-4 text-sm text-stone-500">
              No emails in this folder.
            </p>
          )}
          {emails.map((email) => (
            <div
              key={email.id}
              role="button"
              onClick={() => setSelectedId(email.id)}
              className={`w-full border-b p-4 text-left hover:bg-stone-50 cursor-pointer transition-colors ${
                selectedId === email.id ? "bg-blue-50" : "bg-white"
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    patchEmail(email.id, { isStarred: !email.isStarred });
                  }}
                  className="rounded p-1 hover:bg-stone-200"
                >
                  <Star
                    className={`h-4 w-4 ${email.isStarred ? "fill-yellow-400 text-yellow-500" : "text-stone-400"}`}
                  />
                </button>
                <p
                  className={`min-w-0 flex-1 truncate text-sm ${email.isRead ? "font-medium" : "font-bold"}`}
                >
                  {folder === "sent"
                    ? email.toEmails.join(", ")
                    : `${email.fromName} <${email.fromEmail}>`}
                </p>
                {email.hasAttachment && (
                  <Paperclip className="h-4 w-4 text-stone-400" />
                )}
              </div>
              <p
                className={`truncate text-sm ${email.isRead ? "font-medium" : "font-bold"}`}
              >
                {email.subject}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">
                {email.snippet}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                <span>{email.isRead ? "Read" : "Unread"}</span>
                <span>{formatTime(email.sentAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <main className="flex h-full min-w-0 flex-1 flex-col">
        {!selectedEmail ? (
          <div className="flex h-full items-center justify-center text-sm text-stone-500">
            Select an email to read it.
          </div>
        ) : (
          <>
            <header className="flex min-h-16 items-center gap-2 border-b px-5">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold">
                  {selectedEmail.subject}
                </h2>
                <p className="text-xs text-stone-500">
                  {selectedEmail.fromName} · {formatTime(selectedEmail.sentAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  patchEmail(selectedEmail.id, {
                    isRead: !selectedEmail.isRead,
                  })
                }
                disabled={saving}
              >
                {selectedEmail.isRead ? (
                  <Mail className="h-4 w-4" />
                ) : (
                  <MailOpen className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  patchEmail(selectedEmail.id, { folder: "archive" })
                }
                disabled={saving || folder === "archive"}
              >
                <Archive className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  patchEmail(selectedEmail.id, { folder: "trash" })
                }
                disabled={saving || folder === "trash"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </header>

            <div className="flex-1 overflow-auto bg-stone-50 p-5">
              {selectedThread.map((message) => (
                <article
                  key={message.id}
                  className="mb-4 rounded-lg border bg-white p-4"
                >
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
                      {initials(message.fromName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{message.fromName}</p>
                      <p className="truncate text-xs text-stone-500">
                        {message.fromEmail} to {message.toEmails.join(", ")}
                      </p>
                    </div>
                    <span className="text-xs text-stone-500">
                      {formatTime(message.sentAt)}
                    </span>
                  </div>
                  <div 
                    className="text-sm leading-6 text-stone-800 [&>div]:!bg-transparent [&_p]:mb-2 [&_a]:text-blue-600 hover:[&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: message.body }}
                  />
                </article>
              ))}
            </div>

            <footer className="border-t p-4">
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder={`Reply to ${selectedEmail.fromName}`}
                className="min-h-24 w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-300"
              />
              <div className="mt-2 flex justify-end">
                <Button onClick={sendReply} disabled={!reply.trim() || saving}>
                  <Send className="mr-2 h-4 w-4" />
                  Reply
                </Button>
              </div>
            </footer>
          </>
        )}
      </main>

      {showCompose && (
        <div className="absolute bottom-6 right-6 z-20 flex w-[520px] flex-col overflow-hidden rounded-lg border bg-white">
          <div className="flex h-11 items-center justify-between bg-stone-900 px-4 text-sm font-medium text-white">
            New Message
            <button
              onClick={() => setShowCompose(false)}
              className="rounded px-2 py-1 hover:bg-white/10"
            >
              Close
            </button>
          </div>
          <Input
            value={compose.to}
            onChange={(event) =>
              setCompose((current) => ({ ...current, to: event.target.value }))
            }
            placeholder="To"
            className="rounded-none border-x-0 border-t-0"
          />
          <Input
            value={compose.subject}
            onChange={(event) =>
              setCompose((current) => ({
                ...current,
                subject: event.target.value,
              }))
            }
            placeholder="Subject"
            className="rounded-none border-x-0 border-t-0"
          />
          <textarea
            value={compose.body}
            onChange={(event) =>
              setCompose((current) => ({
                ...current,
                body: event.target.value,
              }))
            }
            placeholder="Write your email..."
            className="min-h-56 resize-none p-3 text-sm outline-none"
          />
          <div className="flex justify-between border-t p-3">
            <Button
              variant="outline"
              onClick={() => sendEmail(true)}
              disabled={saving}
            >
              Save draft
            </Button>
            <Button onClick={() => sendEmail(false)} disabled={saving}>
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
