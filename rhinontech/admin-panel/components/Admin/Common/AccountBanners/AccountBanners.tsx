"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { TbAlertTriangle, TbClockHour4, TbFileCheck, TbInfoCircle, TbMailExclamation, TbTrash, TbX } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch, PLAN_BLOCKED_EVENT, type PlanBlockedDetail } from "@/lib/api";
import { daysUntil, plural, shortDate } from "@/lib/dates";
import { useLegal } from "@/lib/legal";
import { cn } from "@/lib/utils";

type Tone = "info" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  info: "border-blue-300/70 bg-blue-50/80 text-blue-900 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-100",
  warning: "border-amber-300/70 bg-amber-50/80 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100",
  danger: "border-red-300/70 bg-red-50/80 text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100",
};

function Banner({
  tone,
  icon,
  children,
  actions,
  onDismiss,
  testId,
}: {
  tone: Tone;
  icon: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onDismiss?: () => void;
  testId: string;
}) {
  return (
    <div
      role="status"
      data-testid={testId}
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2 text-sm", TONES[tone])}
    >
      <span className="shrink-0 [&>svg]:size-[18px]">{icon}</span>
      <div className="min-w-0 flex-1 basis-56">{children}</div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100"
        >
          <TbX size={15} />
        </button>
      )}
    </div>
  );
}

const DISMISS_TRIAL_KEY = "rhinon.dismiss.trial";
/** Fired by the Data & privacy screen after it schedules or cancels a deletion. */
export const DELETION_CHANGED_EVENT = "rhinon:deletion-changed";

/**
 * The account-level notices that sit above every admin screen: confirm your email,
 * trial countdown, accept the terms, a scheduled deletion, and "your plan stopped
 * that". They are state the owner must act on, so they live in the shell rather
 * than on one settings page nobody is looking at when the problem bites.
 */
function AccountBannersInner() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const { account, isOwner, has, roleSlug, refresh } = usePermissions();
  const legal = useLegal();
  const org = account.organization;
  const isPlatform = !!org?.isPlatform;
  const settingsHref = `/${pathname.split("/")[1] || roleSlug}/settings`;
  const canSeePlan = has("settings:read");

  const [busy, setBusy] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<PlanBlockedDetail | null>(null);
  const [trialDismissed, setTrialDismissed] = useState(false);
  const [deletionFor, setDeletionFor] = useState<string | null>(null);

  useEffect(() => {
    try {
      setTrialDismissed(sessionStorage.getItem(DISMISS_TRIAL_KEY) === "1");
    } catch {
      /* storage unavailable: the notice simply stays */
    }
  }, []);

  // A request somewhere else in the app was refused because of the plan.
  useEffect(() => {
    const onBlocked = (e: Event) => setBlocked((e as CustomEvent<PlanBlockedDetail>).detail);
    window.addEventListener(PLAN_BLOCKED_EVENT, onBlocked);
    return () => window.removeEventListener(PLAN_BLOCKED_EVENT, onBlocked);
  }, []);

  // Landing back from the emailed link: /…/dashboard?verified=1
  const verified = search.get("verified");
  useEffect(() => {
    if (!verified) return;
    if (verified === "1") {
      toast.success("Email confirmed — sending is now switched on.");
      refresh();
    } else {
      toast.error("That confirmation link is invalid or has expired. Use “Resend email” below.");
    }
    const params = new URLSearchParams(search.toString());
    params.delete("verified");
    router.replace(params.size ? `${pathname}?${params}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified]);

  // Only the owner of a real customer workspace can have a deletion pending.
  const loadDeletion = useCallback(() => {
    if (!isOwner || isPlatform) return;
    apiFetch<{ scheduled: boolean; scheduledFor: string | null }>("/workspace/deletion")
      .then((d) => setDeletionFor(d.scheduled ? d.scheduledFor : null))
      .catch(() => setDeletionFor(null));
  }, [isOwner, isPlatform]);
  useEffect(loadDeletion, [loadDeletion]);
  // The Data & privacy screen schedules and cancels deletions; tell the banner.
  useEffect(() => {
    window.addEventListener(DELETION_CHANGED_EVENT, loadDeletion);
    return () => window.removeEventListener(DELETION_CHANGED_EVENT, loadDeletion);
  }, [loadDeletion]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const resend = () =>
    run("resend", async () => {
      await apiFetch("/auth/resend-verification", { method: "POST" });
      toast.success("Verification email sent. Check your inbox.");
    });

  const acceptTerms = () =>
    run("terms", async () => {
      await apiFetch("/auth/accept-terms", { method: "POST", body: JSON.stringify({ version: account.termsVersion }) });
      toast.success("Thanks — terms accepted.");
      refresh();
    });

  const cancelDeletion = () =>
    run("cancel-deletion", async () => {
      await apiFetch("/workspace/deletion", { method: "DELETE" });
      toast.success("Deletion cancelled. Your workspace is staying.");
      setDeletionFor(null);
    });

  if (!org) return null;

  const left = daysUntil(account.trialEndsAt);
  const onTrial = org.status === "trial" && !isPlatform && left !== null;
  const trialLeft = left ?? 0;
  const planLink = canSeePlan ? (
    <Button size="sm" variant="outline" className="h-7 bg-transparent" asChild>
      <Link href={`${settingsHref}/billing`}>View plans</Link>
    </Button>
  ) : null;

  const notices: React.ReactNode[] = [];

  if (deletionFor) {
    notices.push(
      <Banner
        key="deletion"
        testId="banner-deletion"
        tone="danger"
        icon={<TbTrash />}
        actions={
          <Button size="sm" variant="outline" className="h-7 bg-transparent" onClick={cancelDeletion} disabled={busy === "cancel-deletion"}>
            Cancel deletion
          </Button>
        }
      >
        <strong>{`This workspace will be permanently deleted on ${shortDate(deletionFor)}.`}</strong>{" "}
        Everything in it — people, leads, files — goes with it. You can still cancel until then.
      </Banner>
    );
  }

  if (account.emailVerificationPending && isOwner) {
    notices.push(
      <Banner
        key="verify"
        testId="banner-verify-email"
        tone="warning"
        icon={<TbMailExclamation />}
        actions={
          <Button size="sm" variant="outline" className="h-7 bg-transparent" onClick={resend} disabled={busy === "resend"}>
            {busy === "resend" ? "Sending…" : "Resend email"}
          </Button>
        }
      >
        <strong>Confirm your email to start sending.</strong>{" "}
        {`Campaigns, automations and new messages from ${org.name} are paused until you click the link we emailed you.`}
      </Banner>
    );
  }

  if (onTrial && account.trialExpired) {
    notices.push(
      <Banner key="trial-ended" testId="banner-trial-expired" tone="danger" icon={<TbAlertTriangle />} actions={planLink}>
        <strong>Your trial has ended.</strong> Your workspace is read-only — you can view and export everything, but changes are
        switched off until you upgrade.
      </Banner>
    );
  } else if (onTrial && trialLeft > 0 && !(trialLeft > 7 && trialDismissed)) {
    notices.push(
      <Banner
        key="trial"
        testId="banner-trial"
        tone={trialLeft <= 7 ? "warning" : "info"}
        icon={<TbClockHour4 />}
        actions={planLink}
        onDismiss={
          trialLeft > 7
            ? () => {
                setTrialDismissed(true);
                try {
                  sessionStorage.setItem(DISMISS_TRIAL_KEY, "1");
                } catch {
                  /* ignore */
                }
              }
            : undefined
        }
      >
        <strong>{`Free trial — ${plural(trialLeft, "day")} left.`}</strong>{" "}
        {`Your trial ends on ${shortDate(account.trialEndsAt)}. After that the workspace becomes read-only.`}
      </Banner>
    );
  }

  if (isOwner && !isPlatform && !account.termsAccepted) {
    notices.push(
      <Banner
        key="terms"
        testId="banner-terms"
        tone="info"
        icon={<TbFileCheck />}
        actions={
          <Button size="sm" className="h-7" onClick={acceptTerms} disabled={busy === "terms"}>
            {busy === "terms" ? "Saving…" : "I accept"}
          </Button>
        }
      >
        <strong>Please accept the Terms of Service.</strong>{" "}
        {legal?.termsUrl ? (
          <>
            Read the{" "}
            <a href={legal.termsUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {`terms (version ${account.termsVersion})`}
            </a>
            {legal.privacyUrl ? (
              <>
                {" "}and{" "}
                <a href={legal.privacyUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  Privacy Policy
                </a>
              </>
            ) : null}{" "}
            and confirm on behalf of {org.name}.
          </>
        ) : (
          `Confirm on behalf of ${org.name} that you agree to the current terms (version ${account.termsVersion}).`
        )}
      </Banner>
    );
  }

  if (blocked) {
    notices.push(
      <Banner
        key="blocked"
        testId="banner-plan-blocked"
        tone="warning"
        icon={<TbInfoCircle />}
        actions={blocked.code === "EMAIL_NOT_VERIFIED" && isOwner ? (
          <Button size="sm" variant="outline" className="h-7 bg-transparent" onClick={resend} disabled={busy === "resend"}>
            Resend email
          </Button>
        ) : (
          planLink
        )}
        onDismiss={() => setBlocked(null)}
      >
        {blocked.message}
      </Banner>
    );
  }

  if (notices.length === 0) return null;
  return <div className="flex shrink-0 flex-col gap-2">{notices}</div>;
}

export function AccountBanners() {
  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense fallback={null}>
      <AccountBannersInner />
    </Suspense>
  );
}
