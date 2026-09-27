"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  Loader2,
  Mail,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ManageContext } from "../EventManage";
import { eventsApi, type EnrollmentType, type Guest, type GuestStatus } from "../api";
import { ConfirmDialog, EmptyState, GuestStatusBadge, formatDateTime } from "../ui";

const PAGE = 25;

/** CSV built in the browser; cells starting = + - @ are neutralised for Excel. */
function downloadGuestsCsv(guests: Guest[], slug: string) {
  const cols = ["Name", "Email", "Phone", "Status", "Role", "Company role", "College", "Graduation year", "LinkedIn", "Used referral code", "Own referral code", "Registered at", "Feedback", "Certificate"];
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const rows = guests.map((g) =>
    [
      g.name, g.email, g.phone, g.guestType, g.userType, g.role, g.collegeName, g.graduationYear, g.linkedin,
      g.referralCode, g.ownReferralCode, g.createdAt, g.feedbackSubmittedAt ? "Submitted" : "",
      g.certificateGenerated ? g.certificateId : g.certificateApproved ? "Approved" : "",
    ].map(cell).join(",")
  );
  const blob = new Blob(["﻿" + [cols.map(cell).join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: `${slug}-guests.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-2 text-[13px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}

function prettyKey(key: string) {
  return key.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

/** Side drawer with everything about one guest, and the actions on them. */
function GuestDrawer({ guest, event, onClose, onChanged }: { guest: Guest | null; event: ManageContext["event"]; onClose: () => void; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState("");
  if (!guest) return null;
  const team = ["Hackathon", "Teardown"].includes(event.eventType);
  const run = async (key: string, fn: () => Promise<unknown>, done: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(done);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy("");
    }
  };
  const extra = { ...(guest.additionalData || {}) } as Record<string, unknown>;
  const feedback = Object.entries(guest.feedbackData || {}).filter(([k]) => k !== "isPrimaryMember");

  return (
    <Sheet open={Boolean(guest)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">{guest.name} <GuestStatusBadge status={guest.guestType} /></SheetTitle>
          <SheetDescription>Registered {formatDateTime(guest.createdAt)}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-8 space-y-6">
          <div className="flex flex-wrap gap-2">
            {guest.guestType !== "Approved" ? (
              <Button size="sm" className="gap-1.5" disabled={Boolean(busy)}
                onClick={() => run("approve", () => eventsApi.setStatus(String(event.id), [guest.id], "Approved"), "Approved — confirmation emailed")}>
                {busy === "approve" ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />} Approve
              </Button>
            ) : null}
            {guest.guestType !== "Declined" ? (
              <Button size="sm" variant="outline" className="gap-1.5" disabled={Boolean(busy)}
                onClick={() => run("decline", () => eventsApi.setStatus(String(event.id), [guest.id], "Declined"), "Declined — guest notified")}>
                {busy === "decline" ? <Loader2 className="size-4 animate-spin" /> : <UserX className="size-4" />} Decline
              </Button>
            ) : null}
            {guest.guestType !== "Waitlist" ? (
              <Button size="sm" variant="ghost" disabled={Boolean(busy)}
                onClick={() => run("waitlist", () => eventsApi.setStatus(String(event.id), [guest.id], "Waitlist", false), "Moved back to the waitlist")}>
                Move to waitlist
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-1.5" disabled={Boolean(busy)}>
                  <Mail className="size-4" /> Resend email <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Enrollment email</DropdownMenuLabel>
                {((team ? ["Registered"] : ["Pending", "Approved", "Declined"]) as EnrollmentType[]).map((type) => (
                  <DropdownMenuItem key={type} onClick={() => run(`mail-${type}`, () => eventsApi.notify(String(event.id), [guest.id], type), `${type} email sent`)}>
                    {type}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <section>
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</h4>
            <dl className="mt-1 divide-y divide-border">
              <Detail label="Email" value={guest.email && <a className="text-primary hover:underline" href={`mailto:${guest.email}`}>{guest.email}</a>} />
              <Detail label="Phone" value={guest.phone} />
              <Detail label="LinkedIn" value={guest.linkedin && <a className="inline-flex items-center gap-1 text-primary hover:underline" href={guest.linkedin} target="_blank" rel="noopener noreferrer">Profile <ExternalLink className="size-3" /></a>} />
            </dl>
          </section>

          <section>
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Registration</h4>
            <dl className="mt-1 divide-y divide-border">
              <Detail label="Registered as" value={guest.userType} />
              <Detail label="Role" value={guest.role} />
              <Detail label="College" value={guest.collegeName} />
              <Detail label="Graduation year" value={guest.graduationYear} />
              <Detail label="Referred with" value={guest.referralCode && <span className="font-mono">{guest.referralCode}</span>} />
              <Detail label="Own referral code" value={guest.ownReferralCode && <span className="font-mono">{guest.ownReferralCode}</span>} />
              {Object.entries(extra).map(([k, v]) => <Detail key={k} label={prettyKey(k)} value={typeof v === "object" ? JSON.stringify(v) : String(v)} />)}
            </dl>
          </section>

          <section>
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{team ? "Submission" : "Feedback"}</h4>
            {feedback.length ? (
              <dl className="mt-1 divide-y divide-border">
                {feedback.map(([k, v]) => (
                  <Detail key={k} label={prettyKey(k)} value={typeof v === "string" && /^https?:\/\//.test(v) ? <a className="text-primary hover:underline break-all" href={v} target="_blank" rel="noopener noreferrer">{v}</a> : String(v)} />
                ))}
                <Detail label="Submitted" value={formatDateTime(guest.feedbackSubmittedAt)} />
              </dl>
            ) : (
              <p className="mt-2 text-[13px] text-muted-foreground">Nothing submitted yet.</p>
            )}
          </section>

          <section>
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Certificate</h4>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {guest.certificateGenerated ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-emerald-700 dark:text-emerald-400"><Check className="size-4" /> Issued · <span className="font-mono">{guest.certificateId}</span></span>
                  <Button size="sm" variant="outline" className="gap-1.5" disabled={Boolean(busy)}
                    onClick={() => run("download", async () => window.open(await eventsApi.certificateUrl(guest.id), "_blank"), "Opening certificate")}>
                    <Download className="size-4" /> Download
                  </Button>
                </>
              ) : guest.certificateApproved ? (
                <Button size="sm" className="gap-1.5" disabled={Boolean(busy) || guest.guestType !== "Approved"}
                  onClick={() => run("issue", () => eventsApi.issueCertificate(guest.id), "Certificate issued and emailed")}>
                  {busy === "issue" ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />} Issue certificate
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="gap-1.5" disabled={Boolean(busy) || guest.guestType !== "Approved"}
                  onClick={() => run("certapprove", () => eventsApi.approveCertificate(guest.id), "Certificate approved")}>
                  {busy === "certapprove" ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />} Approve certificate
                </Button>
              )}
              {guest.guestType !== "Approved" ? <span className="text-[12px] text-muted-foreground">Only approved guests receive certificates.</span> : null}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

type BulkKey = "APPROVE_ALL" | "APPROVE_PROFESSIONALS" | "APPROVE_STUDENTS" | "DECLINE_ALL" | "DECLINE_PROFESSIONALS" | "DECLINE_STUDENTS";
const BULK: Record<BulkKey, { status: GuestStatus; role?: string; title: string }> = {
  APPROVE_ALL: { status: "Approved", title: "Approve everyone on the waitlist?" },
  APPROVE_PROFESSIONALS: { status: "Approved", role: "Professional", title: "Approve waitlisted professionals?" },
  APPROVE_STUDENTS: { status: "Approved", role: "Student", title: "Approve waitlisted students?" },
  DECLINE_ALL: { status: "Declined", title: "Decline everyone on the waitlist?" },
  DECLINE_PROFESSIONALS: { status: "Declined", role: "Professional", title: "Decline waitlisted professionals?" },
  DECLINE_STUDENTS: { status: "Declined", role: "Student", title: "Decline waitlisted students?" },
};

export default function GuestsTab({ event, guests, reloadGuests }: ManageContext) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | GuestStatus>("all");
  const [role, setRole] = useState<"all" | "Professional" | "Student">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  // The drawer follows the guest by id, so it re-renders from the freshly loaded list after each action.
  const [openId, setOpenId] = useState<string | null>(null);
  const open = openId ? guests.find((g) => g.id === openId) ?? null : null;
  const [confirm, setConfirm] = useState<{ title: string; ids: string[]; status: GuestStatus } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests
      .filter((g) => (status === "all" || g.guestType === status) && (role === "all" || g.userType === role))
      .filter((g) => !q || [g.name, g.email, g.phone, g.collegeName, g.role].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [guests, query, status, role]);
  const pageRows = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const allOnPage = pageRows.length > 0 && pageRows.every((g) => selected.has(g.id));

  const openBulk = (key: BulkKey) => {
    const spec = BULK[key];
    const ids = guests.filter((g) => g.guestType === "Waitlist" && (!spec.role || g.userType === spec.role)).map((g) => g.id);
    if (!ids.length) {
      toast.info("Nobody on the waitlist matches that.");
      return;
    }
    setConfirm({ title: spec.title, ids, status: spec.status });
  };

  if (!guests.length) {
    return <EmptyState icon={Users} title="No registrations yet" body="Guests appear here as soon as they register on the event page. Share the page to get started." />;
  }

  return (
    <div className="glass-card rounded-2xl">
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search name, email, phone, college…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(0); }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Waitlist">Waitlist</SelectItem>
            <SelectItem value="Declined">Declined</SelectItem>
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={(v) => { setRole(v as typeof role); setPage(0); }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="Professional">Professionals</SelectItem>
            <SelectItem value="Student">Students</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-1.5">Waitlist actions <ChevronDown className="size-3.5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Approve waitlisted</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openBulk("APPROVE_ALL")}>Everyone</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openBulk("APPROVE_PROFESSIONALS")}>Professionals</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openBulk("APPROVE_STUDENTS")}>Students</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Decline waitlisted</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openBulk("DECLINE_ALL")}>Everyone</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openBulk("DECLINE_PROFESSIONALS")}>Professionals</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openBulk("DECLINE_STUDENTS")}>Students</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" className="gap-1.5" onClick={() => downloadGuestsCsv(filtered, event.eventSlug)}>
          <Download className="size-4" /> Export
        </Button>
      </div>

      {selected.size ? (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-primary/5 border-b border-border text-[13px]">
          <span className="font-medium">{selected.size} selected</span>
          <Button size="sm" className="gap-1.5 ml-2" onClick={() => setConfirm({ title: `Approve ${selected.size} guest(s)?`, ids: [...selected], status: "Approved" })}>
            <UserCheck className="size-4" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setConfirm({ title: `Decline ${selected.size} guest(s)?`, ids: [...selected], status: "Declined" })}>
            <UserX className="size-4" /> Decline
          </Button>
          <Button size="sm" variant="ghost" className="gap-1" onClick={() => setSelected(new Set())}><X className="size-3.5" /> Clear</Button>
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input type="checkbox" aria-label="Select page" checked={allOnPage}
                onChange={(e) => setSelected((prev) => { const next = new Set(prev); pageRows.forEach((g) => (e.target.checked ? next.add(g.id) : next.delete(g.id))); return next; })} />
            </TableHead>
            <TableHead>Guest</TableHead>
            <TableHead className="hidden md:table-cell">Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Referred with</TableHead>
            <TableHead className="hidden lg:table-cell">Registered</TableHead>
            <TableHead className="hidden sm:table-cell text-right">Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((g) => (
            <TableRow key={g.id} className="cursor-pointer" onClick={() => setOpenId(g.id)}>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" aria-label={`Select ${g.name}`} checked={selected.has(g.id)}
                  onChange={(e) => setSelected((prev) => { const next = new Set(prev); if (e.target.checked) next.add(g.id); else next.delete(g.id); return next; })} />
              </TableCell>
              <TableCell>
                <p className="font-medium">{g.name}</p>
                <p className="text-[12.5px] text-muted-foreground">{g.email}</p>
              </TableCell>
              <TableCell className="hidden md:table-cell text-[13px]">{g.userType || "—"}</TableCell>
              <TableCell><GuestStatusBadge status={g.guestType} /></TableCell>
              <TableCell className="hidden lg:table-cell font-mono text-[12px]">{g.referralCode || "—"}</TableCell>
              <TableCell className="hidden lg:table-cell text-[12.5px] text-muted-foreground">{formatDateTime(g.createdAt)}</TableCell>
              <TableCell className="hidden sm:table-cell text-right text-[12px] text-muted-foreground">
                {[g.feedbackSubmittedAt ? "Feedback" : null, g.certificateGenerated ? "Certificate" : g.certificateApproved ? "Cert. approved" : null].filter(Boolean).join(" · ") || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!pageRows.length ? <p className="p-8 text-center text-[13px] text-muted-foreground">No guests match these filters.</p> : null}

      <div className="flex items-center justify-between px-4 py-3 border-t border-border text-[12.5px] text-muted-foreground">
        <span>{filtered.length} guest(s)</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <span>Page {page + 1} of {pages}</span>
          <Button size="sm" variant="ghost" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>

      <GuestDrawer guest={open} event={event} onClose={() => setOpenId(null)} onChanged={reloadGuests} />
      {confirm ? (
        <ConfirmDialog
          open
          onOpenChange={(v) => !v && setConfirm(null)}
          title={confirm.title}
          description={
            <>
              {`${confirm.ids.length} guest${confirm.ids.length === 1 ? "" : "s"} will be marked `}
              <strong>{confirm.status}</strong>
              {` and sent the ${confirm.status} enrollment email, if you've set one up.`}
            </>
          }
          confirmLabel={confirm.status === "Approved" ? "Approve" : "Decline"}
          destructive={confirm.status === "Declined"}
          onConfirm={async () => {
            const res = await eventsApi.setStatus(String(event.id), confirm.ids, confirm.status);
            toast.success(`${res.updated} guest(s) ${confirm.status.toLowerCase()} · ${res.emailed} email(s) sent`);
            setSelected(new Set());
            await reloadGuests();
          }}
        />
      ) : null}
    </div>
  );
}
