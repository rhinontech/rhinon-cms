"use client";

import { useEffect, useState } from "react";
import {
  TbX,
  TbMail,
  TbPhone,
  TbBuilding,
  TbCalendar,
  TbCurrencyRupee,
  TbTargetArrow,
  TbTrash,
  TbBrandWhatsapp,
  TbExternalLink,
} from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { STARTUP_IDEA_STATUSES, STATUS_STYLES, type StartupIdea, type StartupIdeaStatus } from "./types";

interface Props {
  id: string;
  onClose: () => void;
  /** Fired after any change so the list and unread badge can refresh. */
  onChanged: () => void;
}

export function StartupIdeaDetail({ id, onClose, onChanged }: Props) {
  const [idea, setIdea] = useState<StartupIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    // GET marks the submission read server-side, which clears it from the badge count.
    apiFetch<StartupIdea>(`/startup-ideas/${id}`)
      .then((data) => {
        if (!active) return;
        setIdea(data);
        setNotes(data.notes || "");
        onChanged();
      })
      .catch(() => toast.error("Failed to load submission"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // onChanged is stable enough here; re-running on it would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const patch = async (body: Record<string, unknown>) => {
    const updated = await apiFetch<StartupIdea>(`/startup-ideas/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    setIdea(updated);
    onChanged();
    return updated;
  };

  const handleStatus = async (status: StartupIdeaStatus) => {
    try {
      await patch({ status });
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error("Could not update status");
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await patch({ notes });
      toast.success("Notes saved");
    } catch {
      toast.error("Could not save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleConvert = async () => {
    if (!confirm("Add this founder to the CRM as a lead?")) return;
    setConverting(true);
    try {
      const res = await apiFetch<{ leadId: string; deduped: boolean; idea: StartupIdea }>(
        `/startup-ideas/${id}/convert`,
        { method: "POST" }
      );
      setIdea(res.idea);
      onChanged();
      toast.success(res.deduped ? "Appended to the existing CRM lead" : "Added to the CRM as a lead");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not convert");
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this submission permanently?")) return;
    try {
      await apiFetch(`/startup-ideas/${id}`, { method: "DELETE" });
      toast.success("Submission deleted");
      onChanged();
      onClose();
    } catch {
      toast.error("Could not delete");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl overflow-y-auto border-l border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading || !idea ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-background/95 px-6 py-5 backdrop-blur">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">{idea.name}</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TbCalendar size={13} />
                  {new Date(idea.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {idea.source && <span className="text-muted-foreground/60">· {idea.source}</span>}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <TbX size={18} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Contact */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <a
                  href={`mailto:${idea.email}`}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                >
                  <TbMail size={16} className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{idea.email}</span>
                </a>
                {idea.phone && (
                  <a
                    href={`https://wa.me/${idea.phone.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                  >
                    <TbBrandWhatsapp size={16} className="shrink-0 text-emerald-500" />
                    <span className="truncate">{idea.phone}</span>
                  </a>
                )}
                {idea.organization && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                    <TbBuilding size={16} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{idea.organization}</span>
                  </div>
                )}
                {idea.budget && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                    <TbCurrencyRupee size={16} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{idea.budget}</span>
                  </div>
                )}
              </div>

              {/* Stage */}
              {idea.stage && (
                <div className="flex items-center gap-2">
                  <TbTargetArrow size={15} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Current stage:</span>
                  <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium">
                    {idea.stage}
                  </span>
                </div>
              )}

              {/* The idea itself */}
              <div>
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  What they want to build
                </h3>
                <p className="whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground">
                  {idea.idea}
                </p>
              </div>

              {/* Status */}
              <div>
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {STARTUP_IDEA_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatus(s)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        idea.status === s
                          ? STATUS_STYLES[s]
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal notes */}
              <div>
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Internal notes
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="What did you make of this one?"
                  className="w-full resize-none rounded-xl border border-border bg-card p-4 text-sm outline-none focus:border-primary/40"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes || notes === (idea.notes || "")}
                  className="mt-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  {savingNotes ? "Saving…" : "Save notes"}
                </button>
              </div>

              {/* Attribution */}
              {(idea.utmSource || idea.utmCampaign || idea.referrer) && (
                <div>
                  <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Where they came from
                  </h3>
                  <div className="space-y-1 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
                    {idea.utmSource && <div>utm_source: {idea.utmSource}</div>}
                    {idea.utmMedium && <div>utm_medium: {idea.utmMedium}</div>}
                    {idea.utmCampaign && <div>utm_campaign: {idea.utmCampaign}</div>}
                    {idea.referrer && <div className="truncate">referrer: {idea.referrer}</div>}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
                {idea.convertedLeadId ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <TbExternalLink size={14} />
                    Already in the CRM as a lead
                  </span>
                ) : (
                  <button
                    onClick={handleConvert}
                    disabled={converting}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                  >
                    <TbTargetArrow size={14} />
                    {converting ? "Converting…" : "Convert to CRM lead"}
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-rose-300 hover:text-rose-500"
                >
                  <TbTrash size={14} />
                  Delete
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
