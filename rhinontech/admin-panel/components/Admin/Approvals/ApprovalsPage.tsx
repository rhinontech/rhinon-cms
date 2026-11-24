"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { TbArrowRight, TbCalendarOff, TbCheck, TbCircleCheck, TbClockHour4, TbReceipt, TbX } from "react-icons/tb";
import { AdminDashboardShell } from "@/components/Admin/Common/AdminDashboardShell/AdminDashboardShell";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { apiFetch } from "@/lib/api";
import { approvalsChanged } from "@/lib/approvals";
import { cn } from "@/lib/utils";

interface LeaveItem { id: string; person: string; department: string | null; leaveType: string; startDate: string; endDate: string; days: number; reason: string | null; requestedAt: string }
interface AttendanceItem { id: string; person: string; type: string; date: string; requestedTime: string | null; reason: string | null; requestedAt: string }
interface ClaimItem { id: string; person: string; category: string; description: string; amount: number; expenseMonth: number; expenseYear: number; requestedAt: string }

/** GET /home/approvals — a kind is missing when this person can't approve it. */
interface Pending {
  leave?: LeaveItem[];
  attendance?: AttendanceItem[];
  reimbursements?: ClaimItem[];
}

const day = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const range = (start: string, end: string) => (start === end ? day(start) : `${day(start)} – ${day(end)}`);
const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const month = (m: number, y: number) => new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
const ago = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
};

function Section({ title, icon, tone, count, moreHref, moreLabel, children }: { title: string; icon: React.ReactNode; tone: string; count: number; moreHref: string; moreLabel: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl glass-card">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${tone}1f`, color: tone }}>{icon}</span>
        <h2 className="flex-1 text-sm font-semibold text-foreground">{`${title} (${count})`}</h2>
        <Link href={moreHref} prefetch={false} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          {moreLabel} <TbArrowRight size={13} />
        </Link>
      </div>
      {count === 0 ? <p className="px-5 py-4 text-sm text-muted-foreground">Nothing waiting.</p> : <ul className="divide-y divide-border">{children}</ul>}
    </section>
  );
}

function Row({ title, detail, note, busy, onApprove, onReject }: { title: string; detail: string; note: string | null; busy: boolean; onApprove: () => void; onReject: () => void }) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3">
      <div className="min-w-0 flex-1 basis-64">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
        {note && <p className="mt-0.5 line-clamp-2 text-xs text-foreground/70">{`"${note}"`}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button onClick={onReject} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/85 hover:bg-muted disabled:opacity-50">
          <TbX size={14} /> Reject
        </button>
        <button onClick={onApprove} disabled={busy} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          <TbCheck size={14} /> Approve
        </button>
      </div>
    </li>
  );
}

/**
 * Every decision waiting on this person, in one place.
 *
 * Approvals used to live on four screens (Attendance, Leave, Payroll →
 * Reimbursements, Documents), with nothing telling a manager the queue
 * existed. Each module's own page still works; this gathers them and uses the
 * same endpoints, so the rules — who may approve what — are unchanged.
 */
function ApprovalsContent() {
  const pathname = usePathname();
  const role = pathname.split("/")[1] || "";
  const confirm = useConfirm();
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setError("");
    apiFetch<Pending>("/home/approvals")
      .then(setPending)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load approvals"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (kind: keyof Pending, id: string, approve: boolean, who: string) => {
    if (!approve && !(await confirm({ title: `Reject ${who}'s request?`, description: "They will see it as rejected.", confirmLabel: "Reject", destructive: true }))) return;
    setBusy(id);
    try {
      if (kind === "leave") {
        await apiFetch(`/leave/requests/${id}/action`, { method: "PUT", body: JSON.stringify({ status: approve ? "Approved" : "Rejected" }) });
      } else if (kind === "attendance") {
        await apiFetch(`/attendance/requests/${id}`, { method: "PUT", body: JSON.stringify({ status: approve ? "Approved" : "Rejected" }) });
      } else {
        // Approved claims are paid with the next payslip — the default on Payroll's own screen too.
        await apiFetch(`/reimbursements/admin/${id}/${approve ? "approve" : "reject"}`, { method: "POST", body: JSON.stringify(approve ? { payout: "payslip" } : {}) });
      }
      setPending((p) => (p ? { ...p, [kind]: (p[kind] as Array<{ id: string }> | undefined)?.filter((item) => item.id !== id) } : p));
      approvalsChanged();
      toast.success(approve ? "Approved" : "Rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That did not go through. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const total = (pending?.leave?.length ?? 0) + (pending?.attendance?.length ?? 0) + (pending?.reimbursements?.length ?? 0);
  const allowedKinds = pending ? [pending.leave, pending.attendance, pending.reimbursements].filter((x) => x !== undefined).length : 0;

  return (
    <div className="h-full w-full overflow-auto rounded-xl glass-panel">
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Approvals</h1>
          <p className="text-sm text-muted-foreground">Requests waiting for your decision, oldest first.</p>
        </div>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300">
            <span>{error}</span>
            <button onClick={load} className="rounded-md border border-current/30 px-3 py-1 text-xs font-medium">Try again</button>
          </div>
        )}

        {!pending && !error && (
          <div className="space-y-3" aria-hidden>
            {[0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/60" />)}
          </div>
        )}

        {pending && allowedKinds === 0 && (
          <p className="rounded-xl glass-card px-5 py-6 text-sm text-muted-foreground">Your role does not approve requests. Ask a workspace admin if that should change.</p>
        )}

        {pending && allowedKinds > 0 && total === 0 && (
          <div className="flex items-center gap-3 rounded-xl glass-card px-5 py-6" data-testid="approvals-empty">
            <TbCircleCheck size={22} className="text-emerald-500" />
            <p className="text-sm text-foreground">Nothing is waiting for your approval.</p>
          </div>
        )}

        {pending?.leave && (
          <Section title="Leave" icon={<TbCalendarOff size={16} />} tone="#14b8a6" count={pending.leave.length} moreHref={`/${role}/leave/approvals`} moreLabel="Open Leave">
            {pending.leave.map((r) => (
              <Row
                key={r.id}
                title={r.person}
                detail={`${r.leaveType} · ${range(r.startDate, r.endDate)} · ${r.days} ${r.days === 1 ? "day" : "days"} · asked ${ago(r.requestedAt)}`}
                note={r.reason}
                busy={busy === r.id}
                onApprove={() => decide("leave", r.id, true, r.person)}
                onReject={() => decide("leave", r.id, false, r.person)}
              />
            ))}
          </Section>
        )}

        {pending?.attendance && (
          <Section title="Attendance corrections" icon={<TbClockHour4 size={16} />} tone="#14b8a6" count={pending.attendance.length} moreHref={`/${role}/attendance/approvals`} moreLabel="Open Attendance">
            {pending.attendance.map((r) => (
              <Row
                key={r.id}
                title={r.person}
                detail={`${r.type} · ${day(r.date)}${r.requestedTime ? ` · ${r.requestedTime}` : ""} · asked ${ago(r.requestedAt)}`}
                note={r.reason}
                busy={busy === r.id}
                onApprove={() => decide("attendance", r.id, true, r.person)}
                onReject={() => decide("attendance", r.id, false, r.person)}
              />
            ))}
          </Section>
        )}

        {pending?.reimbursements && (
          <Section title="Reimbursements" icon={<TbReceipt size={16} />} tone="#ffb020" count={pending.reimbursements.length} moreHref={`/${role}/payroll/reimbursements`} moreLabel="Open Payroll">
            {pending.reimbursements.map((r) => (
              <Row
                key={r.id}
                title={`${r.person} · ${money(r.amount)}`}
                detail={`${r.category} · for ${month(r.expenseMonth, r.expenseYear)} · asked ${ago(r.requestedAt)} · paid with the next payslip`}
                note={r.description}
                busy={busy === r.id}
                onApprove={() => decide("reimbursements", r.id, true, r.person)}
                onReject={() => decide("reimbursements", r.id, false, r.person)}
              />
            ))}
          </Section>
        )}

        <p className={cn("text-xs text-muted-foreground", !pending && "hidden")}>Approving here does exactly what it does on each module&apos;s own screen.</p>
      </div>
    </div>
  );
}

export function ApprovalsPage() {
  return (
    <AdminDashboardShell>
      <ApprovalsContent />
    </AdminDashboardShell>
  );
}
