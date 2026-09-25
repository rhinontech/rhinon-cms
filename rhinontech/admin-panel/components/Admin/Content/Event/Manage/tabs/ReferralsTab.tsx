"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Share2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ManageContext } from "../EventManage";
import { eventsApi, type Referee, type ReferralRow } from "../api";
import { ConfirmDialog, EmptyState, GuestStatusBadge, formatDateTime } from "../ui";

/**
 * Each guest gets a code of their own; anyone registering with it counts as
 * their referral. Product Space's ApproveReferrer let an admin clear a
 * referrer's whole waitlist at once — the "Approve all" in the drawer.
 */
function RefereesDrawer({ event, row, onClose, onChanged }: { event: ManageContext["event"]; row: ReferralRow; onClose: () => void; onChanged: () => Promise<void> }) {
  const [data, setData] = useState<{ referrer: { name: string; email: string } | null; referredMembers: Referee[] } | null>(null);
  const [busy, setBusy] = useState("");
  const [approveAll, setApproveAll] = useState(false);
  const load = useCallback(() => eventsApi.referees(String(event.id), row.referralCode).then(setData).catch(() => setData({ referrer: null, referredMembers: [] })), [event.id, row.referralCode]);
  useEffect(() => { load(); }, [load]);

  const act = async (id: string, status: "Approved" | "Declined") => {
    setBusy(id + status);
    try {
      await eventsApi.setStatus(String(event.id), [id], status);
      toast.success(status === "Approved" ? "Approved — confirmation emailed" : "Declined");
      await Promise.all([load(), onChanged()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusy("");
    }
  };
  const waiting = data?.referredMembers.filter((m) => m.guestType === "Waitlist") ?? [];

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{row.name}&apos;s referrals</SheetTitle>
          <SheetDescription>
            Code <span className="font-mono">{row.referralCode}</span> · {row.memberCount} registration{row.memberCount === 1 ? "" : "s"}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-8 space-y-4">
          {waiting.length ? (
            <Button className="gap-1.5 w-full" onClick={() => setApproveAll(true)}>
              <UserCheck className="size-4" /> Approve all {waiting.length} waitlisted
            </Button>
          ) : null}
          {data === null ? (
            <div className="grid place-items-center py-10 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {data.referredMembers.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">{m.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{m.email} · {m.userType || "—"} · {formatDateTime(m.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <GuestStatusBadge status={m.guestType} />
                    {m.guestType !== "Approved" ? (
                      <Button size="icon" variant="ghost" className="size-8" aria-label={`Approve ${m.name}`} disabled={Boolean(busy)} onClick={() => act(m.id, "Approved")}>
                        {busy === m.id + "Approved" ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />}
                      </Button>
                    ) : null}
                    {m.guestType !== "Declined" ? (
                      <Button size="icon" variant="ghost" className="size-8" aria-label={`Decline ${m.name}`} disabled={Boolean(busy)} onClick={() => act(m.id, "Declined")}>
                        {busy === m.id + "Declined" ? <Loader2 className="size-4 animate-spin" /> : <UserX className="size-4" />}
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ConfirmDialog open={approveAll} onOpenChange={setApproveAll} title={`Approve ${waiting.length} referred guest(s)?`}
          description={`Everyone ${row.name} referred who is still on the waitlist is approved and sent the approval email.`}
          confirmLabel="Approve all"
          onConfirm={async () => {
            const res = await eventsApi.setStatus(String(event.id), waiting.map((m) => m.id), "Approved");
            toast.success(`${res.updated} approved · ${res.emailed} email(s) sent`);
            await Promise.all([load(), onChanged()]);
          }} />
      </SheetContent>
    </Sheet>
  );
}

export default function ReferralsTab({ event, reloadGuests }: ManageContext) {
  const [rows, setRows] = useState<ReferralRow[] | null>(null);
  const [open, setOpen] = useState<ReferralRow | null>(null);
  const load = useCallback(() => eventsApi.referrals(String(event.id)).then(setRows).catch(() => setRows([])), [event.id]);
  useEffect(() => { load(); }, [load]);

  if (rows === null) return <div className="grid place-items-center py-16 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>;
  if (!rows.length) {
    return (
      <EmptyState icon={Share2} title="No referrals yet"
        body="Every guest gets their own referral link in their confirmation email ({{referralLink}}). Registrations made through it show up here, credited to them." />
    );
  }
  const total = rows.reduce((s, r) => s + r.memberCount, 0);

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted-foreground">
        <span className="font-semibold text-foreground">{total}</span> registration{total === 1 ? "" : "s"} came through <span className="font-semibold text-foreground">{rows.length}</span> referral code{rows.length === 1 ? "" : "s"}.
      </p>
      <div className="glass-card rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Referrer</TableHead>
              <TableHead className="hidden md:table-cell">Code</TableHead>
              <TableHead className="text-right">Referred</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Approved</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Waiting</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.referralCode} className="cursor-pointer" onClick={() => setOpen(r)}>
                <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
                <TableCell>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-[12.5px] text-muted-foreground">{r.email || "Code not issued by this event"}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-[12.5px]">{r.referralCode}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{r.memberCount}</TableCell>
                <TableCell className="text-right hidden sm:table-cell tabular-nums">{r.approvedCount}</TableCell>
                <TableCell className="text-right hidden sm:table-cell tabular-nums">{r.waitlistCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {open ? <RefereesDrawer event={event} row={open} onClose={() => setOpen(null)} onChanged={async () => { await Promise.all([load(), reloadGuests()]); }} /> : null}
    </div>
  );
}
