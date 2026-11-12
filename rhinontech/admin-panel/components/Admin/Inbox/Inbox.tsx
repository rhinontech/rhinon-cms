"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  TbAlertTriangle, TbArchive, TbDownload, TbInbox, TbMailOff, TbPaperclip, TbPencil, TbRefresh,
  TbSearch, TbSend, TbTrash, TbX,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { ComposeModal } from "./ComposeModal";
import { InboxInfo, InboxThread } from "./InboxThread";
import { BounceDetail, BounceOverview, BounceRow, downloadBounceCsv } from "./BounceReport";
import {
  addressFor, Avatar, IconButton, listTime, localPart, PaneMessage,
  type BounceReport, type Email, type Folder, type MailFolder, type SenderAddress,
} from "./inboxShared";

const PAGE_SIZE = 50;

const FOLDERS: Array<{ value: Folder; label: string }> = [
  { value: "inbox", label: "Inbox" },
  { value: "sent", label: "Sent" },
  { value: "archive", label: "Archive" },
  { value: "trash", label: "Trash" },
  { value: "bounced", label: "Bounced" },
];

const EMPTY: Record<MailFolder, { icon: React.ReactNode; title: string; body: string }> = {
  inbox: { icon: <TbInbox size={20} />, title: "You're all caught up", body: "New mail to your addresses lands here." },
  sent: { icon: <TbSend size={20} />, title: "Nothing sent yet", body: "Mail you send and replies you write show up here." },
  archive: { icon: <TbArchive size={20} />, title: "No archived mail", body: "Archive a conversation to clear it from your inbox without deleting it." },
  trash: { icon: <TbTrash size={20} />, title: "Trash is empty", body: "Deleted conversations wait here." },
};

const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
const isWide = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches;

/** Some older inbound mail was stored twice (a webhook delivery race); list each message once. */
function mergeUnique(existing: Email[], incoming: Email[]): Email[] {
  const ids = new Set(existing.map((e) => e.id));
  const messages = new Set(existing.map((e) => (e.messageId ? `${e.messageId}|${e.ownerEmail}` : "")).filter(Boolean));
  const out = [...existing];
  for (const e of incoming) {
    const key = e.messageId ? `${e.messageId}|${e.ownerEmail}` : null;
    if (ids.has(e.id) || (key && messages.has(key))) continue;
    ids.add(e.id);
    if (key) messages.add(key);
    out.push(e);
  }
  return out;
}

export default function Inbox() {
  const [folder, setFolder] = useState<Folder>("inbox");
  const [search, setSearch] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Email | null>(null);
  const [detailFailed, setDetailFailed] = useState(false);
  const [unread, setUnread] = useState(0);
  const [bounces, setBounces] = useState<BounceReport | null>(null);
  const [bounceState, setBounceState] = useState<"loading" | "ready" | "error">("loading");
  const [selectedBounce, setSelectedBounce] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(true);   // wide screens: the details column
  const [infoSheet, setInfoSheet] = useState(false); // narrower screens: details slide-over
  const [compose, setCompose] = useState<{ to?: string } | null>(null);
  const [addresses, setAddresses] = useState<SenderAddress[]>([]);
  /** "" = every address the viewer owns. */
  const [mailbox, setMailbox] = useState("");

  const listRequest = useRef(0);
  const detailRequest = useRef(0);
  const emailsRef = useRef<Email[]>([]);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { emailsRef.current = emails; }, [emails]);

  const mailFolder: MailFolder | null = folder === "bounced" ? null : folder;
  const multi = addresses.length > 1;

  useEffect(() => {
    apiFetch<SenderAddress[]>("/inbox/addresses").then(setAddresses).catch(() => { });
  }, []);

  const loadCounts = useCallback(() => {
    const query = mailbox ? `?mailbox=${encodeURIComponent(mailbox)}` : "";
    apiFetch<{ unread: number }>(`/inbox/counts${query}`).then((c) => setUnread(c.unread)).catch(() => { });
  }, [mailbox]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  const pagePath = useCallback((after?: Email) => {
    const params = new URLSearchParams({ folder: mailFolder ?? "inbox", limit: String(PAGE_SIZE) });
    if (search.trim()) params.set("search", search.trim());
    if (mailbox) params.set("mailbox", mailbox);
    if (after) {
      params.set("before", after.sentAt);
      params.set("beforeId", after.id);
    }
    return `/inbox?${params.toString()}`;
  }, [mailFolder, search, mailbox]);

  const loadList = useCallback(async (keepSelection = false) => {
    if (!mailFolder) return;
    const request = ++listRequest.current;
    if (!keepSelection) setListState("loading");
    try {
      const rows = await apiFetch<Email[]>(pagePath());
      if (request !== listRequest.current) return; // a newer folder or search won
      const unique = mergeUnique([], rows);
      setEmails(unique);
      setHasMore(rows.length >= PAGE_SIZE);
      setListState("ready");
      setSelectedId((current) => {
        if (current && (keepSelection || unique.some((e) => e.id === current))) return current;
        // Auto-open the first email only on desktop — on phones the list is
        // the landing view and auto-selecting would hide it behind the thread.
        return isDesktop() ? unique[0]?.id ?? null : null;
      });
    } catch {
      if (request === listRequest.current) setListState("error");
    }
  }, [mailFolder, pagePath]);

  useEffect(() => {
    if (!mailFolder) return;
    const timer = setTimeout(() => loadList(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadList, mailFolder, search]);

  const loadMore = useCallback(async () => {
    const last = emailsRef.current[emailsRef.current.length - 1];
    if (!mailFolder || loadingMore || !hasMore || !last) return;
    const request = listRequest.current;
    setLoadingMore(true);
    try {
      const rows = await apiFetch<Email[]>(pagePath(last));
      if (request !== listRequest.current) return;
      setEmails((current) => mergeUnique(current, rows));
      setHasMore(rows.length >= PAGE_SIZE);
    } catch {
      toast.error("Couldn't load more mail.");
    } finally {
      setLoadingMore(false);
    }
  }, [mailFolder, loadingMore, hasMore, pagePath]);

  // Next page as the end of the list scrolls into view.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { root: listScrollRef.current, rootMargin: "320px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, emails.length]);

  const openDetail = useCallback(async (id: string) => {
    const request = ++detailRequest.current;
    setDetailFailed(false);
    try {
      const data = await apiFetch<Email>(`/inbox/${id}`);
      if (request !== detailRequest.current) return;
      setDetail(data);
      setEmails((items) => items.map((i) => (i.id === id && !i.isRead ? { ...i, isRead: true } : i)));
    } catch {
      if (request === detailRequest.current) setDetailFailed(true);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    const row = emailsRef.current.find((e) => e.id === selectedId);
    if (row && !row.isRead && row.folder === "inbox") setUnread((u) => Math.max(0, u - 1));
    openDetail(selectedId);
  }, [selectedId, openDetail]);

  const loadBounces = useCallback(async () => {
    setBounceState((s) => (s === "ready" ? s : "loading"));
    try {
      const query = mailbox ? `?mailbox=${encodeURIComponent(mailbox)}` : "";
      const report = await apiFetch<BounceReport>(`/inbox/bounces${query}`);
      setBounces(report);
      setBounceState("ready");
      setSelectedBounce((current) =>
        current && report.addresses.some((a) => a.address === current)
          ? current
          : isDesktop() ? report.addresses[0]?.address ?? null : null
      );
    } catch {
      setBounceState("error");
    }
  }, [mailbox]);

  useEffect(() => {
    if (folder === "bounced") loadBounces();
  }, [folder, loadBounces]);

  const bounceRows = useMemo(() => {
    const rows = bounces?.addresses ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((a) => a.address.includes(q) || (a.reason ?? "").toLowerCase().includes(q) || (a.status ?? "").startsWith(q));
  }, [bounces, search]);

  const switchFolder = (next: Folder) => {
    if (next === folder) return;
    setFolder(next);
    setSelectedId(null);
    setDetail(null);
    setEmails([]);
    setHasMore(false);
    listScrollRef.current?.scrollTo({ top: 0 });
  };

  const refresh = async () => {
    setRefreshing(true);
    loadCounts();
    if (folder === "bounced") await loadBounces();
    else {
      await loadList(true);
      if (selectedId) await openDetail(selectedId);
    }
    setRefreshing(false);
  };

  const moveTo = useCallback(async (target: MailFolder) => {
    if (!detail || !mailFolder) return;
    const id = detail.id;
    const from = mailFolder;
    const list = emailsRef.current;
    const index = list.findIndex((e) => e.id === id);
    const next = list[index + 1] ?? list[index - 1] ?? null;
    try {
      await apiFetch(`/inbox/${id}`, { method: "PATCH", body: JSON.stringify({ folder: target }) });
    } catch (err: any) {
      toast.error(err.message || "Couldn't move this conversation.");
      return;
    }
    setEmails((items) => items.filter((e) => e.id !== id));
    setSelectedId(isDesktop() ? next?.id ?? null : null);
    loadCounts();
    const label = target === "trash" ? "Moved to Trash" : target === "archive" ? "Archived" : `Moved back to ${target === "sent" ? "Sent" : "Inbox"}`;
    toast(label, {
      action: {
        label: "Undo",
        onClick: () => {
          apiFetch(`/inbox/${id}`, { method: "PATCH", body: JSON.stringify({ folder: from }) })
            .then(() => { loadList(true); loadCounts(); })
            .catch(() => toast.error("Couldn't undo that."));
        },
      },
    });
  }, [detail, mailFolder, loadCounts, loadList]);

  const toggleInfo = () => (isWide() ? setShowInfo((s) => !s) : setInfoSheet(true));

  // Keyboard: j/k move through the list, e archives, # deletes, c composes, / searches.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || compose || infoSheet) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], [role='dialog']")) return;
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key === "c") { e.preventDefault(); setCompose({}); return; }
      if (!mailFolder) return;
      if (e.key === "j" || e.key === "k") {
        const list = emailsRef.current;
        const i = list.findIndex((m) => m.id === selectedId);
        const next = i === -1 ? list[0] : list[e.key === "j" ? i + 1 : i - 1];
        if (next) {
          e.preventDefault();
          setSelectedId(next.id);
          document.getElementById(`mail-${next.id}`)?.scrollIntoView({ block: "nearest" });
        }
      } else if (e.key === "e" && detail && mailFolder !== "archive" && mailFolder !== "trash") {
        moveTo("archive");
      } else if (e.key === "#" && detail && mailFolder !== "trash") {
        moveTo("trash");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compose, infoSheet, mailFolder, selectedId, detail, moveTo]);

  const subtitle =
    folder === "bounced"
      ? bounces ? `${bounces.addresses.length} bounced ${bounces.addresses.length === 1 ? "address" : "addresses"}` : "Delivery failures"
      : folder === "inbox"
        ? unread > 0 ? `${unread} unread` : "All caught up"
        : folder === "sent" ? "Mail you've sent" : folder === "archive" ? "Archived conversations" : "Deleted conversations";

  const showingDetail = folder === "bounced" ? !!selectedBounce : !!selectedId;
  const selectedEntry = folder === "bounced" ? bounces?.addresses.find((a) => a.address === selectedBounce) ?? null : null;
  const detailReady = !!detail && detail.id === selectedId;

  let list: React.ReactNode;
  if (folder === "bounced") {
    list =
      bounceState === "loading" && !bounces ? <ListSkeleton />
        : bounceState === "error" ? (
          <PaneMessage icon={<TbAlertTriangle size={20} />} title="Couldn't load bounces" body="Check your connection and try again." action={<Button size="sm" variant="outline" onClick={loadBounces}>Try again</Button>} />
        ) : bounceRows.length === 0 ? (
          search.trim()
            ? <PaneMessage icon={<TbSearch size={20} />} title="No matches" body={`No bounced address or reason matches “${search.trim()}”.`} />
            : <PaneMessage icon={<TbMailOff size={20} />} title="No bounces" body="Nothing you've sent has bounced." />
        ) : (
          <>
            {bounceRows.map((entry) => (
              <BounceRow key={entry.address} entry={entry} selected={entry.address === selectedBounce} onSelect={() => setSelectedBounce(entry.address)} />
            ))}
            {!!bounces?.unmatched && (
              <p className="px-3 py-3 text-center text-[11px] leading-4 text-muted-foreground">
                {`${bounces.unmatched} ${bounces.unmatched === 1 ? "notice didn't" : "notices didn't"} name an address.`}
              </p>
            )}
          </>
        );
  } else {
    const empty = EMPTY[mailFolder!];
    list =
      listState === "loading" ? <ListSkeleton />
        : listState === "error" ? (
          <PaneMessage icon={<TbAlertTriangle size={20} />} title="Couldn't load your mail" body="Check your connection and try again." action={<Button size="sm" variant="outline" onClick={() => loadList()}>Try again</Button>} />
        ) : emails.length === 0 ? (
          search.trim()
            ? <PaneMessage icon={<TbSearch size={20} />} title="No matches" body={`Nothing in ${folder} matches “${search.trim()}”.`} />
            : <PaneMessage icon={empty.icon} title={empty.title} body={empty.body} />
        ) : (
          <>
            {emails.map((e) => (
              <MailRow
                key={e.id}
                email={e}
                folder={mailFolder!}
                selected={e.id === selectedId}
                mailboxTag={multi && !mailbox && addressFor(addresses, e.ownerEmail)?.shared ? `${localPart(e.ownerEmail)}@` : null}
                onSelect={() => setSelectedId(e.id)}
              />
            ))}
            <div ref={sentinelRef} className="h-px" />
            {loadingMore && <p className="py-3 text-center text-[11px] text-muted-foreground">Loading more…</p>}
            {hasMore && !loadingMore && (
              <button onClick={loadMore} className="mx-auto my-2 block rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground">
                Load more
              </button>
            )}
          </>
        );
  }

  let pane: React.ReactNode;
  if (folder === "bounced") {
    pane = selectedEntry
      ? <BounceDetail key={selectedEntry.address} entry={selectedEntry} onBack={() => setSelectedBounce(null)} onCompose={(to) => setCompose({ to })} />
      : bounceState === "ready" ? <BounceOverview report={bounces} /> : <ThreadSkeleton />;
  } else if (!selectedId) {
    pane = <PaneMessage icon={<TbInbox size={20} />} title="No conversation selected" body="Pick a message from the list to read it here." />;
  } else if (detailReady) {
    pane = (
      <InboxThread
        key={detail!.threadKey}
        detail={detail!}
        folder={mailFolder!}
        addresses={addresses}
        infoOpen={showInfo}
        onToggleInfo={toggleInfo}
        onBack={() => setSelectedId(null)}
        onMove={moveTo}
        onReplied={async () => {
          await openDetail(detail!.id);
          if (folder === "sent") loadList(true);
        }}
      />
    );
  } else if (detailFailed) {
    pane = (
      <PaneMessage
        icon={<TbAlertTriangle size={20} />}
        title="Couldn't open this conversation"
        body="It may have been moved or deleted."
        action={<Button size="sm" variant="outline" onClick={() => openDetail(selectedId)}>Try again</Button>}
      />
    );
  } else {
    pane = <ThreadSkeleton />;
  }

  return (
    <div className="flex h-full min-h-0 gap-2 overflow-hidden">
      {/* List */}
      <section
        className={cn(
          "min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl glass-panel lg:flex lg:w-[360px] lg:shrink-0",
          showingDetail ? "hidden" : "flex"
        )}
      >
        <header className="shrink-0 px-4 pb-3 pt-4">
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold leading-6 tracking-tight text-foreground">Inbox</h1>
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            </div>
            {folder === "bounced" && (
              <IconButton title="Download as CSV" onClick={() => downloadBounceCsv(bounceRows)} disabled={!bounceRows.length}>
                <TbDownload size={17} />
              </IconButton>
            )}
            <IconButton title="Refresh" onClick={refresh}>
              <TbRefresh size={17} className={cn(refreshing && "animate-spin")} />
            </IconButton>
            <Button size="sm" onClick={() => setCompose({})} title="Compose (C)" className="ml-1">
              <TbPencil /> Compose
            </Button>
          </div>

          <div className="relative mt-3.5">
            <TbSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") { setSearch(""); e.currentTarget.blur(); } }}
              placeholder={folder === "bounced" ? "Search addresses or reasons" : "Search mail"}
              className="h-9 w-full rounded-lg border border-input bg-background/70 pl-9 pr-9 text-[13px] text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/80 focus:border-ring/60 focus:ring-[3px] focus:ring-ring/15"
            />
            {search ? (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground" aria-label="Clear search">
                <TbX size={14} />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border bg-muted/70 px-1.5 font-sans text-[10px] font-medium leading-4 text-muted-foreground">/</kbd>
            )}
          </div>

          {multi && (
            <NativeSelect
              value={mailbox}
              onChange={(e) => setMailbox(e.target.value)}
              aria-label="Which address"
              className="mt-2 w-full rounded-lg border border-input bg-background/70 px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="">All my addresses ({addresses.length})</option>
              {addresses.map((a) => (
                <option key={a.address} value={a.address}>{a.address}{a.shared ? "" : " (you)"}</option>
              ))}
            </NativeSelect>
          )}

          <div className="segmented mt-3" role="tablist" aria-label="Folders">
            {FOLDERS.map((f) => (
              <button
                key={f.value}
                role="tab"
                aria-selected={folder === f.value}
                onClick={() => switchFolder(f.value)}
                className={cn(
                  "flex flex-auto items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-xs font-medium transition-colors",
                  folder === f.value ? "segment-active" : "text-muted-foreground hover:text-foreground",
                  f.value === "bounced" && folder !== "bounced" && "hover:text-rose-600 dark:hover:text-rose-400"
                )}
              >
                {f.label}
                {f.value === "inbox" && unread > 0 && (
                  <span className="rounded-full bg-brand px-1.5 text-[10px] font-semibold leading-4 tabular-nums text-brand-foreground">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        <div ref={listScrollRef} className="min-h-0 flex-1 overflow-y-auto border-t px-2 py-2">
          {list}
        </div>
      </section>

      {/* Conversation, or a bounced address */}
      <section
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl glass-panel lg:flex",
          showingDetail ? "flex" : "hidden"
        )}
      >
        {pane}
      </section>

      {/* Details: a column on wide screens, a slide-over below that */}
      {folder !== "bounced" && detailReady && showInfo && (
        <aside className="hidden min-h-0 w-[288px] shrink-0 flex-col overflow-hidden rounded-xl glass-panel xl:flex">
          <InboxInfo detail={detail!} onCompose={(to) => setCompose({ to })} />
        </aside>
      )}
      {folder !== "bounced" && detailReady && infoSheet && (
        <>
          <div className="fixed inset-0 z-40 glass-overlay xl:hidden" onClick={() => setInfoSheet(false)} />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-[88vw] max-w-[340px] flex-col bg-card shadow-2xl xl:hidden">
            <InboxInfo detail={detail!} onClose={() => setInfoSheet(false)} onCompose={(to) => { setInfoSheet(false); setCompose({ to }); }} />
          </aside>
        </>
      )}

      {compose && (
        <ComposeModal
          onClose={() => setCompose(null)}
          onSent={() => {
            toast.success("Message sent");
            if (folder === "sent") loadList(true);
          }}
          addresses={addresses}
          initialTo={compose.to}
          // Composing while filtered to hello@ starts from hello@.
          defaultFrom={(mailbox && addresses.find((a) => a.address === mailbox)?.address) || addresses[0]?.address || ""}
        />
      )}
    </div>
  );
}

function MailRow({ email: e, folder, selected, mailboxTag, onSelect }: {
  email: Email;
  folder: MailFolder;
  selected: boolean;
  mailboxTag: string | null;
  onSelect: () => void;
}) {
  // Sent mail is about who it went to; everything else, who it came from.
  const outgoing = folder === "sent";
  const who = outgoing ? e.toEmails.join(", ") || "No recipient" : e.fromName || e.fromEmail;
  const unread = !e.isRead && !outgoing;
  return (
    <button
      id={`mail-${e.id}`}
      onClick={onSelect}
      className={cn(
        "relative flex w-full gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
        selected ? "bg-[var(--surface-selected)] shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--brand)_18%,transparent)]" : "hover:bg-foreground/[0.04]"
      )}
    >
      {unread && <span className="absolute left-[3px] top-[26px] h-1.5 w-1.5 rounded-full bg-brand" aria-label="Unread" />}
      <Avatar name={outgoing ? who : e.fromName || e.fromEmail} seed={outgoing ? e.toEmails[0] ?? who : e.fromEmail} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={cn("min-w-0 flex-1 truncate text-[13px]", unread ? "font-semibold text-foreground" : "font-medium text-foreground/85")}>
            {outgoing ? `To: ${who}` : who}
          </span>
          <time className={cn("shrink-0 text-[11px] tabular-nums", unread ? "font-semibold text-brand" : "text-muted-foreground")}>{listTime(e.sentAt)}</time>
        </span>
        <span className={cn("block truncate text-[13px] leading-5", unread ? "font-medium text-foreground" : "text-foreground/75")}>
          {e.subject || "(No subject)"}
        </span>
        <span className="block truncate text-xs leading-5 text-muted-foreground">
          {e.hasAttachment && <TbPaperclip size={11} className="mr-1 inline -translate-y-px" />}
          {e.snippet || "No preview"}
        </span>
        {(e.campaign || mailboxTag) && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {mailboxTag && (
              <span className="rounded-full bg-sky-50 px-1.5 py-px text-[10.5px] font-medium text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20">
                {mailboxTag}
              </span>
            )}
            {e.campaign && (
              <span className="max-w-full truncate rounded-full bg-violet-50 px-1.5 py-px text-[10.5px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20">
                {e.campaign.name}
              </span>
            )}
          </span>
        )}
      </span>
    </button>
  );
}

function ListSkeleton() {
  return (
    <div aria-hidden className="space-y-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-3 py-2.5">
          <span className="h-9 w-9 shrink-0 rounded-full skeleton-shimmer" />
          <span className="flex-1 space-y-2 pt-0.5">
            <span className="flex justify-between gap-6">
              <span className="h-3 w-2/5 rounded skeleton-shimmer" />
              <span className="h-3 w-10 rounded skeleton-shimmer" />
            </span>
            <span className="block h-3 w-4/5 rounded skeleton-shimmer" />
            <span className="block h-3 w-3/5 rounded skeleton-shimmer" />
          </span>
        </div>
      ))}
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div aria-hidden className="flex flex-1 flex-col">
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <span className="h-4 w-2/5 rounded skeleton-shimmer" />
      </div>
      <div className="mx-auto w-full max-w-[860px] space-y-3 p-5">
        <div className="rounded-xl border bg-card p-5 shadow-xs">
          <div className="flex gap-3">
            <span className="h-9 w-9 rounded-full skeleton-shimmer" />
            <span className="flex-1 space-y-2">
              <span className="block h-3 w-1/3 rounded skeleton-shimmer" />
              <span className="block h-3 w-1/4 rounded skeleton-shimmer" />
            </span>
          </div>
          <div className="mt-5 space-y-2.5">
            <span className="block h-3 w-full rounded skeleton-shimmer" />
            <span className="block h-3 w-11/12 rounded skeleton-shimmer" />
            <span className="block h-3 w-4/5 rounded skeleton-shimmer" />
            <span className="block h-3 w-2/3 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
