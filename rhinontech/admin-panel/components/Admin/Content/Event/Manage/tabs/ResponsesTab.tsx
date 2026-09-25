"use client";

import { useMemo, useState } from "react";
import { Award, Check, Download, ExternalLink, Loader2, MessageSquareText, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ManageContext } from "../EventManage";
import { eventsApi, type Guest } from "../api";
import { ConfirmDialog, EmptyState, formatDateTime } from "../ui";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const isUrl = (v: unknown) => typeof v === "string" && /^https?:\/\//i.test(v);

function LinkValue({ value }: { value: unknown }) {
  if (!str(value)) return <span className="text-muted-foreground">—</span>;
  return isUrl(value) ? (
    <a href={str(value)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline break-all">
      {str(value)} <ExternalLink className="size-3 shrink-0" />
    </a>
  ) : (
    <span className="break-words">{str(value)}</span>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`size-3.5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

/** Product Space's WorkshopResponseDialog / HackathonDialog, as a side drawer. */
function ResponseDrawer({ guest, team, onClose, onApprove }: { guest: Guest; team: boolean; onClose: () => void; onApprove: () => Promise<void> }) {
  const d = (guest.feedbackData || {}) as Record<string, unknown>;
  const [busy, setBusy] = useState(false);
  const rows: [string, unknown][] = team
    ? [
        ["Team name", d.teamName],
        ["Member 1", [d.teamMember1Name, d.teamMember1Email, d.teamMember1Phone].filter(Boolean).join(" · ")],
        ["Member 2", [d.teamMember2Name, d.teamMember2Email, d.teamMember2Phone].filter(Boolean).join(" · ")],
        ["Submission", d.submissionLink],
        ["Agent", d.agentLink],
        ["Agent credentials", d.agentCredentials],
        ["Demo video", d.videoDemoLink],
        ["Teardown deck", d.teardownDeck],
        ["Additional material", d.additionalMaterial],
      ]
    : [
        ["What worked", d.feedback],
        ["What to improve", d.improvement],
        ["LinkedIn", d.linkedinLink],
        ["Interested in programs", d.interestedInPrograms ?? d.interestedInAIPM ?? d.interestedInPMF],
      ];
  const known = new Set(["teamName", "teamMember1Name", "teamMember1Email", "teamMember1Phone", "teamMember2Name", "teamMember2Email", "teamMember2Phone", "submissionLink", "agentLink", "agentCredentials", "videoDemoLink", "teardownDeck", "additionalMaterial", "feedback", "improvement", "linkedinLink", "interestedInPrograms", "interestedInAIPM", "interestedInPMF", "rating", "isPrimaryMember"]);
  const rest = Object.entries(d).filter(([k]) => !known.has(k));

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{team ? str(d.teamName) || guest.name : guest.name}</SheetTitle>
          <SheetDescription>
            {guest.email} · submitted {formatDateTime(guest.feedbackSubmittedAt)}
            {team ? (d.isPrimaryMember ? " · primary member" : " · shared from teammate") : ""}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-8 space-y-5">
          {!team && typeof d.rating === "number" ? (
            <div className="flex items-center gap-2"><Stars value={Number(d.rating)} /><span className="text-[13px] font-medium">{String(d.rating)} / 5</span></div>
          ) : null}
          <dl className="divide-y divide-border rounded-xl border border-border">
            {[...rows, ...rest].filter(([, v]) => str(v)).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[130px_1fr] gap-3 p-3 text-[13px]">
                <dt className="text-muted-foreground">{k.replace(/([a-z])([A-Z])/g, "$1 $2")}</dt>
                <dd className="min-w-0"><LinkValue value={v} /></dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center gap-2">
            {guest.certificateGenerated ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-emerald-700 dark:text-emerald-400"><Check className="size-4" /> Certificate issued</span>
            ) : guest.certificateApproved ? (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-emerald-700 dark:text-emerald-400"><Check className="size-4" /> Certificate approved</span>
            ) : (
              <Button className="gap-1.5" disabled={busy} onClick={async () => { setBusy(true); try { await onApprove(); } finally { setBusy(false); } }}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />} Approve certificate{team ? " (and teammate)" : ""}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function ResponsesTab({ event, guests, reloadGuests, goTo }: ManageContext) {
  const team = ["Hackathon", "Teardown"].includes(event.eventType);
  const responses = useMemo(
    () => guests.filter((g) => g.feedbackSubmittedAt).sort((a, b) => +new Date(b.feedbackSubmittedAt!) - +new Date(a.feedbackSubmittedAt!)),
    [guests]
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const open = openId ? guests.find((g) => g.id === openId) ?? null : null;

  const ratings = responses.map((g) => Number((g.feedbackData as Record<string, unknown>)?.rating)).filter((n) => n >= 1 && n <= 5);
  const average = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const pendingApproval = responses.filter((g) => g.guestType === "Approved" && !g.certificateApproved).length;

  const approve = async (guestId: string) => {
    try {
      const res = await eventsApi.approveCertificate(guestId);
      toast.success(res.message || "Certificate approved");
      await reloadGuests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not approve");
    }
  };

  if (!responses.length) {
    return (
      <EmptyState icon={MessageSquareText} title={team ? "No submissions yet" : "No feedback yet"}
        body={event.canAcceptResponse
          ? `Approved guests submit from the ${team ? "submission" : "feedback"} link in their emails ({{feedbackLink}}).`
          : `Responses are closed. Turn on “Accept ${team ? "submissions" : "feedback"}” on the Overview tab when you're ready.`}
        action={!event.canAcceptResponse ? <Button variant="outline" onClick={() => goTo("overview")}>Go to Overview</Button> : undefined} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
        {!team ? (
          <div className="glass-card rounded-2xl p-6">
            <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Average rating</p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-[32px] font-semibold leading-none">{average ? average.toFixed(1) : "—"}</span>
              <Stars value={Math.round(average)} />
              <span className="text-[13px] text-muted-foreground">from {ratings.length} rating{ratings.length === 1 ? "" : "s"}</span>
            </div>
            <div className="mt-5 space-y-2">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = ratings.filter((r) => r === n).length;
                const pct = ratings.length ? Math.round((c / ratings.length) * 100) : 0;
                return (
                  <div key={n} className="grid grid-cols-[42px_1fr_40px] items-center gap-3 text-[12.5px]">
                    <span className="text-muted-foreground">{n} star</span>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                    <span className="text-right tabular-nums">{c}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6">
            <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Team submissions</p>
            <p className="mt-2 text-[32px] font-semibold leading-none">{responses.filter((g) => (g.feedbackData as Record<string, unknown>)?.isPrimaryMember).length}</p>
            <p className="mt-2 text-[13px] text-muted-foreground">Approving a team&apos;s primary member also shares the submission with teammate 2 and approves them in bulk approval.</p>
          </div>
        )}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Certificates from responses</p>
            <p className="mt-2 text-[14px]"><span className="font-semibold">{pendingApproval}</span> approved guest{pendingApproval === 1 ? " has" : "s have"} responded and await certificate approval.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-1.5" disabled={!pendingApproval} onClick={() => setBulkOpen(true)}><Award className="size-4" /> Approve all</Button>
            <Button variant="outline" className="gap-1.5" disabled={exporting} onClick={async () => {
              setExporting(true);
              try { await eventsApi.exportFeedback(String(event.id), event.eventSlug); } catch (err) { toast.error(err instanceof Error ? err.message : "Export failed"); } finally { setExporting(false); }
            }}>
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{team ? "Team" : "Guest"}</TableHead>
              <TableHead>{team ? "Submission" : "Rating"}</TableHead>
              <TableHead className="hidden lg:table-cell">{team ? "Members" : "What worked"}</TableHead>
              <TableHead className="hidden md:table-cell">Submitted</TableHead>
              <TableHead className="text-right">Certificate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.map((g) => {
              const d = (g.feedbackData || {}) as Record<string, unknown>;
              return (
                <TableRow key={g.id} className="cursor-pointer" onClick={() => setOpenId(g.id)}>
                  <TableCell>
                    <p className="font-medium">{team ? str(d.teamName) || g.name : g.name}</p>
                    <p className="text-[12.5px] text-muted-foreground">{g.email}</p>
                  </TableCell>
                  <TableCell>
                    {team ? (
                      <span className="text-[12.5px] text-muted-foreground truncate block max-w-[220px]">{str(d.submissionLink || d.agentLink || d.videoDemoLink) || "—"}</span>
                    ) : typeof d.rating === "number" ? <Stars value={Number(d.rating)} /> : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-[13px] max-w-[320px]">
                    <span className="line-clamp-2">
                      {team ? [d.teamMember1Name, d.teamMember2Name].filter(Boolean).join(", ") || "—" : str(d.feedback) || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-[12.5px] text-muted-foreground">{formatDateTime(g.feedbackSubmittedAt)}</TableCell>
                  <TableCell className="text-right text-[12.5px]" onClick={(e) => e.stopPropagation()}>
                    {g.certificateGenerated ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">Issued</span>
                    ) : g.certificateApproved ? (
                      <span className="text-emerald-700 dark:text-emerald-400">Approved</span>
                    ) : g.guestType === "Approved" ? (
                      <Button size="sm" variant="outline" onClick={() => approve(g.id)}>Approve</Button>
                    ) : (
                      <span className="text-muted-foreground">Not an approved guest</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {open ? <ResponseDrawer guest={open} team={team} onClose={() => setOpenId(null)} onApprove={() => approve(open.id)} /> : null}
      <ConfirmDialog open={bulkOpen} onOpenChange={setBulkOpen} title="Approve certificates for everyone who responded?"
        description={team ? "Primary members are approved, and their teammates too." : "Approved guests who submitted feedback are approved. Issue the certificates from the Certificates tab."}
        confirmLabel="Approve all"
        onConfirm={async () => {
          const res = await eventsApi.bulkApproveCertificates(String(event.id));
          toast.success(`${res.stats.approved} certificate(s) approved`);
          await reloadGuests();
        }} />
    </div>
  );
}

