"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FilePen,
  Hourglass,
  ImageOff,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentSite } from "@/lib/sites";
import type { IEvent } from "./types";
import { CATEGORIES, type EventCategory } from "./Editor/eventForm";
import { DuplicateDialog } from "./Manage/EventManage";
import { eventsApi } from "./Manage/api";
import { ConfirmDialog, EmptyState, StatCard, formatDay } from "./Manage/ui";

/* ------------------------------------------------------------------ timing */

type View = "upcoming" | "past" | "drafts" | "all";
type Phase = "live" | "upcoming" | "past";

const VIEWS: { id: View; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "drafts", label: "Drafts" },
  { id: "all", label: "All" },
];

// Event dates are business dates in IST, whatever the admin's own timezone.
const istToday = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
const day = (value?: string) => (value || "").slice(0, 10);
const endOf = (e: IEvent) => day(e.eventEndDate) || day(e.eventStartDate);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);

function phaseOf(e: IEvent, today: string): Phase {
  const start = day(e.eventStartDate);
  if (!start) return "upcoming";
  if (endOf(e) < today) return "past";
  return start <= today ? "live" : "upcoming";
}

function span(days: number) {
  if (days < 14) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}

function relative(e: IEvent, today: string): string {
  const phase = phaseOf(e, today);
  if (!day(e.eventStartDate)) return "No date set";
  if (phase === "live") return "Happening now";
  if (phase === "upcoming") {
    const d = daysBetween(day(e.eventStartDate), today);
    return d === 1 ? "Tomorrow" : `In ${span(d)}`;
  }
  const d = daysBetween(today, endOf(e));
  return d === 1 ? "Ended yesterday" : `Ended ${span(d)} ago`;
}

/** "18 Oct 2026", "3 – 6 Nov 2026", "28 Nov – 2 Dec 2026". */
function dateRange(e: IEvent) {
  const start = day(e.eventStartDate);
  const end = endOf(e);
  if (!start || end === start) return formatDay(start);
  const [sy, sm] = start.split("-");
  const [ey, em] = end.split("-");
  const d = (v: string, opts: Intl.DateTimeFormatOptions) => new Date(`${v}T00:00:00`).toLocaleDateString("en-IN", opts);
  if (sy !== ey) return `${formatDay(start)} – ${formatDay(end)}`;
  if (sm !== em) return `${d(start, { day: "numeric", month: "short" })} – ${formatDay(end)}`;
  return `${Number(start.slice(8))} – ${formatDay(end)}`;
}

/** "Online · Zoom" — without repeating the type when the location already names it. */
function whereOf(e: IEvent) {
  const type = e.locationType || "Online";
  const place = (e.location || "").trim();
  if (!place) return type;
  return place.toLowerCase().includes(type.toLowerCase()) ? place : `${type} · ${place}`;
}

const regs = (e: IEvent) => e.registrations ?? { total: 0, approved: 0, waitlist: 0 };
const categoryOf = (e: IEvent) => CATEGORIES[(e.eventCategory as EventCategory) || "Normal"] ?? CATEGORIES.Normal;

/* ------------------------------------------------------------------ pieces */

function Thumb({ src, className = "" }: { src?: string; className?: string }) {
  return src ? (
    // Admin-uploaded banners from any bucket; a plain <img> avoids next/image remote allow-listing.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`object-cover bg-muted ${className}`} />
  ) : (
    <span className={`grid place-items-center bg-muted text-muted-foreground ${className}`}>
      <ImageOff className="size-4" aria-hidden />
    </span>
  );
}

function When({ event, today }: { event: IEvent; today: string }) {
  const phase = phaseOf(event, today);
  return (
    <div className="text-[13px] leading-snug">
      <p className="font-medium whitespace-nowrap">{dateRange(event)}</p>
      <p className={`mt-0.5 flex items-center gap-1.5 text-[12px] ${phase === "live" ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}`}>
        {phase === "live" ? <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> : null}
        {relative(event, today)}
      </p>
    </div>
  );
}

function RegistrationBar({ event }: { event: IEvent }) {
  const r = regs(event);
  const declined = Math.max(0, r.total - r.approved - r.waitlist);
  const parts = [
    { key: "Approved", n: r.approved, dot: "bg-emerald-500" },
    { key: "Waiting", n: r.waitlist, dot: "bg-amber-500" },
    { key: "Declined", n: declined, dot: "bg-rose-400" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex h-2 overflow-hidden rounded-full bg-muted gap-0.5">
        {r.total ? parts.filter((p) => p.n).map((p) => <span key={p.key} className={p.dot} style={{ width: `${(p.n / r.total) * 100}%` }} />) : null}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {parts.map((p) => (
          <div key={p.key} className="rounded-xl border px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <span className={`size-1.5 rounded-full ${p.dot}`} /> {p.key}
            </p>
            <p className="mt-1 text-[18px] font-semibold leading-none">{p.n}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ page */

export default function Events() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { site } = useCurrentSite();
  const siteUrl = (site?.siteUrl || "").replace(/\/$/, "");

  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<IEvent | null>(null);
  const [toDuplicate, setToDuplicate] = useState<IEvent | null>(null);

  const today = istToday();
  const view: View = (VIEWS.find((v) => v.id === params.get("view"))?.id as View) || "upcoming";
  const setView = (v: View) => router.replace(`${pathname}?view=${v}`, { scroll: false });

  const load = useCallback(async () => {
    setError("");
    try {
      setEvents(await eventsApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const manageUrl = (id: IEvent["id"], tab?: string) => `${pathname}/manage/${id}${tab ? `?tab=${tab}` : ""}`;
  const editUrl = (id: IEvent["id"]) => `${pathname}/edit/${id}`;

  const buckets = useMemo(() => {
    const upcoming = events
      .filter((e) => phaseOf(e, today) !== "past")
      .sort((a, b) => day(a.eventStartDate).localeCompare(day(b.eventStartDate)));
    const past = events.filter((e) => phaseOf(e, today) === "past").sort((a, b) => endOf(b).localeCompare(endOf(a)));
    return { upcoming, past, drafts: events.filter((e) => !e.isPublished), all: [...upcoming, ...past] };
  }, [events, today]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return buckets[view].filter((e) => {
      if (category !== "all" && (e.eventCategory || "Normal") !== category) return false;
      if (!q) return true;
      return [e.eventTitle, e.eventSubtitle, e.eventSlug, e.eventType, ...(e.tags || []), ...(e.speakers || []).map((s) => s.name)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [buckets, view, search, category]);

  const summary = useMemo(() => {
    // Counted the same way as the Upcoming tab (drafts included), so the two agree.
    const live = buckets.upcoming;
    const next = live.find((e) => e.isPublished) ?? live[0];
    return {
      upcoming: live.length,
      next,
      registrations: live.reduce((n, e) => n + regs(e).total, 0),
      approved: live.reduce((n, e) => n + regs(e).approved, 0),
      waiting: live.reduce((n, e) => n + regs(e).waitlist, 0),
      waitingEvents: live.filter((e) => regs(e).waitlist > 0).length,
      drafts: buckets.drafts.length,
    };
  }, [buckets]);

  const open = events.find((e) => String(e.id) === openId) || null;

  const togglePublish = async (event: IEvent) => {
    setBusyId(String(event.id));
    try {
      await eventsApi.publish(String(event.id), !event.isPublished);
      toast.success(event.isPublished ? "Unpublished — removed from the site" : "Published — live on the site");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change publishing");
    } finally {
      setBusyId(null);
    }
  };

  const actions = (event: IEvent) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`More actions for ${event.eventTitle}`} disabled={busyId === String(event.id)}>
          {busyId === String(event.id) ? <RefreshCw className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => router.push(editUrl(event.id))}>
          <Pencil className="size-4" /> Edit details
        </DropdownMenuItem>
        {event.isPublished && siteUrl ? (
          <DropdownMenuItem asChild>
            <a href={`${siteUrl}/events/${event.eventSlug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" /> View on site
            </a>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={() => togglePublish(event)}>
          {event.isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {event.isPublished ? "Unpublish" : "Publish"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setToDuplicate(event)}>
          <Copy className="size-4" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(event)}>
          <Trash2 className="size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const emptyCopy: Record<View, { title: string; body: string }> = {
    upcoming: { title: "Nothing scheduled", body: "No upcoming events yet. Create one, or duplicate a past event to reuse its emails and certificate." },
    past: { title: "No past events", body: "Events move here the day after they end, with their guests, feedback and certificates intact." },
    drafts: { title: "No drafts", body: "Every event is published. Unpublished events show up here." },
    all: { title: "No events yet", body: "Create your first workshop, hackathon or teardown." },
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-20 glass-header border-b">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[16px] font-semibold">Events</h1>
            <p className="text-[12.5px] text-muted-foreground">Workshops, hackathons and teardowns — registrations, emails and certificates.</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => router.push(`${pathname}/new`)}>
            <Plus className="size-4" /> New event
          </Button>
        </div>
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={CalendarDays}
            label="Upcoming"
            value={loading ? "–" : summary.upcoming}
            hint={summary.next ? `Next: ${summary.next.eventTitle} · ${relative(summary.next, today).toLowerCase()}` : "Nothing published ahead"}
          />
          <StatCard
            icon={Users}
            label="Registrations"
            value={loading ? "–" : summary.registrations}
            hint={summary.registrations ? `${summary.approved} approved across upcoming events` : "Across upcoming events"}
          />
          <StatCard
            icon={Hourglass}
            label="Awaiting approval"
            value={loading ? "–" : summary.waiting}
            hint={summary.waiting ? `On ${summary.waitingEvents} event${summary.waitingEvents === 1 ? "" : "s"} — open one to review` : "Nobody waiting"}
          />
          <StatCard icon={FilePen} label="Drafts" value={loading ? "–" : summary.drafts} hint={summary.drafts ? "Not visible on the site" : "Everything is published"} />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div role="tablist" aria-label="Which events" className="glass-card inline-flex w-fit rounded-xl p-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                role="tab"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  view === v.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.label}
                <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold tabular-nums">{buckets[v.id].length}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-1 flex-col sm:flex-row gap-3 lg:justify-end">
            <div className="relative sm:w-72">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, slug, tag, host…" className="pl-9" aria-label="Search events" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="sm:w-52" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {(Object.keys(CATEGORIES) as EventCategory[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${CATEGORIES[key].dot}`} /> {CATEGORIES[key].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <EmptyState
            icon={RefreshCw}
            title="Couldn't load events"
            body={error}
            action={
              <Button variant="outline" size="sm" onClick={() => { setLoading(true); load(); }}>
                Try again
              </Button>
            }
          />
        ) : !loading && rows.length === 0 ? (
          search || category !== "all" ? (
            <EmptyState
              icon={Search}
              title="No matches"
              body="Nothing in this view matches your search or category."
              action={<Button variant="outline" size="sm" onClick={() => { setSearch(""); setCategory("all"); }}>Clear filters</Button>}
            />
          ) : (
            <EmptyState
              icon={CalendarPlus}
              title={emptyCopy[view].title}
              body={emptyCopy[view].body}
              action={view !== "past" && view !== "drafts" ? <Button size="sm" className="gap-1.5" onClick={() => router.push(`${pathname}/new`)}><Plus className="size-4" /> New event</Button> : null}
            />
          )
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Event</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Registrations</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-5 text-right"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array.from({ length: 5 }, (_, i) => (
                        <TableRow key={i}>
                          <TableCell className="pl-5"><div className="flex items-center gap-3"><Skeleton className="h-10 w-16 rounded-lg" /><div className="space-y-1.5"><Skeleton className="h-3.5 w-52" /><Skeleton className="h-3 w-32" /></div></div></TableCell>
                          <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                          <TableCell />
                        </TableRow>
                      ))
                    : rows.map((event) => {
                        const cat = categoryOf(event);
                        const r = regs(event);
                        return (
                          <TableRow
                            key={event.id}
                            className="cursor-pointer"
                            onClick={() => setOpenId(String(event.id))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setOpenId(String(event.id));
                            }}
                            tabIndex={0}
                          >
                            <TableCell className="pl-5 py-3">
                              <div className="flex items-center gap-3 min-w-0 max-w-[340px]">
                                <Thumb src={event.eventCreativeUrl} className="h-10 w-16 shrink-0 rounded-lg" />
                                <div className="min-w-0">
                                  <p className="truncate text-[14px] font-semibold">{event.eventTitle}</p>
                                  <p className="truncate font-mono text-[11.5px] text-muted-foreground">/{event.eventSlug}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-start gap-1">
                                <span className="flex items-center gap-1.5 text-[13px] whitespace-nowrap">
                                  <span className={`size-1.5 rounded-full ${cat.dot}`} /> {cat.label}
                                </span>
                                {event.eventType !== "Workshop" ? <Badge variant="outline" className="text-[11px]">{event.eventType}</Badge> : null}
                              </div>
                            </TableCell>
                            <TableCell><When event={event} today={today} /></TableCell>
                            <TableCell>
                              <p className="text-[14px] font-semibold tabular-nums">{r.total}</p>
                              <p className="text-[12px] text-muted-foreground whitespace-nowrap">
                                {r.approved} approved
                                {r.waitlist ? <span className="text-amber-600 dark:text-amber-400"> · {r.waitlist} waiting</span> : null}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-start gap-1">
                                {event.isPublished ? (
                                  <Badge className="border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Published</Badge>
                                ) : (
                                  <Badge variant="secondary">Draft</Badge>
                                )}
                                {event.canAcceptResponse ? <span className="text-[11.5px] text-muted-foreground whitespace-nowrap">Responses open</span> : null}
                              </div>
                            </TableCell>
                            <TableCell className="pr-5" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="outline" size="sm" onClick={() => router.push(manageUrl(event.id))}>
                                  Manage
                                </Button>
                                {actions(event)}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <Sheet open={Boolean(open)} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
          {open ? (
            <>
              <Thumb src={open.eventCreativeUrl} className="aspect-[16/8] w-full" />
              <div className="space-y-6 p-6">
                <SheetHeader className="p-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {open.isPublished ? (
                      <Badge className="border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                    <Badge variant="outline" className="gap-1.5">
                      <span className={`size-1.5 rounded-full ${categoryOf(open).dot}`} /> {categoryOf(open).label}
                    </Badge>
                    {open.eventType !== "Workshop" ? <Badge variant="outline">{open.eventType}</Badge> : null}
                  </div>
                  <SheetTitle className="text-left text-[20px] leading-tight">{open.eventTitle}</SheetTitle>
                  {open.eventSubtitle ? <SheetDescription className="text-left">{open.eventSubtitle}</SheetDescription> : null}
                </SheetHeader>

                <dl className="space-y-2.5 text-[13.5px]">
                  <div className="flex items-start gap-2.5">
                    <dt className="sr-only">Date</dt>
                    <CalendarDays className="size-4 mt-0.5 text-muted-foreground" aria-hidden />
                    <dd>
                      {dateRange(open)} <span className="text-muted-foreground">· {relative(open, today)}</span>
                    </dd>
                  </div>
                  {open.eventStartTime ? (
                    <div className="flex items-start gap-2.5">
                      <dt className="sr-only">Time</dt>
                      <Clock className="size-4 mt-0.5 text-muted-foreground" aria-hidden />
                      <dd>
                        {open.eventStartTime}
                        {open.eventEndTime ? ` – ${open.eventEndTime}` : ""} IST
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-2.5">
                    <dt className="sr-only">Location</dt>
                    <MapPin className="size-4 mt-0.5 text-muted-foreground" aria-hidden />
                    <dd>{whereOf(open)}</dd>
                  </div>
                </dl>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Registrations · {regs(open).total}</h3>
                    {regs(open).waitlist ? (
                      <Button variant="link" size="sm" className="h-auto p-0 text-[12.5px]" onClick={() => router.push(manageUrl(open.id, "guests"))}>
                        Review waitlist →
                      </Button>
                    ) : null}
                  </div>
                  <RegistrationBar event={open} />
                  <p className="text-[12px] text-muted-foreground">
                    The page shows {open.numberOfAttendees || 0}+ attending · responses {open.canAcceptResponse ? "open" : "closed"}
                  </p>
                </section>

                {open.speakers?.length ? (
                  <section className="space-y-2.5">
                    <h3 className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Hosts</h3>
                    <ul className="space-y-2">
                      {open.speakers.map((s, i) => (
                        <li key={`${s.name}-${i}`} className="flex items-center gap-3">
                          {s.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.photoUrl} alt="" className="size-9 rounded-full object-cover bg-muted" />
                          ) : (
                            <span className="grid size-9 place-items-center rounded-full bg-muted text-[12px] font-semibold">{s.name?.[0] || "?"}</span>
                          )}
                          <div className="min-w-0 text-[13px] leading-tight">
                            <p className="truncate font-medium">{s.name}</p>
                            <p className="truncate text-muted-foreground">{[s.designation, s.company].filter(Boolean).join(", ")}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {open.tags?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {open.tags.map((t) => (
                      <Badge key={t} variant="outline" className="text-[11.5px] font-normal">{t}</Badge>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 border-t pt-5">
                  <Button className="flex-1" onClick={() => router.push(manageUrl(open.id))}>Manage event</Button>
                  <Button variant="outline" className="gap-1.5" onClick={() => router.push(editUrl(open.id))}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  {open.isPublished && siteUrl ? (
                    <Button variant="outline" className="gap-1.5" asChild>
                      <a href={`${siteUrl}/events/${open.eventSlug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3.5" /> Site
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(v) => !v && setToDelete(null)}
        destructive
        title="Delete this event?"
        description={
          toDelete ? (
            <>
              <strong>{toDelete.eventTitle}</strong>{` and its ${regs(toDelete).total} registration${regs(toDelete).total === 1 ? "" : "s"}, emails, feedback and certificate records will be removed. This can't be undone.`}
            </>
          ) : null
        }
        confirmLabel="Delete event"
        onConfirm={async () => {
          if (!toDelete) return;
          await eventsApi.remove(String(toDelete.id));
          toast.success("Event deleted");
          if (openId === String(toDelete.id)) setOpenId(null);
          await load();
        }}
      />

      {toDuplicate ? (
        <DuplicateDialog
          key={toDuplicate.id}
          event={toDuplicate}
          open
          onOpenChange={(v) => !v && setToDuplicate(null)}
          onDone={() => {
            setToDuplicate(null);
            load();
          }}
        />
      ) : null}
    </div>
  );
}
