"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TbDeviceFloppy, TbWand } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { LoadingRows, Notice, Pill, SettingsCard, Spinner } from "@/components/Admin/Settings/parts";

interface Profile {
  name: string;
  displayName: string;
  address: string | null;
  companyKnowledge: string;
  isPlatform: boolean;
}

const KNOWLEDGE_MAX = 20000;

const TEMPLATE = `# About us
One or two sentences on what the company does.

## What we sell
- …

## Who we sell to
- …

## Proof points (only things that are true and can be checked)
- …

## Tone
- Plain, specific, no buzzwords.

## Never say
- …`;

/**
 * Who the workspace says it is: its name, postal address, and the briefing the AI
 * sales agent writes from. Until the briefing is filled in the agent is told it
 * has nothing true to say about the company, and writes only from the lead and the
 * template it is given — so this is worth a few minutes the day a workspace starts
 * using Outreach.
 */
export function CompanyProfile() {
  const { has } = usePermissions();
  const canWrite = has("settings:write");

  const [saved, setSaved] = useState<Profile | null>(null);
  const [form, setForm] = useState({ displayName: "", address: "", companyKnowledge: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<Profile>("/branding/company")
      .then((p) => {
        setSaved(p);
        setForm({ displayName: p.displayName ?? "", address: p.address ?? "", companyKnowledge: p.companyKnowledge ?? "" });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load the company profile"));
  }, []);

  const dirty =
    !!saved &&
    (form.displayName !== (saved.displayName ?? "") ||
      form.address !== (saved.address ?? "") ||
      form.companyKnowledge !== (saved.companyKnowledge ?? ""));

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiFetch<{ displayName: string; address: string | null; companyKnowledge: string }>("/branding/company", {
        method: "PUT",
        body: JSON.stringify(saved?.isPlatform ? { displayName: form.displayName, address: form.address } : form),
      });
      setSaved((s) => (s ? { ...s, ...res, address: res.address } : s));
      toast.success("Company profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the profile");
    } finally {
      setSaving(false);
    }
  };

  const knowledgeEmpty = !form.companyKnowledge.trim();

  return (
    <SettingsCard
      testId="company-profile"
      title="Company profile"
      description="Used in the footer of your emails, on letters, and to brief the AI that drafts your outreach."
      actions={
        canWrite && (
          <Button size="sm" onClick={save} disabled={!dirty || saving} data-testid="save-company">
            {saving ? <Spinner /> : <TbDeviceFloppy />} {saving ? "Saving…" : "Save changes"}
          </Button>
        )
      }
    >
      {error && <Notice tone="danger">{error}</Notice>}
      {!saved && !error && <LoadingRows rows={3} />}
      {saved && (
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="displayName">Company name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                disabled={!canWrite}
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground">Shown as the sender name and in email footers.</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="address">Postal address</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                disabled={!canWrite}
                placeholder="Street, city, country"
                className="min-h-9"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">Marketing email rules expect one in the footer.</p>
            </div>
          </div>

          <div className="grid gap-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="knowledge">What the AI knows about your company</Label>
              {saved.isPlatform ? (
                <Pill tone="blue">Built-in sales briefing in use</Pill>
              ) : knowledgeEmpty ? (
                <Pill tone="amber" testId="knowledge-empty">Not written yet</Pill>
              ) : (
                <Pill tone="green">Written</Pill>
              )}
            </div>
            <Textarea
              id="knowledge"
              data-testid="knowledge"
              value={form.companyKnowledge}
              onChange={(e) => setForm((f) => ({ ...f, companyKnowledge: e.target.value }))}
              disabled={!canWrite || saved.isPlatform}
              placeholder={TEMPLATE}
              className="min-h-56 font-mono text-xs leading-relaxed"
              maxLength={KNOWLEDGE_MAX}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {saved.isPlatform
                  ? "The platform workspace uses Rhinon's own sales briefing, so this box is locked."
                  : "Write what you sell, who buys it, real proof points and how you like to sound. The AI only uses what is here — it is told not to invent customers, results or prices."}
              </span>
              <span className="tabular-nums">{`${form.companyKnowledge.length.toLocaleString()} / ${KNOWLEDGE_MAX.toLocaleString()}`}</span>
            </div>
            {canWrite && !saved.isPlatform && knowledgeEmpty && (
              <div>
                <Button type="button" size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, companyKnowledge: TEMPLATE }))} data-testid="use-template">
                  <TbWand /> Start from a template
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </SettingsCard>
  );
}
