"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TbClick, TbCopy, TbEye, TbPencil, TbPercentage, TbPlus, TbSpeakerphone, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { timeAgo } from "@/lib/dates";
import { useModuleBase } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { LoadingRows, Notice, Spinner } from "@/components/Admin/Settings/parts";
import { Chip, EmptyState, PageShell, Panel, Segmented, Stat } from "./ui";
import { errorText, useChatbot } from "./chatbotApi";
import { CAMPAIGN_TEMPLATES, describeTargeting, fromTemplate, type Campaign, type CampaignTemplate, type TemplateCategory } from "./campaignTemplates";
import { CampaignCardPreview } from "./CampaignCardPreview";

type Filter = "all" | "active" | "draft" | "paused";

const STATUS_CHIP: Record<Campaign["status"], { tone: "green" | "amber" | "neutral"; label: string }> = {
  active: { tone: "green", label: "Live" },
  paused: { tone: "amber", label: "Paused" },
  draft: { tone: "neutral", label: "Draft" },
};

const rate = (clicks: number, views: number) => (views ? `${Math.round((clicks / views) * 1000) / 10}%` : "—");

/** Live, scheduled for later, or ended — shown under the name. */
function scheduleNote(c: Campaign): string | null {
  const now = Date.now();
  if (c.startsAt && Date.parse(c.startsAt) > now) return `Starts ${new Date(c.startsAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
  if (c.endsAt && Date.parse(c.endsAt) <= now) return "Ended";
  if (c.endsAt) return `Ends ${new Date(c.endsAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
  return null;
}

export function ChatbotCampaigns() {
  const base = useModuleBase();
  const router = useRouter();
  const confirm = useConfirm();
  const { has } = usePermissions();
  const canEdit = has("chatbot:write");
  const { state } = useChatbot();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [picking, setPicking] = useState(false);

  const load = useCallback(async () => {
    try {
      setCampaigns((await apiFetch<{ campaigns: Campaign[] }>("/chatbots/campaigns")).campaigns);
      setError(null);
    } catch (err) {
      const message = errorText(err, "Could not load campaigns");
      if (/no chatbot/i.test(message)) setMissing(true);
      else setError(message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const accent = (state?.chatbot?.config.primaryColor as string) || "#1c1917";
  const counts = useMemo(() => {
    const list = campaigns ?? [];
    return {
      all: list.length,
      active: list.filter((c) => c.status === "active").length,
      draft: list.filter((c) => c.status === "draft").length,
      paused: list.filter((c) => c.status === "paused").length,
      views: list.reduce((n, c) => n + c.impressions, 0),
      clicks: list.reduce((n, c) => n + c.clicks, 0),
    };
  }, [campaigns]);
  const shown = (campaigns ?? []).filter((c) => filter === "all" || c.status === filter);

  const setStatus = async (c: Campaign, status: Campaign["status"]) => {
    try {
      const res = await apiFetch<{ campaign: Campaign }>(`/chatbots/campaigns/${c.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setCampaigns((prev) => prev?.map((x) => (x.id === c.id ? res.campaign : x)) ?? prev);
      toast.success(status === "active" ? `"${c.name}" is live` : `"${c.name}" paused`);
    } catch (err) {
      toast.error(errorText(err, "Could not update the campaign"));
    }
  };

  const duplicate = async (c: Campaign) => {
    try {
      const res = await apiFetch<{ campaign: Campaign }>(`/chatbots/campaigns/${c.id}/duplicate`, { method: "POST" });
      setCampaigns((prev) => (prev ? [res.campaign, ...prev] : prev));
      toast.success("Duplicated as a draft");
    } catch (err) {
      toast.error(errorText(err, "Could not duplicate"));
    }
  };

  const remove = async (c: Campaign) => {
    const ok = await confirm({ title: `Delete "${c.name}"?`, description: "It stops showing straight away, and its stats are deleted.", confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    try {
      await apiFetch(`/chatbots/campaigns/${c.id}`, { method: "DELETE" });
      setCampaigns((prev) => prev?.filter((x) => x.id !== c.id) ?? prev);
    } catch (err) {
      toast.error(errorText(err, "Could not delete"));
    }
  };

  const create = async (template: CampaignTemplate | null) => {
    try {
      const res = await apiFetch<{ campaign: Campaign }>("/chatbots/campaigns", { method: "POST", body: JSON.stringify(fromTemplate(template)) });
      router.push(`${base}/campaigns/${res.campaign.id}`);
    } catch (err) {
      toast.error(errorText(err, "Could not create the campaign"));
    }
  };

  if (missing) {
    return (
      <PageShell title="Campaigns">
        <Notice tone="info">
          Create the chatbot first. <Link href={base} className="font-medium underline underline-offset-2">Go to Overview →</Link>
        </Notice>
      </PageShell>
    );
  }

  return (
    <PageShell
      width="wide"
      title="Campaigns"
      subtitle="Targeted pop-ups above your chat button — greet, promote, and capture leads."
      actions={
        canEdit && (
          <Button onClick={() => setPicking(true)} data-testid="new-campaign">
            <TbPlus size={16} /> New campaign
          </Button>
        )
      }
    >
      {error && <Notice tone="danger">{error}</Notice>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="campaign-stats">
        <Stat icon={<TbSpeakerphone size={18} />} tone="green" label="Live campaigns" value={campaigns ? counts.active : "—"} hint={campaigns ? `${counts.all} in total` : undefined} />
        <Stat icon={<TbEye size={18} />} tone="blue" label="Views" value={campaigns ? counts.views.toLocaleString() : "—"} hint="All time" />
        <Stat icon={<TbClick size={18} />} tone="violet" label="Clicks" value={campaigns ? counts.clicks.toLocaleString() : "—"} hint="All time" />
        <Stat icon={<TbPercentage size={18} />} label="Click rate" value={campaigns ? rate(counts.clicks, counts.views) : "—"} hint="Clicks ÷ views" />
      </div>

      <Panel
        padded={false}
        title="Your campaigns"
        actions={
          <Segmented
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "active", label: "Live", count: counts.active },
              { value: "draft", label: "Drafts", count: counts.draft },
              { value: "paused", label: "Paused", count: counts.paused },
            ]}
          />
        }
      >
        {!campaigns && !error && <div className="p-5"><LoadingRows rows={4} /></div>}
        {campaigns && shown.length === 0 && (
          <EmptyState
            icon={<TbSpeakerphone size={22} />}
            title={filter === "all" ? "No campaigns yet" : "Nothing here"}
            body="Show a message to the right visitors at the right moment — a welcome, an offer before they leave, a free guide for their email."
            action={canEdit && filter === "all" ? <Button onClick={() => setPicking(true)}><TbPlus size={16} /> Create your first campaign</Button> : undefined}
          />
        )}
        <ul className="divide-y divide-border/70" data-testid="campaign-list">
          {shown.map((c) => {
            const chip = STATUS_CHIP[c.status];
            const note = scheduleNote(c);
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4" data-testid={`campaign-${c.id}`}>
                <Link href={`${base}/campaigns/${c.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground hover:underline">{c.name}</span>
                    <Chip tone={chip.tone}>{chip.label}</Chip>
                    <Chip>{c.type === "one-time" ? "Once per visitor" : "Recurring"}</Chip>
                    {note && <Chip tone="blue">{note}</Chip>}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {c.content.heading || "No heading yet"} · {describeTargeting(c.targeting)}
                  </p>
                </Link>
                <div className="flex items-center gap-5 text-right">
                  <Metric label="Views" value={c.impressions} />
                  <Metric label="Clicks" value={c.clicks} />
                  <Metric label="Rate" value={rate(c.clicks, c.impressions)} />
                </div>
                <div className="flex items-center gap-1">
                  {canEdit && (
                    <label className="mr-2 flex items-center gap-2 text-xs text-muted-foreground" title={c.status === "active" ? "Pause" : "Publish"}>
                      <Switch
                        checked={c.status === "active"}
                        onCheckedChange={(on) => setStatus(c, on ? "active" : "paused")}
                        data-testid={`toggle-${c.id}`}
                      />
                    </label>
                  )}
                  <Button variant="ghost" size="icon" asChild title="Edit">
                    <Link href={`${base}/campaigns/${c.id}`}><TbPencil size={16} /></Link>
                  </Button>
                  {canEdit && (
                    <>
                      <Button variant="ghost" size="icon" title="Duplicate" onClick={() => duplicate(c)}><TbCopy size={16} /></Button>
                      <Button variant="ghost" size="icon" title="Delete" className="text-muted-foreground hover:text-red-600" onClick={() => remove(c)}><TbTrash size={16} /></Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {campaigns && campaigns.length > 0 && (
          <p className="border-t border-border/70 px-5 py-3 text-xs text-muted-foreground">Last changed {timeAgo(campaigns[0].updatedAt)}. Only live campaigns show on your site, one at a time — the first whose targeting matches.</p>
        )}
      </Panel>

      <TemplatePicker open={picking} onClose={() => setPicking(false)} onPick={create} accent={accent} />
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-12">
      <p className="text-sm font-semibold tabular-nums text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

const CATEGORIES: TemplateCategory[] = ["Greet and inform", "Promote and convert", "Generate leads"];

function TemplatePicker({ open, onClose, onPick, accent }: { open: boolean; onClose: () => void; onPick: (t: CampaignTemplate | null) => Promise<void>; accent: string }) {
  const [category, setCategory] = useState<TemplateCategory>("Greet and inform");
  const [busy, setBusy] = useState<string | null>(null);

  const pick = async (t: CampaignTemplate | null) => {
    setBusy(t?.id ?? "blank");
    try {
      await onPick(t);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Start a campaign</DialogTitle>
          <DialogDescription>Pick a template — you can change everything — or start from scratch.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <Button variant="outline" onClick={() => pick(null)} disabled={!!busy}>
            {busy === "blank" ? <Spinner /> : <TbPlus size={15} />} Start from scratch
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="template-grid">
          {CAMPAIGN_TEMPLATES.filter((t) => t.category === category).map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!!busy}
              onClick={() => pick(t)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border text-left transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-lg"
              data-testid={`template-${t.id}`}
            >
              <div className="flex h-72 items-start justify-center overflow-hidden bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(127,127,127,0.05)_10px,rgba(127,127,127,0.05)_20px)] pt-4">
                <div className="origin-top scale-[0.72]">
                  <CampaignCardPreview content={{ ...t.content, templateId: t.id }} accent={accent} />
                </div>
              </div>
              <div className={cn("border-t border-border p-4", busy === t.id && "opacity-60")}>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {busy === t.id && <Spinner />}
                  {t.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
