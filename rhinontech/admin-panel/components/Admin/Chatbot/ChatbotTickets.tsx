"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { TbExternalLink, TbLock, TbMail, TbSearch, TbSend, TbStarFilled, TbTicket, TbTrash, TbX } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { timeAgo } from "@/lib/dates";
import { useModuleBase } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { LoadingRows, Notice, Spinner } from "@/components/Admin/Settings/parts";
import { Avatar, Chip, EmptyState, PageShell, Segmented } from "./ui";
import { errorText, useChatbot, useChatEvents } from "./chatbotApi";

type Status = "open" | "pending" | "resolved" | "closed";
type Priority = "low" | "medium" | "high" | "urgent";
type Filter = Status | "all";

interface Ticket {
  id: string;
  code: string;
  subject: string;
  customerEmail: string;
  customerName: string | null;
  customData: Record<string, string>;
  status: Status;
  priority: Priority;
  tags: string[];
  assignedUserId: string | null;
  assigneeName: string | null;
  rating: number | null;
  leadId: string | null;
  isNew: boolean;
  lastActivityAt: string;
  createdAt: string;
}

interface TicketMessage {
  id: string;
  role: "customer" | "agent" | "note";
  authorUserId: string | null;
  authorName: string | null;
  text: string;
  emailed: boolean | null;
  sentVia: string | null;
  createdAt: string;
}

interface MailAccount {
  provider: "GOOGLE" | "MICROSOFT";
  email: string;
}

interface Person {
  id: string;
  fullName: string;
}

const STATUS: Record<Status, { label: string; tone: "blue" | "amber" | "green" | "neutral" }> = {
  open: { label: "Open", tone: "blue" },
  pending: { label: "Waiting on visitor", tone: "amber" },
  resolved: { label: "Resolved", tone: "green" },
  closed: { label: "Closed", tone: "neutral" },
};

const PRIORITY: Record<Priority, { label: string; tone: "neutral" | "blue" | "amber" | "red" }> = {
  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "blue" },
  high: { label: "High", tone: "amber" },
  urgent: { label: "Urgent", tone: "red" },
};

const customerLabel = (t: Ticket) => t.customerName || t.customerEmail;

export function ChatbotTickets() {
  const base = useModuleBase();
  const crmBase = base.replace(/\/chatbot\//, "/crm/");
  const params = useSearchParams();
  const confirm = useConfirm();
  const { has, userId } = usePermissions();
  const canReply = has("chatbot:write");
  const { state } = useChatbot();
  const accent = (state?.chatbot?.config.primaryColor as string) || "#1c1917";

  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [counts, setCounts] = useState<Record<Status, number>>({ open: 0, pending: 0, resolved: 0, closed: 0 });
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [filter, setFilter] = useState<Filter>("open");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(params.get("t"));
  const [detail, setDetail] = useState<{ ticket: Ticket; messages: TicketMessage[] } | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [draft, setDraft] = useState("");
  const [asNote, setAsNote] = useState(false);
  const [mailAccounts, setMailAccounts] = useState<MailAccount[]>([]);
  // "" = the brand address; otherwise a connected account's provider.
  const [via, setVia] = useState<"" | MailAccount["provider"]>("");
  const [sending, setSending] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const threadEnd = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (filter !== "all") qs.set("status", filter);
      if (query.trim()) qs.set("q", query.trim());
      const res = await apiFetch<{ tickets: Ticket[]; counts: Record<Status, number> }>(`/chatbots/tickets?${qs}`);
      setTickets(res.tickets);
      setCounts(res.counts);
      setError(null);
    } catch (err) {
      const message = errorText(err, "Could not load tickets");
      if (/no chatbot/i.test(message)) setMissing(true);
      else setError(message);
    }
  }, [filter, query]);

  useEffect(() => {
    const t = setTimeout(() => void load(), query ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  useEffect(() => {
    apiFetch<Person[]>("/people").then(setPeople).catch(() => undefined);
    apiFetch<{ accounts: MailAccount[] }>("/integrations/accounts").then((r) => setMailAccounts(r.accounts)).catch(() => undefined);
  }, []);

  useChatEvents({ "ticket:new": () => void load() });

  const open = useCallback(async (id: string) => {
    setSelectedId(id);
    try {
      const res = await apiFetch<{ ticket: Ticket; messages: TicketMessage[] }>(`/chatbots/tickets/${id}`);
      setDetail(res);
      setTickets((prev) => prev?.map((t) => (t.id === id ? { ...t, isNew: false } : t)) ?? prev);
    } catch (err) {
      toast.error(errorText(err, "Could not open the ticket"));
    }
  }, []);

  useEffect(() => {
    if (selectedId && !detail) void open(selectedId);
    // Only the deep link on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: "end" });
  }, [detail?.messages.length]);

  const patch = async (fields: Partial<Pick<Ticket, "status" | "priority" | "assignedUserId" | "tags">>, done?: string) => {
    if (!detail) return;
    try {
      const res = await apiFetch<{ ticket: Ticket }>(`/chatbots/tickets/${detail.ticket.id}`, { method: "PATCH", body: JSON.stringify(fields) });
      const assigneeName = people.find((p) => p.id === res.ticket.assignedUserId)?.fullName ?? null;
      const next = { ...detail.ticket, ...res.ticket, assigneeName };
      setDetail({ ...detail, ticket: next });
      setTickets((prev) => prev?.map((t) => (t.id === next.id ? next : t)) ?? prev);
      if (fields.status && fields.status !== detail.ticket.status) {
        setCounts((c) => ({ ...c, [detail.ticket.status]: Math.max(0, c[detail.ticket.status] - 1), [fields.status!]: c[fields.status!] + 1 }));
      }
      if (done) toast.success(done);
    } catch (err) {
      toast.error(errorText(err, "Could not update the ticket"));
    }
  };

  const send = async () => {
    if (!detail || !draft.trim()) return;
    setSending(true);
    try {
      const res = await apiFetch<{ message: TicketMessage; ticket: Ticket }>(`/chatbots/tickets/${detail.ticket.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: draft, note: asNote, ...(via && !asNote ? { via } : {}) }),
      });
      const next = { ...detail.ticket, ...res.ticket, assigneeName: detail.ticket.assigneeName ?? people.find((p) => p.id === res.ticket.assignedUserId)?.fullName ?? null };
      if (next.status !== detail.ticket.status) setCounts((c) => ({ ...c, [detail.ticket.status]: Math.max(0, c[detail.ticket.status] - 1), [next.status]: c[next.status] + 1 }));
      setDetail({ ticket: next, messages: [...detail.messages, res.message] });
      setTickets((prev) => prev?.map((t) => (t.id === next.id ? next : t)) ?? prev);
      setDraft("");
      if (!asNote) {
        if (res.message.emailed) toast.success(`Emailed to ${detail.ticket.customerEmail}${res.message.sentVia ? ` from ${res.message.sentVia}` : ""}`);
        else toast.error("Saved, but the email didn't go out. Try again later.");
      }
    } catch (err) {
      toast.error(errorText(err, "Could not send"));
    } finally {
      setSending(false);
    }
  };

  const remove = async () => {
    if (!detail) return;
    const ok = await confirm({ title: `Delete ticket #${detail.ticket.code}?`, description: "The ticket and its whole thread are deleted. The visitor won't see it in “Your tickets” any more.", confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    try {
      await apiFetch(`/chatbots/tickets/${detail.ticket.id}`, { method: "DELETE" });
      setCounts((c) => ({ ...c, [detail.ticket.status]: Math.max(0, c[detail.ticket.status] - 1) }));
      setTickets((prev) => prev?.filter((t) => t.id !== detail.ticket.id) ?? prev);
      setDetail(null);
      setSelectedId(null);
    } catch (err) {
      toast.error(errorText(err, "Could not delete"));
    }
  };

  const addTag = () => {
    const tag = tagDraft.trim().toLowerCase();
    if (!detail || !tag || detail.ticket.tags.includes(tag)) return setTagDraft("");
    setTagDraft("");
    void patch({ tags: [...detail.ticket.tags, tag] });
  };

  const total = useMemo(() => Object.values(counts).reduce((n, v) => n + v, 0), [counts]);

  if (missing) {
    return (
      <PageShell title="Tickets">
        <Notice tone="info">
          Create the chatbot first. <Link href={base} className="font-medium underline underline-offset-2">Go to Overview →</Link>
        </Notice>
      </PageShell>
    );
  }

  const selected = detail?.ticket.id === selectedId ? detail : null;

  return (
    <PageShell flush title="Tickets" subtitle="Requests visitors raised from the widget. Your replies are emailed to them.">
      <div className="flex h-full overflow-hidden" data-testid="chatbot-tickets">
        {/* Ticket list */}
        <aside className="flex w-[22rem] shrink-0 flex-col border-r border-border/70">
          <div className="flex flex-col gap-3 border-b border-border/70 p-3">
            <div className="relative">
              <TbSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subject, email or #code" className="h-9 rounded-xl pl-9" data-testid="ticket-search" />
            </div>
            <Segmented
              size="sm"
              value={filter}
              onChange={setFilter}
              testIdPrefix="filter"
              options={[
                { value: "open", label: "Open", count: counts.open },
                { value: "pending", label: "Waiting", count: counts.pending },
                { value: "resolved", label: "Resolved", count: counts.resolved },
                { value: "all", label: "All", count: total },
              ]}
            />
          </div>
          <div className="flex-1 overflow-auto p-2" data-testid="ticket-list">
            {error && <div className="p-2"><Notice tone="danger">{error}</Notice></div>}
            {!tickets && !error && <div className="p-2"><LoadingRows rows={6} /></div>}
            {tickets?.length === 0 && (
              <EmptyState
                icon={<TbTicket size={22} />}
                title={query ? "No tickets match" : filter === "open" ? "No open tickets" : "No tickets here"}
                body="Visitors raise tickets from “Raise a ticket” in the chat widget."
              />
            )}
            {tickets?.map((t) => {
              const active = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => void open(t.id)}
                  data-testid={`ticket-${t.code}`}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    active ? "bg-foreground/[0.06] dark:bg-white/[0.07]" : "hover:bg-muted/60"
                  )}
                >
                  <Avatar name={customerLabel(t)} seed={t.customerEmail} size="sm" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("truncate text-[13px]", t.isNew ? "font-semibold text-foreground" : "font-medium text-foreground/90")}>{t.subject}</span>
                      <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">{timeAgo(t.lastActivityAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      #{t.code} · {customerLabel(t)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {filter === "all" && <Chip tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Chip>}
                      {t.priority !== "medium" && <Chip tone={PRIORITY[t.priority].tone}>{PRIORITY[t.priority].label}</Chip>}
                      {t.assigneeName && <span className="truncate text-[11px] text-muted-foreground">{t.assigneeName}</span>}
                      {t.isNew && <span className="ml-auto size-2 shrink-0 rounded-full" style={{ background: accent }} aria-label="New" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Thread */}
        <section className="flex min-w-0 flex-1 flex-col">
          {!selected ? (
            <EmptyState
              className="flex-1"
              icon={selectedId ? <Spinner /> : <TbTicket size={24} />}
              title={selectedId ? "Opening…" : "Pick a ticket"}
              body={selectedId ? undefined : "Reply to email the visitor, or leave an internal note only your team sees."}
            />
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border/70 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{selected.ticket.subject}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    #{selected.ticket.code} · opened {timeAgo(selected.ticket.createdAt)} by {selected.ticket.customerEmail}
                  </p>
                </div>
                <Chip tone={STATUS[selected.ticket.status].tone}>{STATUS[selected.ticket.status].label}</Chip>
                {canReply && selected.ticket.status !== "resolved" && (
                  <Button size="sm" variant="outline" onClick={() => void patch({ status: "resolved" }, "Marked resolved")} data-testid="resolve-ticket">
                    Resolve
                  </Button>
                )}
                {canReply && (selected.ticket.status === "resolved" || selected.ticket.status === "closed") && (
                  <Button size="sm" variant="outline" onClick={() => void patch({ status: "open" }, "Reopened")}>
                    Reopen
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-auto px-5 py-4" data-testid="ticket-thread">
                <div className="mx-auto flex max-w-2xl flex-col gap-3">
                  {selected.messages.map((m) => (
                    <ThreadItem key={m.id} m={m} customer={customerLabel(selected.ticket)} seed={selected.ticket.customerEmail} me={m.authorUserId === userId} />
                  ))}
                  <div ref={threadEnd} />
                </div>
              </div>

              {canReply && (
                <div className="border-t border-border/70 p-3">
                  <div className={cn("mx-auto max-w-2xl rounded-2xl border transition-colors", asNote ? "border-amber-300/70 bg-amber-50/60 dark:border-amber-400/30 dark:bg-amber-400/[0.06]" : "border-border bg-background")}>
                    <div className="flex items-center gap-1 px-2 pt-2">
                      {[
                        { note: false, label: "Reply", icon: <TbMail size={13} /> },
                        { note: true, label: "Internal note", icon: <TbLock size={13} /> },
                      ].map((o) => (
                        <button
                          key={o.label}
                          type="button"
                          onClick={() => setAsNote(o.note)}
                          data-testid={o.note ? "mode-note" : "mode-reply"}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                            asNote === o.note ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {o.icon} {o.label}
                        </button>
                      ))}
                      {!asNote && mailAccounts.length > 0 ? (
                        <label className="ml-auto flex min-w-0 items-center gap-1.5 pr-1 text-[11px] text-muted-foreground">
                          Send from
                          <select
                            value={via}
                            onChange={(e) => setVia(e.target.value as typeof via)}
                            className="max-w-[14rem] truncate rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] text-foreground"
                            data-testid="send-from"
                          >
                            <option value="">Brand address</option>
                            {mailAccounts.map((a) => (
                              <option key={a.provider} value={a.provider}>{a.email}</option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <span className="ml-auto truncate pr-1 text-[11px] text-muted-foreground">
                          {asNote ? "Only your team sees this" : `Emailed to ${selected.ticket.customerEmail}`}
                        </span>
                      )}
                    </div>
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send();
                      }}
                      placeholder={asNote ? "Add a note for your team…" : "Write your reply…"}
                      className="min-h-[88px] resize-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                      data-testid="ticket-reply"
                    />
                    <div className="flex items-center justify-between px-3 pb-2.5">
                      <span className="text-[11px] text-muted-foreground">⌘ + Enter to send</span>
                      <Button size="sm" onClick={() => void send()} disabled={sending || !draft.trim()} data-testid="send-ticket-reply">
                        {sending ? <Spinner /> : <TbSend size={14} />} {asNote ? "Add note" : "Send reply"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Details */}
        {selected && (
          <aside className="hidden w-72 shrink-0 flex-col gap-5 overflow-auto border-l border-border/70 p-4 xl:flex" data-testid="ticket-details">
            <div className="flex items-center gap-3">
              <Avatar name={customerLabel(selected.ticket)} seed={selected.ticket.customerEmail} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{customerLabel(selected.ticket)}</p>
                <a href={`mailto:${selected.ticket.customerEmail}`} className="block truncate text-xs text-muted-foreground hover:underline">
                  {selected.ticket.customerEmail}
                </a>
              </div>
            </div>

            {canReply && (
              <>
                <Section title="Status">
                  <select
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    value={selected.ticket.status}
                    onChange={(e) => void patch({ status: e.target.value as Status }, "Status updated")}
                    data-testid="status-select"
                  >
                    {(Object.keys(STATUS) as Status[]).map((s) => (
                      <option key={s} value={s}>{STATUS[s].label}</option>
                    ))}
                  </select>
                </Section>
                <Section title="Priority">
                  <select
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    value={selected.ticket.priority}
                    onChange={(e) => void patch({ priority: e.target.value as Priority }, "Priority updated")}
                    data-testid="priority-select"
                  >
                    {(Object.keys(PRIORITY) as Priority[]).map((p) => (
                      <option key={p} value={p}>{PRIORITY[p].label}</option>
                    ))}
                  </select>
                </Section>
                <Section title="Assigned to">
                  <select
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    value={selected.ticket.assignedUserId ?? ""}
                    onChange={(e) => void patch({ assignedUserId: e.target.value || null }, "Assignment updated")}
                    data-testid="assign-select"
                  >
                    <option value="">Nobody</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>{p.id === userId ? `${p.fullName} (me)` : p.fullName}</option>
                    ))}
                  </select>
                </Section>
                <Section title="Tags">
                  <div className="flex flex-wrap gap-1.5">
                    {selected.ticket.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                        {tag}
                        <button type="button" aria-label={`Remove ${tag}`} onClick={() => void patch({ tags: selected.ticket.tags.filter((x) => x !== tag) })} className="text-muted-foreground hover:text-foreground">
                          <TbX size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    onBlur={addTag}
                    placeholder="Add a tag"
                    className="h-8 rounded-lg text-xs"
                    data-testid="tag-input"
                  />
                </Section>
              </>
            )}

            {Object.keys(selected.ticket.customData ?? {}).length > 0 && (
              <Section title="From the ticket form">
                <dl className="flex flex-col gap-2">
                  {Object.entries(selected.ticket.customData).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] capitalize text-muted-foreground">{k.replace(/[_-]+/g, " ")}</dt>
                      <dd className="whitespace-pre-wrap break-words text-[13px]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Section>
            )}

            {selected.ticket.rating && (
              <Section title="Visitor's rating">
                <div className="flex items-center gap-0.5" aria-label={`${selected.ticket.rating} out of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TbStarFilled key={n} size={15} className={n <= selected.ticket.rating! ? "text-amber-400" : "text-muted"} />
                  ))}
                </div>
              </Section>
            )}

            {selected.ticket.leadId && (
              <Link
                href={`${crmBase}?leadId=${selected.ticket.leadId}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted/60"
              >
                Open lead in CRM <TbExternalLink size={14} />
              </Link>
            )}

            {canReply && (
              <button type="button" onClick={() => void remove()} className="mt-auto inline-flex items-center gap-1.5 self-start text-xs font-medium text-red-600 hover:underline dark:text-red-400">
                <TbTrash size={13} /> Delete ticket
              </button>
            )}
          </aside>
        )}
      </div>
    </PageShell>
  );
}

function ThreadItem({ m, customer, seed, me }: { m: TicketMessage; customer: string; seed: string; me: boolean }) {
  if (m.role === "note") {
    return (
      <div className="rounded-xl border border-amber-300/60 bg-amber-50/70 px-3.5 py-2.5 dark:border-amber-400/25 dark:bg-amber-400/[0.06]" data-testid="thread-note">
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
          <TbLock size={12} /> Internal note · {me ? "You" : m.authorName || "Team"} · {timeAgo(m.createdAt)}
        </p>
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{m.text}</p>
      </div>
    );
  }
  const fromCustomer = m.role === "customer";
  const name = fromCustomer ? customer : me ? "You" : m.authorName || "Team";
  return (
    <div className="flex gap-3" data-testid={fromCustomer ? "thread-customer" : "thread-agent"}>
      <Avatar name={fromCustomer ? customer : m.authorName || "Team"} seed={fromCustomer ? seed : m.authorUserId || "team"} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{name}</span>· {timeAgo(m.createdAt)}
          {!fromCustomer && m.emailed === false && <Chip tone="red">Email not sent</Chip>}
          {!fromCustomer && m.emailed && <span className="inline-flex items-center gap-1"><TbMail size={11} /> {m.sentVia ? `Emailed from ${m.sentVia}` : "Emailed"}</span>}
        </p>
        <div className={cn("rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed", fromCustomer ? "bg-muted/70" : "border border-border bg-background")}>
          <p className="whitespace-pre-wrap break-words">{m.text}</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
