"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { GuestStatus, ReminderStatus } from "./api";

export const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";
export const formatDay = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const GUEST_STYLES: Record<GuestStatus, string> = {
  Approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  Waitlist: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Declined: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
};
export function GuestStatusBadge({ status }: { status: GuestStatus }) {
  return <Badge className={`border-0 ${GUEST_STYLES[status]}`}>{status}</Badge>;
}

const REMINDER_STYLES: Record<ReminderStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  sending: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  sent: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  failed: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
};
export function ReminderStatusBadge({ status }: { status: ReminderStatus }) {
  return <Badge className={`border-0 capitalize ${REMINDER_STYLES[status]}`}>{status}</Badge>;
}

export function StatCard({ label, value, hint, icon: Icon }: { label: string; value: ReactNode; hint?: ReactNode; icon: typeof Check }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="grid place-items-center size-8 rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-[28px] font-semibold tracking-tight leading-none">{value}</p>
      {hint ? <p className="mt-2 text-[12.5px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: typeof Check; title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span className="mx-auto grid place-items-center size-11 rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="mt-4 text-[15px] font-semibold">{title}</p>
      <p className="mt-1 text-[13px] text-muted-foreground max-w-md mx-auto">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** A confirm step for anything that emails guests or can't be undone. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className={destructive ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
            onClick={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await onConfirm();
                onOpenChange(false);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Something went wrong");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Sends a test of any email to an address the admin chooses. */
export function TestEmailDialog({
  open,
  onOpenChange,
  title = "Send a test email",
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  onSend: (email: string) => Promise<unknown>;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Placeholders are filled with sample values, and the subject is marked [Test].</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="test-email">Send to</Label>
          <Input id="test-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoFocus />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!valid || busy}
            className="gap-1.5"
            onClick={async () => {
              setBusy(true);
              try {
                await onSend(email);
                toast.success(`Test sent to ${email}`);
                onOpenChange(false);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not send the test");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const EMAIL_PLACEHOLDERS: { token: string; meaning: string }[] = [
  { token: "{{name}}", meaning: "Guest's name" },
  { token: "{{eventTitle}}", meaning: "Event title" },
  { token: "{{eventDate}}", meaning: "Date(s)" },
  { token: "{{eventTime}}", meaning: "Time, IST" },
  { token: "{{location}}", meaning: "Venue or platform" },
  { token: "{{eventLink}}", meaning: "Event page" },
  { token: "{{registrationLink}}", meaning: "Guest's own registration page" },
  { token: "{{feedbackLink}}", meaning: "Guest's feedback form" },
  { token: "{{referralLink}}", meaning: "Guest's referral link" },
  { token: "{{whatsappLink}}", meaning: "Community group" },
];

/** Click-to-copy reference of the {{placeholders}} an email body can use. */
export function PlaceholderHelp({ extra = [] }: { extra?: { token: string; meaning: string }[] }) {
  const [copied, setCopied] = useState("");
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">Placeholders — click to copy</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[...EMAIL_PLACEHOLDERS, ...extra].map((p) => (
          <button
            key={p.token}
            type="button"
            title={p.meaning}
            onClick={() => {
              navigator.clipboard?.writeText(p.token);
              setCopied(p.token);
              window.setTimeout(() => setCopied(""), 1200);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-[11.5px] hover:border-primary/60 hover:text-primary transition-colors"
          >
            {copied === p.token ? <Check className="size-3" /> : <Copy className="size-3 opacity-50" />}
            {p.token}
          </button>
        ))}
      </div>
    </div>
  );
}
