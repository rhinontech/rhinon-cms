"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentSite } from "@/lib/sites";
import type { IEvent } from "../types";
import { CATEGORIES, type EventCategory, slugify } from "../Editor/eventForm";
import { eventsApi, type Guest } from "./api";
import { ConfirmDialog, StatCard, formatDay } from "./ui";
import OverviewTab from "./tabs/OverviewTab";
import GuestsTab from "./tabs/GuestsTab";
import EmailsTab from "./tabs/EmailsTab";
import ReferralsTab from "./tabs/ReferralsTab";
import ResponsesTab from "./tabs/ResponsesTab";
import CertificatesTab from "./tabs/CertificatesTab";

export interface ManageContext {
  event: IEvent;
  guests: Guest[];
  reloadGuests: () => Promise<void>;
  reloadEvent: () => Promise<void>;
  goTo: (tab: TabId) => void;
}

export type TabId = "overview" | "guests" | "emails" | "referrals" | "responses" | "certificates";
const TABS: TabId[] = ["overview", "guests", "emails", "referrals", "responses", "certificates"];

export function DuplicateDialog({ event, open, onOpenChange, onDone }: { event: IEvent; open: boolean; onOpenChange: (v: boolean) => void; onDone: (id: string) => void }) {
  const [title, setTitle] = useState(`${event.eventTitle} (Copy)`);
  const [slug, setSlug] = useState(`${event.eventSlug}-copy`);
  const [start, setStart] = useState(event.eventStartDate?.slice(0, 10) ?? "");
  const [end, setEnd] = useState(event.eventEndDate?.slice(0, 10) ?? "");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Duplicate event</DialogTitle>
          <DialogDescription>
            Copies the page content, enrollment emails and certificate design. Guests, reminders and feedback start empty.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dup-title">Title</Label>
            <Input id="dup-title" value={title} onChange={(e) => { setTitle(e.target.value); setSlug(slugify(e.target.value)); }} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dup-slug">Page URL</Label>
            <Input id="dup-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dup-start">Start date</Label>
              <Input id="dup-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dup-end">End date</Label>
              <Input id="dup-end" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={busy || !title.trim() || !slugify(slug) || !start}
            onClick={async () => {
              setBusy(true);
              try {
                const res = await eventsApi.duplicate(String(event.id), {
                  eventTitle: title.trim(),
                  eventSlug: slugify(slug),
                  eventStartDate: start,
                  eventEndDate: end || start,
                });
                toast.success(
                  `Duplicated — ${res.copied.enrollmentEmails} enrollment email(s)${res.copied.certificateTemplate ? " and the certificate" : ""} copied`
                );
                onDone(String(res.newEvent.id));
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not duplicate");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />} Duplicate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EventManage({ eventId }: { eventId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { site } = useCurrentSite();
  const listUrl = pathname.replace(/\/manage(-events)?\/[^/]+$/, "");

  const [event, setEvent] = useState<IEvent | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [dupOpen, setDupOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const initialTab = (params.get("tab") as TabId) || "overview";
  const [tab, setTab] = useState<TabId>(TABS.includes(initialTab) ? initialTab : "overview");

  const reloadEvent = useCallback(async () => {
    try {
      setEvent(await eventsApi.event(eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the event");
    }
  }, [eventId]);
  const reloadGuests = useCallback(async () => {
    try {
      setGuests(await eventsApi.guests(eventId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load guests");
    }
  }, [eventId]);

  useEffect(() => {
    reloadEvent();
    reloadGuests();
  }, [reloadEvent, reloadGuests]);

  const goTo = useCallback(
    (next: TabId) => {
      setTab(next);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState(null, "", url);
    },
    []
  );

  const stats = useMemo(() => {
    const count = (fn: (g: Guest) => boolean) => guests.filter(fn).length;
    return {
      total: guests.length,
      approved: count((g) => g.guestType === "Approved"),
      waitlist: count((g) => g.guestType === "Waitlist"),
      responses: count((g) => Boolean(g.feedbackSubmittedAt)),
      issued: count((g) => g.certificateGenerated),
    };
  }, [guests]);

  if (error) {
    return (
      <div className="grid place-items-center min-h-[60vh] gap-3 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => router.push(listUrl)}>Back to events</Button>
      </div>
    );
  }
  if (!event) {
    return (
      <div className="grid place-items-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const category = CATEGORIES[(event.eventCategory as EventCategory) || "Normal"] ?? CATEGORIES.Normal;
  const team = ["Hackathon", "Teardown"].includes(event.eventType);
  const siteUrl = (site?.siteUrl || "").replace(/\/$/, "");
  const ctx: ManageContext = { event, guests, reloadGuests, reloadEvent, goTo };

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-20 glass-header border-b">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.push(listUrl)}>
            <ArrowLeft className="size-4" /> Events
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[16px] font-semibold">{event.eventTitle}</h1>
              {event.isPublished ? (
                <Badge className="border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Published</Badge>
              ) : (
                <Badge variant="secondary">Draft</Badge>
              )}
              <Badge variant="outline" className="gap-1.5">
                <span className={`size-1.5 rounded-full ${category.dot}`} /> {category.label}
              </Badge>
              {event.eventType !== "Workshop" ? <Badge variant="outline">{event.eventType}</Badge> : null}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {formatDay(event.eventStartDate)}
              {event.eventEndDate && event.eventEndDate !== event.eventStartDate ? ` – ${formatDay(event.eventEndDate)}` : ""}
              {event.eventStartTime ? ` · ${event.eventStartTime}` : ""}
            </p>
          </div>
          {event.isPublished && siteUrl ? (
            <Button variant="ghost" size="sm" className="hidden md:inline-flex gap-1.5" asChild>
              <a href={`${siteUrl}/events/${event.eventSlug}`} target="_blank" rel="noopener noreferrer">
                View on site <ExternalLink className="size-3.5" />
              </a>
            </Button>
          ) : null}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push(`${listUrl}/edit/${event.id}`)}>
            <Pencil className="size-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant={event.isPublished ? "outline" : "default"}
            className="gap-1.5"
            disabled={publishing}
            onClick={async () => {
              setPublishing(true);
              try {
                await eventsApi.publish(String(event.id), !event.isPublished);
                toast.success(event.isPublished ? "Unpublished" : "Published");
                await reloadEvent();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not change publishing");
              } finally {
                setPublishing(false);
              }
            }}
          >
            {publishing ? <Loader2 className="size-4 animate-spin" /> : event.isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {event.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="More actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDupOpen(true)}>
                <Copy className="size-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" /> Delete event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Users} label="Registrations" value={stats.total} hint={`${event.numberOfAttendees || 0} shown on the page`} />
          <StatCard icon={UserCheck} label="Approved" value={stats.approved} hint={stats.total ? `${Math.round((stats.approved / stats.total) * 100)}% of registrations` : "—"} />
          <StatCard icon={Users} label="Waitlist" value={stats.waitlist} hint={stats.waitlist ? "Awaiting your decision" : "Nobody waiting"} />
          <StatCard icon={MessageSquareText} label={team ? "Submissions" : "Feedback"} value={stats.responses} hint={event.canAcceptResponse ? "Accepting responses" : "Responses closed"} />
          <StatCard icon={Award} label="Certificates" value={stats.issued} hint={`${guests.filter((g) => g.certificateApproved && !g.certificateGenerated).length} approved, not issued`} />
        </div>

        <Tabs value={tab} onValueChange={(v) => goTo(v as TabId)} className="space-y-6">
          <TabsList className="glass-card h-auto p-1 rounded-xl w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="rounded-lg px-4 py-2">Overview</TabsTrigger>
            <TabsTrigger value="guests" className="rounded-lg px-4 py-2 gap-2">
              Guests <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold">{stats.total}</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="rounded-lg px-4 py-2">Emails</TabsTrigger>
            <TabsTrigger value="referrals" className="rounded-lg px-4 py-2">Referrals</TabsTrigger>
            <TabsTrigger value="responses" className="rounded-lg px-4 py-2 gap-2">
              {team ? "Submissions" : "Feedback"} <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold">{stats.responses}</span>
            </TabsTrigger>
            <TabsTrigger value="certificates" className="rounded-lg px-4 py-2">Certificates</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><OverviewTab {...ctx} /></TabsContent>
          <TabsContent value="guests"><GuestsTab {...ctx} /></TabsContent>
          <TabsContent value="emails"><EmailsTab {...ctx} /></TabsContent>
          <TabsContent value="referrals"><ReferralsTab {...ctx} /></TabsContent>
          <TabsContent value="responses"><ResponsesTab {...ctx} /></TabsContent>
          <TabsContent value="certificates"><CertificatesTab {...ctx} /></TabsContent>
        </Tabs>
      </div>

      <DuplicateDialog event={event} open={dupOpen} onOpenChange={setDupOpen} onDone={(id) => router.push(`${listUrl}/manage/${id}`)} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        destructive
        title="Delete this event?"
        description={
          <>
            <strong>{event.eventTitle}</strong>{` and its ${stats.total} registration${stats.total === 1 ? "" : "s"}, emails, feedback and certificate records will be removed. This can't be undone.`}
          </>
        }
        confirmLabel="Delete event"
        onConfirm={async () => {
          await eventsApi.remove(String(event.id));
          toast.success("Event deleted");
          router.push(listUrl);
        }}
      />
    </div>
  );
}
