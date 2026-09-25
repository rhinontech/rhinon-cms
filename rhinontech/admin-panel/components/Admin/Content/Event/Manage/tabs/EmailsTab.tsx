"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarPlus,
  Copy,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
  Undo2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmailBodyEditor } from "@/components/Admin/Outreach/shared/EmailBodyEditor";
import type { ManageContext } from "../EventManage";
import {
  eventsApi,
  type EnrollmentTemplate,
  type EnrollmentType,
  type ReminderTemplate,
  type TargetRole,
  type TargetType,
} from "../api";
import { ConfirmDialog, EmptyState, PlaceholderHelp, ReminderStatusBadge, TestEmailDialog, formatDateTime } from "../ui";
import { toTimeInput } from "../../Editor/eventForm";

/* ======================================================= enrollment ==== */

const ENROLLMENT_INFO: Record<EnrollmentType, { title: string; when: string; invite: boolean }> = {
  Pending: { title: "Waitlist confirmation", when: "Sent when someone registers and joins the waitlist.", invite: false },
  Approved: { title: "Approval", when: "Sent when you approve a guest. Includes a calendar invite.", invite: true },
  Declined: { title: "Decline", when: "Sent when you decline a guest.", invite: false },
  Registered: { title: "Registration confirmed", when: "Sent on sign-up — Teardowns and Hackathons approve instantly. Includes a calendar invite.", invite: true },
  Registered_Student: { title: "Registration · Students", when: "Used instead of “Registration confirmed” for students, if set.", invite: true },
  Registered_Professional: { title: "Registration · Professionals", when: "Used instead of “Registration confirmed” for professionals, if set.", invite: true },
};

function EnrollmentEditor({
  event,
  type,
  existing,
  onClose,
  onSaved,
}: {
  event: ManageContext["event"];
  type: EnrollmentType;
  existing?: EnrollmentTemplate;
  onClose: () => void;
  onSaved: () => void;
}) {
  const info = ENROLLMENT_INFO[type];
  const [subject, setSubject] = useState(existing?.subject ?? (type === "Approved" || type.startsWith("Registered") ? `You're in: {{eventTitle}}` : type === "Pending" ? `You're on the waitlist for {{eventTitle}}` : `About your registration for {{eventTitle}}`));
  const [body, setBody] = useState(existing?.body ?? "");
  const [date, setDate] = useState(existing?.date ?? event.eventStartDate?.slice(0, 10) ?? "");
  const [start, setStart] = useState(existing?.startTime ?? toTimeInput(event.eventStartTime));
  const [end, setEnd] = useState(existing?.endTime ?? toTimeInput(event.eventEndTime));
  const [busy, setBusy] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async () => {
    if (!body.replace(/<[^>]*>/g, "").trim()) {
      toast.error("Write the email body first");
      return false;
    }
    setBusy(true);
    try {
      await eventsApi.saveEnrollment(String(event.id), type, { subject, body, ...(info.invite ? { date, startTime: start, endTime: end } : {}) });
      toast.success(`${info.title} email saved`);
      onSaved();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{info.title} email</SheetTitle>
          <SheetDescription>{info.when}</SheetDescription>
        </SheetHeader>
        <div className="px-4 space-y-5 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="en-subject">Subject</Label>
            <Input id="en-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          {info.invite ? (
            <div className="rounded-xl border border-border p-4 space-y-3">
              <p className="flex items-center gap-2 text-[13px] font-medium"><CalendarPlus className="size-4" /> Calendar invite</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="en-date">Date</Label>
                  <Input id="en-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="en-start">Starts (IST)</Label>
                  <Input id="en-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="en-end">Ends (IST)</Label>
                  <Input id="en-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground">Guests get an “Add to calendar” invite for this session. Leave the date empty to send without one.</p>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label>Body</Label>
            <EmailBodyEditor value={body} onChange={setBody} placeholder={"Hi {{name}},\n\n…"} minHeight="260px" />
          </div>
          <PlaceholderHelp />
        </div>
        <SheetFooter className="flex-row flex-wrap justify-between gap-2 border-t border-border">
          <div className="flex gap-2">
            {existing ? (
              <Button variant="ghost" className="gap-1.5 text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" /> Stop sending
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1.5" disabled={busy} onClick={async () => { if (await save()) setTestOpen(true); }}>
              <Send className="size-4" /> Save & test
            </Button>
            <Button disabled={busy} onClick={async () => { if (await save()) onClose(); }} className="gap-1.5">
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Save
            </Button>
          </div>
        </SheetFooter>
        <TestEmailDialog open={testOpen} onOpenChange={setTestOpen} title={`Test the ${info.title.toLowerCase()} email`}
          onSend={(email) => eventsApi.testEnrollment(String(event.id), type, email)} />
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          destructive
          title={`Stop sending the ${info.title.toLowerCase()} email?`}
          description="The template is removed. Guests reaching this status afterwards won't get an email."
          confirmLabel="Remove email"
          onConfirm={async () => {
            await eventsApi.deleteEnrollment(String(event.id), type);
            toast.success("Removed");
            onSaved();
            onClose();
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

function EnrollmentSection({ event }: ManageContext) {
  const [templates, setTemplates] = useState<EnrollmentTemplate[] | null>(null);
  const [editing, setEditing] = useState<EnrollmentType | null>(null);
  const load = useCallback(() => eventsApi.enrollment(String(event.id)).then(setTemplates).catch(() => setTemplates([])), [event.id]);
  useEffect(() => { load(); }, [load]);

  const team = ["Hackathon", "Teardown"].includes(event.eventType);
  const types: EnrollmentType[] = team ? ["Registered", "Registered_Student", "Registered_Professional"] : ["Pending", "Approved", "Declined"];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[15px] font-semibold">Enrollment emails</h3>
        <p className="text-[13px] text-muted-foreground">
          Sent automatically as each guest&apos;s status changes. {team ? "Teardown and Hackathon sign-ups are approved on registration." : "Registrations join the waitlist until you approve them."}
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {types.map((type) => {
          const info = ENROLLMENT_INFO[type];
          const t = templates?.find((x) => x.type === type);
          return (
            <button key={type} type="button" onClick={() => setEditing(type)}
              className="group text-left glass-card rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="grid place-items-center size-9 rounded-xl bg-primary/10 text-primary"><Mail className="size-4" /></span>
                <span className={`text-[11.5px] font-semibold ${t ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                  {templates === null ? "…" : t ? "Active" : "Not set up"}
                </span>
              </div>
              <p className="mt-4 text-[14px] font-semibold">{info.title}</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground leading-relaxed">{info.when}</p>
              <p className="mt-3 truncate text-[12.5px] italic text-muted-foreground">{t?.subject || "No subject yet"}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-primary">
                <Pencil className="size-3.5" /> {t ? "Edit" : "Set up"}
              </span>
            </button>
          );
        })}
      </div>
      {editing ? (
        <EnrollmentEditor event={event} type={editing} existing={templates?.find((t) => t.type === editing)} onClose={() => setEditing(null)} onSaved={load} />
      ) : null}
    </div>
  );
}

/* ======================================================== reminders ==== */

type Breakdown = { guestType: string; userType: string | null; count: string | number }[];
function audienceSize(breakdown: Breakdown, type: TargetType, role: TargetRole) {
  return breakdown
    .filter((b) => (type === "All" || b.guestType === type) && (role === "All" || b.userType === role))
    .reduce((sum, b) => sum + Number(b.count), 0);
}

const AUDIENCE_LABEL: Record<TargetType, string> = { All: "Everyone registered", Approved: "Approved guests", Waitlist: "Waitlisted guests", Declined: "Declined guests" };

function toLocalInput(value: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function ReminderEditor({
  event,
  template,
  breakdown,
  onClose,
  onSaved,
}: {
  event: ManageContext["event"];
  template: Partial<ReminderTemplate> | null;
  breakdown: Breakdown;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(template?.templateName ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [type, setType] = useState<TargetType>(template?.targetGuestType ?? "Approved");
  const [role, setRole] = useState<TargetRole>(template?.targetGuestRole ?? "All");
  const [busy, setBusy] = useState(false);
  const recipients = audienceSize(breakdown, type, role);

  const save = async () => {
    if (!name.trim() || !subject.trim() || !body.replace(/<[^>]*>/g, "").trim()) {
      toast.error("Give it a name, a subject and a body");
      return;
    }
    setBusy(true);
    try {
      const payload = { templateName: name, subject, body, targetGuestType: type, targetGuestRole: role };
      if (template?.id) await eventsApi.updateReminder(template.id, payload);
      else await eventsApi.createReminder(String(event.id), payload);
      toast.success(template?.id ? "Email updated" : "Draft saved — schedule it or send it from the list");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{template?.id ? "Edit email" : "New email"}</SheetTitle>
          <SheetDescription>Reminders and announcements for this event&apos;s guests. Save as a draft, then schedule it or send it now.</SheetDescription>
        </SheetHeader>
        <div className="px-4 space-y-5 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="rm-name">Name (internal)</Label>
            <Input id="rm-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 24h before reminder" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Send to</Label>
              <Select value={type} onValueChange={(v) => setType(v as TargetType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(AUDIENCE_LABEL) as TargetType[]).map((t) => <SelectItem key={t} value={t}>{AUDIENCE_LABEL[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as TargetRole)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Everyone</SelectItem>
                  <SelectItem value="Professional">Professionals only</SelectItem>
                  <SelectItem value="Student">Students only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-[13px]">
            <Users className="size-4 text-muted-foreground" />
            Right now this reaches <span className="font-semibold">{recipients}</span> guest{recipients === 1 ? "" : "s"}.
            <span className="text-muted-foreground">It&apos;s worked out again at send time.</span>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="rm-subject">Subject</Label>
            <Input id="rm-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="The event is starting soon!" />
          </div>
          <div className="space-y-1.5">
            <Label>Body</Label>
            <EmailBodyEditor value={body} onChange={setBody} placeholder={"Hi {{name}},\n\n…"} minHeight="280px" />
          </div>
          <PlaceholderHelp />
        </div>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={busy} onClick={save} className="gap-1.5">{busy ? <Loader2 className="size-4 animate-spin" /> : null} Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ScheduleDialog({ template, recipients, onClose, onDone }: { template: ReminderTemplate; recipients: number; onClose: () => void; onDone: () => void }) {
  const initial = template.scheduledAt ? new Date(template.scheduledAt) : new Date(Date.now() + 60 * 60 * 1000);
  const [when, setWhen] = useState(toLocalInput(initial));
  const [busy, setBusy] = useState(false);
  const valid = new Date(when).getTime() > Date.now();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule “{template.templateName}”</DialogTitle>
          <DialogDescription>Goes to {recipients} guest{recipients === 1 ? "" : "s"} matching its audience at that moment. Times are your local time.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="sched">Send at</Label>
          <Input id="sched" type="datetime-local" value={when} min={toLocalInput(new Date())} onChange={(e) => setWhen(e.target.value)} />
          {!valid ? <p className="text-[12px] text-destructive">Pick a time in the future.</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid || busy} className="gap-1.5" onClick={async () => {
            setBusy(true);
            try {
              await eventsApi.scheduleReminder(template.id, new Date(when).toISOString());
              toast.success(`Scheduled for ${formatDateTime(new Date(when).toISOString())}`);
              onDone();
              onClose();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not schedule");
            } finally {
              setBusy(false);
            }
          }}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />} Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemindersSection({ event }: ManageContext) {
  const [templates, setTemplates] = useState<ReminderTemplate[] | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown>([]);
  const [editing, setEditing] = useState<Partial<ReminderTemplate> | null>(null);
  const [scheduling, setScheduling] = useState<ReminderTemplate | null>(null);
  const [testing, setTesting] = useState<ReminderTemplate | null>(null);
  const [sending, setSending] = useState<ReminderTemplate | null>(null);
  const [deleting, setDeleting] = useState<ReminderTemplate | null>(null);

  const load = useCallback(() => {
    const id = String(event.id);
    eventsApi.reminders(id).then(setTemplates).catch(() => setTemplates([]));
    eventsApi.audience(id).then(setBreakdown).catch(() => setBreakdown([]));
  }, [event.id]);
  useEffect(() => { load(); }, [load]);

  // Scheduled sends change status on the server's clock; refresh while any are pending.
  useEffect(() => {
    if (!templates?.some((t) => t.status === "scheduled" || t.status === "sending")) return;
    const id = window.setInterval(load, 30_000);
    return () => window.clearInterval(id);
  }, [templates, load]);

  const size = (t: ReminderTemplate) => audienceSize(breakdown, t.targetGuestType, t.targetGuestRole);
  const sorted = useMemo(() => [...(templates ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [templates]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold">Reminders & announcements</h3>
          <p className="text-[13px] text-muted-foreground">Write once, target by status and role, then schedule or send now. Nobody receives the same email twice.</p>
        </div>
        <Button className="gap-1.5" onClick={() => setEditing({})}><Plus className="size-4" /> New email</Button>
      </div>

      {templates === null ? (
        <div className="grid place-items-center py-12 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
      ) : !sorted.length ? (
        <EmptyState icon={Mail} title="No emails yet" body="A reminder the day before and a follow-up with the recording are the usual two." action={<Button className="gap-1.5" onClick={() => setEditing({})}><Plus className="size-4" /> New email</Button>} />
      ) : (
        <div className="glass-card rounded-2xl divide-y divide-border">
          {sorted.map((t) => {
            const locked = t.status === "sent" || t.status === "sending";
            return (
              <div key={t.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{t.templateName}</p>
                    <ReminderStatusBadge status={t.status} />
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{t.subject}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {AUDIENCE_LABEL[t.targetGuestType]}{t.targetGuestRole !== "All" ? ` · ${t.targetGuestRole}s` : ""}
                    {" · "}
                    {t.status === "sent"
                      ? `Sent ${formatDateTime(t.sentAt)} to ${t.deliveredTo?.length ?? 0}`
                      : t.status === "scheduled"
                        ? `Sends ${formatDateTime(t.scheduledAt)} · ${size(t)} recipient(s) now`
                        : `${size(t)} recipient(s) now`}
                    {t.lastError ? <span className="text-destructive"> · {t.lastError}</span> : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {t.status === "scheduled" ? (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={async () => {
                      try { await eventsApi.cancelReminder(t.id); toast.success("Schedule cancelled — back to draft"); load(); } catch (err) { toast.error(err instanceof Error ? err.message : "Could not cancel"); }
                    }}>
                      <Undo2 className="size-3.5" /> Cancel schedule
                    </Button>
                  ) : !locked ? (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setScheduling(t)}>
                      <CalendarClock className="size-3.5" /> Schedule
                    </Button>
                  ) : null}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="size-8" aria-label="Email actions"><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!locked ? <DropdownMenuItem onClick={() => setEditing(t)}><Pencil className="size-4" /> Edit</DropdownMenuItem> : null}
                      <DropdownMenuItem onClick={() => setTesting(t)}><Send className="size-4" /> Send a test</DropdownMenuItem>
                      {!locked ? <DropdownMenuItem onClick={() => setSending(t)}><Mail className="size-4" /> Send now</DropdownMenuItem> : null}
                      <DropdownMenuItem onClick={() => setEditing({ templateName: `${t.templateName} (copy)`, subject: t.subject, body: t.body, targetGuestType: t.targetGuestType, targetGuestRole: t.targetGuestRole })}>
                        <Copy className="size-4" /> Duplicate
                      </DropdownMenuItem>
                      {t.status !== "sending" ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(t)}><Trash2 className="size-4" /> Delete</DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing ? <ReminderEditor event={event} template={editing} breakdown={breakdown} onClose={() => setEditing(null)} onSaved={load} /> : null}
      {scheduling ? <ScheduleDialog template={scheduling} recipients={size(scheduling)} onClose={() => setScheduling(null)} onDone={load} /> : null}
      <TestEmailDialog open={Boolean(testing)} onOpenChange={(o) => !o && setTesting(null)} title={`Test “${testing?.templateName ?? ""}”`}
        onSend={(email) => eventsApi.testReminder(testing!.id, email)} />
      {sending ? (
        <ConfirmDialog open onOpenChange={(o) => !o && setSending(null)} title={`Send “${sending.templateName}” now?`}
          description={<>It goes to <strong>{size(sending)}</strong> guest(s) — {AUDIENCE_LABEL[sending.targetGuestType].toLowerCase()}{sending.targetGuestRole !== "All" ? `, ${sending.targetGuestRole.toLowerCase()}s only` : ""}. Any schedule is replaced.</>}
          confirmLabel="Send now"
          onConfirm={async () => {
            const res = await eventsApi.sendReminderNow(sending.id);
            toast.success(`Sent to ${res.sent} guest(s)${res.failedEmails.length ? ` · ${res.failedEmails.length} failed` : ""}`);
            load();
          }} />
      ) : null}
      {deleting ? (
        <ConfirmDialog open onOpenChange={(o) => !o && setDeleting(null)} destructive title="Delete this email?"
          description={deleting.status === "scheduled" ? "It is scheduled — deleting it also cancels the send." : "This can't be undone."}
          confirmLabel="Delete" onConfirm={async () => { await eventsApi.deleteReminder(deleting.id); toast.success("Deleted"); load(); }} />
      ) : null}
    </div>
  );
}

export default function EmailsTab(ctx: ManageContext) {
  return (
    <div className="space-y-10">
      <EnrollmentSection {...ctx} />
      <RemindersSection {...ctx} />
    </div>
  );
}
