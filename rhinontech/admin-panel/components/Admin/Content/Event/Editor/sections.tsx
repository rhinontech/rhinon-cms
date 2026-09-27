"use client";

import {
  Award,
  CalendarClock,
  CheckCircle2,
  FileText,
  HelpCircle,
  ImageIcon,
  ListOrdered,
  Plus,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CATEGORIES,
  type EventCategory,
  type EventFormState,
  type EventType,
  type LocationType,
  type ValidationIssue,
} from "./eventForm";
import { ChipsField, Field, ImageField, RowControls, SectionCard, StringListField, move } from "./fields";

export interface SectionProps {
  form: EventFormState;
  update: <K extends keyof EventFormState>(key: K, value: EventFormState[K]) => void;
  errorFor: (field: keyof EventFormState) => string | undefined;
}

export type SlugState = "idle" | "checking" | "available" | "taken";

export function BasicsSection({
  form,
  update,
  errorFor,
  onTitleChange,
  onSlugChange,
  slugState,
  sitePrefix,
}: SectionProps & {
  onTitleChange: (title: string) => void;
  onSlugChange: (slug: string) => void;
  slugState: SlugState;
  sitePrefix: string;
}) {
  const forced = CATEGORIES[form.category].forcesType;
  return (
    <SectionCard id="basics" icon={Sparkles} title="Basics" hint="The title, the one-line summary under it, and what kind of event this is.">
      <Field label="Title" htmlFor="ev-title" required error={errorFor("title")}>
        <Input id="ev-title" value={form.title} onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Prompt Engineering for Educators" className="text-[15px] h-11" />
      </Field>
      <Field label="Summary" htmlFor="ev-summary" hint="Shown under the title on the event page and on its card in the listing.">
        <Textarea id="ev-summary" rows={2} value={form.summary} onChange={(e) => update("summary", e.target.value)}
          placeholder="A hands-on session on writing prompts that hold up across a whole class." />
      </Field>
      <Field
        label="Page URL"
        htmlFor="ev-slug"
        required
        error={errorFor("slug") ?? (slugState === "taken" ? "Another event already uses this URL." : undefined)}
        hint={
          slugState === "checking" ? "Checking…" : slugState === "available" ? <span className="text-emerald-600 dark:text-emerald-400">Available</span> : undefined
        }
      >
        <div className="flex items-stretch rounded-md border border-input dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] overflow-hidden">
          <span className="hidden sm:flex items-center px-3 text-[13px] text-muted-foreground bg-muted/50 border-r border-input whitespace-nowrap">
            {sitePrefix}
          </span>
          <input id="ev-slug" value={form.slug} onChange={(e) => onSlugChange(e.target.value)}
            className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm outline-none" placeholder="prompt-engineering-for-educators" />
        </div>
      </Field>

      <div className="space-y-2">
        <p className="text-[13px] font-medium">Category</p>
        <div className="grid sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Category">
          {(Object.keys(CATEGORIES) as EventCategory[]).map((key) => {
            const meta = CATEGORIES[key];
            const active = form.category === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  update("category", key);
                  if (meta.forcesType) update("type", meta.forcesType);
                }}
                className={`text-left rounded-xl border p-3.5 transition-all ${
                  active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-foreground/25 hover:bg-muted/40"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[13.5px] font-semibold">
                    <span className={`size-2 rounded-full ${meta.dot}`} aria-hidden />
                    {meta.label}
                  </span>
                  {active ? <CheckCircle2 className="size-4 text-primary" aria-hidden /> : null}
                </span>
                <span className="mt-1 block text-[12.5px] text-muted-foreground leading-snug">{meta.blurb}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground">
                  <Award className="size-3" aria-hidden />
                  {meta.certificate ? `${meta.certificate} certificate` : "No certificate"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Format" hint={forced ? `${CATEGORIES[form.category].label} events are always a ${forced}.` : "Changes the badge on the page; Hackathon suits build days."}>
          <Select value={form.type} onValueChange={(v) => update("type", v as EventType)} disabled={Boolean(forced)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Workshop">Workshop</SelectItem>
              <SelectItem value="Hackathon">Hackathon</SelectItem>
              <SelectItem value="Teardown">Teardown</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Button label" hint="The call to action on the page.">
          <Select value={form.ctaType} onValueChange={(v) => update("ctaType", v as EventFormState["ctaType"])}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Register Now">Register Now</SelectItem>
              <SelectItem value="Join Waitlist">Join Waitlist</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </SectionCard>
  );
}

export function ScheduleSection({ form, update, errorFor }: SectionProps) {
  return (
    <SectionCard id="schedule" icon={CalendarClock} title="Schedule & venue" hint="Times are in IST and apply to every session of a multi-day event.">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Start date" htmlFor="ev-start" required error={errorFor("startDate")}>
          <Input id="ev-start" type="date" value={form.startDate} onChange={(e) => {
            update("startDate", e.target.value);
            if (!form.endDate || form.endDate < e.target.value) update("endDate", e.target.value);
          }} />
        </Field>
        <Field label="End date" htmlFor="ev-end" error={errorFor("endDate")} hint="Same as the start date for a single session.">
          <Input id="ev-end" type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => update("endDate", e.target.value)} />
        </Field>
        <Field label="Starts at" htmlFor="ev-st">
          <Input id="ev-st" type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} />
        </Field>
        <Field label="Ends at" htmlFor="ev-et" error={errorFor("endTime")}>
          <Input id="ev-et" type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} />
        </Field>
      </div>
      <div className="grid sm:grid-cols-[180px_1fr] gap-4">
        <Field label="Where">
          <Select value={form.locationType} onValueChange={(v) => {
            const next = v as LocationType;
            update("locationType", next);
            if (!form.location || form.location === "Online · Zoom" || form.location === "Bengaluru · UpperCurve Campus") {
              update("location", next === "Online" ? "Online · Zoom" : "Bengaluru · UpperCurve Campus");
            }
          }}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Online">Online</SelectItem>
              <SelectItem value="Offline">In person</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Venue or platform" htmlFor="ev-loc" hint="Shown publicly. Send private joining links by email, not here.">
          <Input id="ev-loc" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Online · Zoom" />
        </Field>
      </div>
      <Field label="Attendees shown" htmlFor="ev-cap" hint="Social proof on the page — “300+ attending”. You set it; registrations don't change it. 0 hides it.">
        <Input id="ev-cap" type="number" min={0} value={form.capacity} onChange={(e) => update("capacity", Number(e.target.value))} className="max-w-[180px]" />
      </Field>
    </SectionCard>
  );
}

export function BannerSection({ form, update }: SectionProps) {
  return (
    <SectionCard id="banner" icon={ImageIcon} title="Banner" hint="The hero image on the event page and the photo on its listing card.">
      <ImageField value={form.bannerUrl} onChange={(url) => update("bannerUrl", url)} label="banner" />
    </SectionCard>
  );
}

export function HostsSection({ form, update }: SectionProps) {
  const set = (index: number, patch: Partial<EventFormState["hosts"][number]>) =>
    update("hosts", form.hosts.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  return (
    <SectionCard
      id="hosts"
      icon={Users}
      title="Hosts"
      hint="The first host signs the certificate and appears on the listing card."
      action={
        <Button type="button" size="sm" variant="outline" className="gap-1.5"
          onClick={() => update("hosts", [...form.hosts, { name: "", designation: "", company: "", photoUrl: "" }])}>
          <Plus className="size-3.5" /> Add host
        </Button>
      }
    >
      {form.hosts.length === 0 ? (
        <p className="text-[13px] text-muted-foreground rounded-xl border border-dashed border-border px-4 py-6 text-center">
          No hosts yet. Events with a named host get noticeably more registrations.
        </p>
      ) : null}
      {form.hosts.map((host, index) => (
        <div key={index} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
              Host {index + 1}{index === 0 ? " · signs the certificate" : ""}
            </span>
            <RowControls index={index} count={form.hosts.length} label="host"
              onMove={(f, t) => update("hosts", move(form.hosts, f, t))}
              onRemove={(i) => update("hosts", form.hosts.filter((_, n) => n !== i))} />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Input value={host.name} onChange={(e) => set(index, { name: e.target.value })} placeholder="Name" />
            <Input value={host.designation} onChange={(e) => set(index, { designation: e.target.value })} placeholder="Role, e.g. Lead Instructor" />
            <Input value={host.company} onChange={(e) => set(index, { company: e.target.value })} placeholder="Company" />
          </div>
          <ImageField compact value={host.photoUrl} onChange={(url) => set(index, { photoUrl: url })} label={`photo for ${host.name || "host"}`} />
        </div>
      ))}
    </SectionCard>
  );
}

export function AboutSection({ form, update }: SectionProps) {
  const paragraphs = form.about.split(/\n\s*\n/).filter((p) => p.trim()).length;
  return (
    <SectionCard id="about" icon={FileText} title="About" hint='"What this session is about". The first paragraph is shown larger, as the lead.'>
      <Textarea rows={7} value={form.about} onChange={(e) => update("about", e.target.value)}
        placeholder={"Open with who it's for and what changes for them.\n\nThen, in a second paragraph, how the session runs."}
        className="leading-relaxed" />
      <p className="text-[12px] text-muted-foreground">
        Leave a blank line between paragraphs · {paragraphs} {paragraphs === 1 ? "paragraph" : "paragraphs"}
      </p>
    </SectionCard>
  );
}

export function OutcomesSection({ form, update }: SectionProps) {
  return (
    <SectionCard id="outcomes" icon={Target} title="Outcomes" hint="What people walk away with — shown as a grid of cards. Three or four reads best.">
      <StringListField values={form.outcomes} onChange={(v) => update("outcomes", v)}
        placeholder="Three working prompt templates you can use on Monday" addLabel="Add outcome" itemLabel="outcome" />
    </SectionCard>
  );
}

export function AgendaSection({ form, update }: SectionProps) {
  const set = (index: number, patch: Partial<EventFormState["agenda"][number]>) =>
    update("agenda", form.agenda.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  return (
    <SectionCard id="agenda" icon={ListOrdered} title="Agenda" hint='A time or a marker ("Day 1", "Evening 2") and what happens then. Shown as a timeline.'>
      <div className="space-y-2">
        {form.agenda.map((slot, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input value={slot.label} onChange={(e) => set(index, { label: e.target.value })} placeholder="7:00 PM" className="w-[140px] shrink-0" />
            <Input value={slot.title} onChange={(e) => set(index, { title: e.target.value })} placeholder="What happens in this block" />
            <RowControls index={index} count={form.agenda.length} label="agenda item"
              onMove={(f, t) => update("agenda", move(form.agenda, f, t))}
              onRemove={(i) => update("agenda", form.agenda.filter((_, n) => n !== i))} />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="gap-1.5"
          onClick={() => update("agenda", [...form.agenda, { label: "", title: "" }])}>
          <Plus className="size-3.5" /> Add agenda item
        </Button>
      </div>
    </SectionCard>
  );
}

export function AudienceSection({ form, update }: SectionProps) {
  return (
    <SectionCard id="audience" icon={Users} title="Audience & topics" hint="Who it's for is shown as “Built for”; topics appear as tags.">
      <Field label="Built for" hint="Press Enter after each one.">
        <ChipsField values={form.audience} onChange={(v) => update("audience", v)} placeholder="Teachers new to AI tools" />
      </Field>
      <Field label="Topics">
        <ChipsField values={form.topics} onChange={(v) => update("topics", v)} placeholder="prompting, assessment…" />
      </Field>
    </SectionCard>
  );
}

export function FaqSection({ form, update }: SectionProps) {
  const set = (index: number, patch: Partial<EventFormState["faqs"][number]>) =>
    update("faqs", form.faqs.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  return (
    <SectionCard id="faqs" icon={HelpCircle} title="FAQs"
      hint={`Leave empty to use the standard ${CATEGORIES[form.category].label} FAQs.`}>
      {form.faqs.map((faq, index) => (
        <div key={index} className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
          <div className="flex items-start gap-2">
            <Input value={faq.question} onChange={(e) => set(index, { question: e.target.value })} placeholder="Question" className="font-medium" />
            <RowControls index={index} count={form.faqs.length} label="question"
              onMove={(f, t) => update("faqs", move(form.faqs, f, t))}
              onRemove={(i) => update("faqs", form.faqs.filter((_, n) => n !== i))} />
          </div>
          <Textarea rows={2} value={faq.answer} onChange={(e) => set(index, { answer: e.target.value })} placeholder="Answer" />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-1.5"
        onClick={() => update("faqs", [...form.faqs, { question: "", answer: "" }])}>
        <Plus className="size-3.5" /> Add question
      </Button>
    </SectionCard>
  );
}

export function ExtrasSection({ form, update }: SectionProps) {
  const certificate = CATEGORIES[form.category].certificate;
  return (
    <SectionCard id="extras" icon={Award} title="Feedback, certificate & community">
      <div className="flex items-start justify-between gap-6 rounded-xl border border-border p-4">
        <div>
          <p className="text-[14px] font-medium">Accept {form.type === "Workshop" ? "feedback" : "submissions"}</p>
          <p className="text-[12.5px] text-muted-foreground">
            Approved guests can respond from their personal link while this is on. Registration stays open either way — it closes once the event has ended.
          </p>
        </div>
        <Switch checked={form.acceptingRegistrations} onCheckedChange={(v) => update("acceptingRegistrations", v)} aria-label="Accept responses" />
      </div>
      {certificate ? (
        <Field label={`Certificate image (${certificate.toLowerCase()})`}
          hint="Optional. Leave empty and the page draws an UpperCurve certificate with this event's title, date and first host.">
          <ImageField value={form.certificateUrl} onChange={(url) => update("certificateUrl", url)} aspect="aspect-[1.414/1]" label="certificate" />
        </Field>
      ) : (
        <p className="text-[13px] text-muted-foreground">{CATEGORIES[form.category].label} events don&apos;t award a certificate.</p>
      )}
      <Field label="Community WhatsApp link" htmlFor="ev-wa" hint="Shown on community events as “Join the community group”.">
        <Input id="ev-wa" value={form.whatsappLink} onChange={(e) => update("whatsappLink", e.target.value)} placeholder="https://chat.whatsapp.com/…" />
      </Field>
    </SectionCard>
  );
}

export type { ValidationIssue };
