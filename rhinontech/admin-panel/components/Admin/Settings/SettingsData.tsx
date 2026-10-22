"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TbDownload, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePermissions } from "@/context/PermissionsContext";
import { DELETION_CHANGED_EVENT } from "@/components/Admin/Common/AccountBanners/AccountBanners";
import { apiDownload, apiFetch } from "@/lib/api";
import { useLegal } from "@/lib/legal";
import { dateTime, plural } from "@/lib/dates";
import { LoadingRows, Notice, Pill, SettingsCard, SettingsFrame, Spinner } from "@/components/Admin/Settings/parts";

interface DeletionState {
  scheduled: boolean;
  scheduledFor: string | null;
  requestedAt: string | null;
  graceDays: number;
}

export function SettingsData() {
  const { isOwner, account, refresh } = usePermissions();
  const legal = useLegal();
  const org = account.organization;

  const [deletion, setDeletion] = useState<DeletionState | null>(null);
  const [exporting, setExporting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadDeletion = useCallback(() => {
    if (!isOwner || org?.isPlatform) return;
    apiFetch<DeletionState>("/workspace/deletion").then(setDeletion).catch(() => setDeletion(null));
  }, [isOwner, org?.isPlatform]);
  useEffect(loadDeletion, [loadDeletion]);

  const exportData = async () => {
    setExporting(true);
    try {
      await apiDownload("/workspace/export", `${org?.slug ?? "workspace"}-export.json`);
      toast.success("Export downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not export your data");
    } finally {
      setExporting(false);
    }
  };

  const acceptTerms = async () => {
    setAccepting(true);
    try {
      await apiFetch("/auth/accept-terms", { method: "POST", body: JSON.stringify({ version: account.termsVersion }) });
      toast.success("Terms accepted");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record your acceptance");
    } finally {
      setAccepting(false);
    }
  };

  const openDialog = () => {
    setSlug("");
    setPassword("");
    setFormError("");
    setDialog(true);
  };

  const scheduleDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await apiFetch<DeletionState>("/workspace/deletion", {
        method: "POST",
        body: JSON.stringify({ confirmSlug: slug, password }),
      });
      setDeletion(res);
      setDialog(false);
      window.dispatchEvent(new Event(DELETION_CHANGED_EVENT));
      toast.success("Deletion scheduled. We emailed you a confirmation.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not schedule the deletion");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelDeletion = async () => {
    try {
      setDeletion(await apiFetch<DeletionState>("/workspace/deletion", { method: "DELETE" }));
      window.dispatchEvent(new Event(DELETION_CHANGED_EVENT));
      toast.success("Deletion cancelled. Your workspace is staying.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel the deletion");
    }
  };

  const canDelete = slug.trim().toLowerCase() === org?.slug && password.length > 0 && !submitting;

  return (
    <SettingsFrame title="Data & privacy" description="Take your data with you, review the terms, or close the workspace">
      {!isOwner && <Notice tone="info">Only the workspace owner can export or delete workspace data.</Notice>}

      <SettingsCard
        title="Export your data"
        description="Everything in the workspace as one JSON file — people, leads, campaigns, tasks, documents and settings. Uploaded files are listed by name, not included. Password hashes and connected-account credentials are never part of an export."
        actions={
          isOwner && (
            <Button size="sm" onClick={exportData} disabled={exporting} data-testid="export-data">
              {exporting ? <Spinner /> : <TbDownload />} {exporting ? "Preparing…" : "Download export"}
            </Button>
          )
        }
      />

      {!org?.isPlatform && (
        <SettingsCard
          title="Terms of service"
          description={account.termsVersion ? `Current version: ${account.termsVersion}` : undefined}
          actions={
            account.termsAccepted ? (
              <Pill tone="green" testId="terms-accepted">Accepted</Pill>
            ) : isOwner ? (
              <Button size="sm" onClick={acceptTerms} disabled={accepting} data-testid="accept-terms-btn">I accept</Button>
            ) : (
              <Pill tone="amber">Not yet accepted</Pill>
            )
          }
        >
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {legal?.termsUrl && <a className="underline underline-offset-2 hover:text-primary" href={legal.termsUrl} target="_blank" rel="noreferrer">Terms of Service</a>}
            {legal?.privacyUrl && <a className="underline underline-offset-2 hover:text-primary" href={legal.privacyUrl} target="_blank" rel="noreferrer">Privacy Policy</a>}
            {legal?.dpaUrl && <a className="underline underline-offset-2 hover:text-primary" href={legal.dpaUrl} target="_blank" rel="noreferrer">Data Processing Agreement</a>}
            {!legal?.termsUrl && !legal?.privacyUrl && !legal?.dpaUrl && <span className="text-muted-foreground">Your account manager can send you the current documents.</span>}
          </div>
        </SettingsCard>
      )}

      {org?.isPlatform ? (
        <Notice tone="info">The platform workspace cannot be deleted.</Notice>
      ) : isOwner ? (
        <SettingsCard
          tone="danger"
          testId="danger-zone"
          title="Delete this workspace"
          description={
            deletion?.scheduled
              ? undefined
              : `Permanently removes the workspace and everything in it — people, leads, campaigns, files. You get ${plural(deletion?.graceDays ?? 7, "day")} to change your mind first.`
          }
        >
          {!deletion && <LoadingRows rows={1} />}
          {deletion?.scheduled && (
            <div className="flex flex-wrap items-center justify-between gap-3" data-testid="deletion-scheduled">
              <p className="text-sm">
                {`Deletion is scheduled for ${dateTime(deletion.scheduledFor)}. Until then everything keeps working and you can cancel.`}
              </p>
              <Button variant="outline" size="sm" onClick={cancelDeletion} data-testid="cancel-deletion">Cancel deletion</Button>
            </div>
          )}
          {deletion && !deletion.scheduled && (
            <Button variant="destructive" size="sm" onClick={openDialog} data-testid="delete-workspace">
              <TbTrash /> Delete workspace…
            </Button>
          )}
        </SettingsCard>
      ) : null}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <form onSubmit={scheduleDeletion} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{`Delete ${org?.name}?`}</DialogTitle>
              <DialogDescription>
                {`This starts a ${plural(deletion?.graceDays ?? 7, "day")} countdown. When it ends, every person, lead, campaign, document and file in this workspace is permanently erased and cannot be recovered. Consider exporting your data first.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="confirm-slug">
                Type <span className="font-mono font-semibold">{org?.slug}</span> to confirm
              </Label>
              <Input id="confirm-slug" value={slug} onChange={(e) => setSlug(e.target.value)} autoComplete="off" spellCheck={false} data-testid="confirm-slug" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirm-password">Your password</Label>
              <Input id="confirm-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" data-testid="confirm-password" />
            </div>
            {formError && <Notice tone="danger" testId="deletion-error">{formError}</Notice>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog(false)} disabled={submitting}>Keep my workspace</Button>
              <Button type="submit" variant="destructive" disabled={!canDelete} data-testid="confirm-delete">
                {submitting ? <Spinner /> : null} Schedule deletion
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SettingsFrame>
  );
}
