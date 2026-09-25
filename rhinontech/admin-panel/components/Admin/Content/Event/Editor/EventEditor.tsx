"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Award, CalendarDays, Check, ExternalLink, Eye, EyeOff, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { useCurrentSite } from "@/lib/sites";
import type { IEvent } from "../types";
import {
  CATEGORIES,
  EMPTY_FORM,
  slugify,
  toFormState,
  toPayload,
  validate,
  fromTimeInput,
  type EventFormState,
  type SectionId,
  type ValidationIssue,
} from "./eventForm";
import {
  AboutSection,
  AgendaSection,
  AudienceSection,
  BannerSection,
  BasicsSection,
  ExtrasSection,
  FaqSection,
  HostsSection,
  OutcomesSection,
  ScheduleSection,
  type SlugState,
} from "./sections";

const NAV: { id: SectionId; label: string; filled: (f: EventFormState) => boolean }[] = [
  { id: "basics", label: "Basics", filled: (f) => Boolean(f.title && f.slug) },
  { id: "schedule", label: "Schedule & venue", filled: (f) => Boolean(f.startDate) },
  { id: "banner", label: "Banner", filled: (f) => Boolean(f.bannerUrl) },
  { id: "hosts", label: "Hosts", filled: (f) => f.hosts.some((h) => h.name) },
  { id: "about", label: "About", filled: (f) => Boolean(f.about.trim()) },
  { id: "outcomes", label: "Outcomes", filled: (f) => f.outcomes.some(Boolean) },
  { id: "agenda", label: "Agenda", filled: (f) => f.agenda.some((a) => a.title) },
  { id: "audience", label: "Audience & topics", filled: (f) => f.audience.length > 0 || f.topics.length > 0 },
  { id: "faqs", label: "FAQs", filled: (f) => f.faqs.some((q) => q.question) },
  { id: "extras", label: "Feedback & more", filled: () => true },
];

function formatDate(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return "Date to be set";
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** The listing card as visitors will see it, updating as you type. */
function Preview({ form }: { form: EventFormState }) {
  const meta = CATEGORIES[form.category];
  const start = /^(\d{4})-(\d{2})-(\d{2})$/.exec(form.startDate);
  const month = start ? new Date(Number(start[1]), Number(start[2]) - 1, 1).toLocaleDateString("en-US", { month: "short" }).toUpperCase() : "TBA";
  const day = start ? String(Number(start[3])) : "—";
  const hosts = form.hosts.filter((h) => h.name);
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
      <div className="relative aspect-[16/10] bg-gradient-to-tr from-[#021338] via-[#052b82] to-[#0d59eb]">
        {form.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.bannerUrl} alt="" className="absolute inset-0 size-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-900">
          <span className={`size-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
        <span className="absolute top-3 right-3 w-11 rounded-lg overflow-hidden bg-white text-center shadow">
          <span className="block bg-blue-600 text-white text-[9px] font-bold tracking-widest py-0.5">{month}</span>
          <span className="block text-base font-extrabold text-slate-900 leading-6">{day}</span>
        </span>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[12px] font-semibold text-white">
          <MapPin className="size-3.5" />
          {form.locationType === "Online" ? "Online" : form.location.split("·")[0].trim() || "In person"}
        </span>
      </div>
      <div className="p-4">
        <p className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
          {formatDate(form.startDate)}
          {form.startTime ? ` · ${fromTimeInput(form.startTime)}` : ""}
        </p>
        <p className="mt-1.5 text-[15px] font-bold leading-snug">{form.title || "Your event title"}</p>
        <p className="mt-1 text-[12.5px] text-muted-foreground line-clamp-2">{form.summary || "The one-line summary appears here."}</p>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[12px] text-muted-foreground">
          <span>{hosts.length ? hosts.map((h) => h.name).join(", ") : "No host yet"}</span>
          <span className="inline-flex items-center gap-1">
            <Award className="size-3.5" />
            {meta.certificate ? "Certificate" : "Free"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function EventEditor({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { site } = useCurrentSite();
  const isNew = !eventId;
  const listUrl = pathname.replace(/\/(new|edit\/[^/]+|[^/]+)$/, "");

  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);
  const [saved, setSaved] = useState<EventFormState>(EMPTY_FORM);
  const [originalDetails, setOriginalDetails] = useState<unknown>({});
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState<"draft" | "publish" | "save" | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [slugState, setSlugState] = useState<SlugState>("idle");
  const originalSlug = useRef("");

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    apiFetch<{ event?: IEvent } & IEvent>(`/events/${eventId}`)
      .then((res) => {
        if (cancelled) return;
        const event = (res.event ?? res) as IEvent;
        const state = toFormState(event);
        setForm(state);
        setSaved(state);
        setOriginalDetails(event.eventDetails ?? {});
        originalSlug.current = state.slug;
      })
      .catch((err) => !cancelled && setLoadError(err instanceof Error ? err.message : "Could not load the event."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [eventId, isNew]);

  // Leaving with unsaved edits asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // URL availability, debounced. The event's own current URL is always fine.
  useEffect(() => {
    const slug = slugify(form.slug);
    if (!slug || slug === originalSlug.current) {
      setSlugState("idle");
      return;
    }
    setSlugState("checking");
    const handle = window.setTimeout(() => {
      apiFetch<{ available?: boolean }>(`/events/slug-availability?slug=${encodeURIComponent(slug)}`)
        .then((res) => setSlugState(res.available === false ? "taken" : "available"))
        .catch(() => setSlugState("idle"));
    }, 400);
    return () => window.clearTimeout(handle);
  }, [form.slug]);

  const update = useCallback(<K extends keyof EventFormState>(key: K, value: EventFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIssues((prev) => prev.filter((i) => i.field !== key));
  }, []);

  const onTitleChange = (title: string) => {
    setForm((prev) => ({ ...prev, title, slug: slugTouched ? prev.slug : slugify(title) }));
    setIssues((prev) => prev.filter((i) => i.field !== "title" && (slugTouched || i.field !== "slug")));
  };

  const errorFor = (field: keyof EventFormState) => issues.find((i) => i.field === field)?.message;

  const scrollTo = (id: SectionId) =>
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  async function save(mode: "draft" | "publish" | "save") {
    const next: EventFormState = {
      ...form,
      isPublished: mode === "publish" ? true : mode === "draft" ? false : form.isPublished,
    };
    const problems = validate(next);
    if (slugState === "taken") problems.push({ section: "basics", field: "slug", message: "Another event already uses this URL." });
    if (problems.length) {
      setIssues(problems);
      scrollTo(problems[0].section);
      toast.error(problems[0].message);
      return;
    }

    setSaving(mode);
    try {
      const payload = toPayload(next, originalDetails);
      if (isNew) {
        const res = await apiFetch<{ newEvent?: IEvent }>(`/events`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
        setSaved(next);
        toast.success(next.isPublished ? "Event published" : "Draft saved");
        if (res.newEvent?.id) router.replace(`${listUrl}/edit/${res.newEvent.id}`);
        else router.push(listUrl);
      } else {
        await apiFetch(`/events/${eventId}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
        setForm(next);
        setSaved(next);
        setOriginalDetails(payload.eventDetails);
        originalSlug.current = payload.eventSlug;
        toast.success(
          mode === "publish" ? "Event published" : mode === "draft" ? "Unpublished — now a draft" : "Changes saved"
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the event.");
    } finally {
      setSaving(null);
    }
  }

  const siteUrl = (site?.siteUrl || "").replace(/\/$/, "");
  const sitePrefix = `${siteUrl.replace(/^https?:\/\//, "") || "your site"}/events/`;
  const liveUrl = siteUrl && form.slug ? `${siteUrl}/events/${slugify(form.slug)}` : "";

  if (loading) {
    return (
      <div className="grid place-items-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="grid place-items-center min-h-[60vh] text-center gap-3">
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <Button variant="outline" onClick={() => router.push(listUrl)}>Back to events</Button>
      </div>
    );
  }

  const sectionProps = { form, update, errorFor };
  const completion = NAV.filter((n) => n.filled(form)).length;

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-20 glass-header border-b">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3 px-4 sm:px-6 h-16">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.push(listUrl)}>
            <ArrowLeft className="size-4" /> Events
          </Button>
          <div className="min-w-0 flex-1 flex items-center gap-2.5">
            <h1 className="truncate text-[15px] font-semibold">{isNew ? "New event" : form.title || "Untitled event"}</h1>
            {isNew ? null : saved.isPublished ? (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0">Published</Badge>
            ) : (
              <Badge variant="secondary">Draft</Badge>
            )}
            {dirty ? <span className="hidden sm:inline text-[12px] text-muted-foreground">Unsaved changes</span> : null}
          </div>
          {!isNew && saved.isPublished && liveUrl ? (
            <Button variant="ghost" size="sm" className="hidden md:inline-flex gap-1.5" asChild>
              <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                View on site <ExternalLink className="size-3.5" />
              </a>
            </Button>
          ) : null}
          {isNew ? (
            <>
              <Button variant="outline" size="sm" disabled={saving !== null} onClick={() => save("draft")}>
                {saving === "draft" ? <Loader2 className="size-4 animate-spin" /> : null} Save draft
              </Button>
              <Button size="sm" disabled={saving !== null} onClick={() => save("publish")} className="gap-1.5">
                {saving === "publish" ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />} Publish
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" disabled={saving !== null} className="gap-1.5"
                onClick={() => save(saved.isPublished ? "draft" : "publish")}>
                {saving === "draft" || saving === "publish" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : saved.isPublished ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
                {saved.isPublished ? "Unpublish" : "Publish"}
              </Button>
              <Button size="sm" disabled={saving !== null || !dirty} onClick={() => save("save")} className="gap-1.5">
                {saving === "save" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Save changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-[1440px] w-full mx-auto grid lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[200px_minmax(0,1fr)_320px] gap-6 px-4 sm:px-6 py-6">
        <nav aria-label="Editor sections" className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Completeness</p>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${(completion / NAV.length) * 100}%` }} />
              </div>
              <p className="mt-1.5 text-[12px] text-muted-foreground">{completion} of {NAV.length} sections filled</p>
            </div>
            <ul className="space-y-0.5">
              {NAV.map((item) => {
                const hasIssue = issues.some((i) => i.section === item.id);
                return (
                  <li key={item.id}>
                    <button type="button" onClick={() => scrollTo(item.id)}
                      className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
                      <span className={`grid place-items-center size-4 rounded-full border ${
                        hasIssue ? "border-destructive bg-destructive text-white" : item.filled(form) ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}>
                        {hasIssue ? <span className="text-[9px] font-bold">!</span> : item.filled(form) ? <Check className="size-2.5" /> : null}
                      </span>
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="min-w-0 space-y-6">
          <BasicsSection
            {...sectionProps}
            onTitleChange={onTitleChange}
            onSlugChange={(slug) => {
              setSlugTouched(true);
              update("slug", slug);
            }}
            slugState={slugState}
            sitePrefix={sitePrefix}
          />
          <ScheduleSection {...sectionProps} />
          <BannerSection {...sectionProps} />
          <HostsSection {...sectionProps} />
          <AboutSection {...sectionProps} />
          <OutcomesSection {...sectionProps} />
          <AgendaSection {...sectionProps} />
          <AudienceSection {...sectionProps} />
          <FaqSection {...sectionProps} />
          <ExtrasSection {...sectionProps} />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Listing preview</p>
            <Preview form={form} />
            <div className="rounded-xl border border-border p-4 text-[12.5px] text-muted-foreground space-y-2">
              <p className="flex items-center gap-2 text-foreground font-medium">
                <CalendarDays className="size-3.5" /> {formatDate(form.startDate)}
                {form.endDate && form.endDate !== form.startDate ? ` – ${formatDate(form.endDate)}` : ""}
              </p>
              <p>
                {CATEGORIES[form.category].label} ·{" "}
                {CATEGORIES[form.category].certificate ? `${CATEGORIES[form.category].certificate} certificate` : "no certificate"}
              </p>
              <p>Button: “{form.ctaType}” · {form.acceptingRegistrations ? "accepting responses" : "responses closed"}</p>
              {form.category === "InternalCohort" ? <p>Hidden from the public listing; reachable by direct link.</p> : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
