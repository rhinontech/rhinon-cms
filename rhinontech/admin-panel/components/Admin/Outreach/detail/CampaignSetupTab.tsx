"use client";

import { useEffect, useState } from "react";
import { TbCircleCheck, TbCircleX, TbUsers, TbUsersGroup } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmailBodyEditor } from "../shared/EmailBodyEditor";
import type { Campaign } from "../shared/types";

interface SenderOption {
  email: string;
  name: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
}

function SetupSection({
  title,
  complete,
  children,
}: {
  title: string;
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2.5">
        {complete ? (
          <TbCircleCheck className="shrink-0 text-emerald-500" size={22} />
        ) : (
          <TbCircleX className="shrink-0 text-red-400" size={22} />
        )}
        <h3 className="text-base font-bold text-stone-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function CampaignSetupTab({
  campaign,
  leadsTotal,
  onSaved,
  onOpenEnroll,
}: {
  campaign: Campaign;
  leadsTotal: number;
  onSaved: () => void;
  onOpenEnroll: () => void;
}) {
  const [senderOptions, setSenderOptions] = useState<SenderOption[]>([]);
  const [senderEmail, setSenderEmail] = useState(campaign.senderEmail || "");
  const [senderName, setSenderName] = useState(campaign.senderName || "");
  const [savingSender, setSavingSender] = useState(false);

  const [subject, setSubject] = useState(campaign.subject || "");
  const [savingSubject, setSavingSubject] = useState(false);

  const [body, setBody] = useState(campaign.body || "");
  const [savingBody, setSavingBody] = useState(false);

  useEffect(() => {
    apiFetch<SenderOption[]>("/campaigns/sender-options").then(setSenderOptions).catch(() => {});
  }, []);

  useEffect(() => {
    setSenderEmail(campaign.senderEmail || "");
    setSenderName(campaign.senderName || "");
    setSubject(campaign.subject || "");
    setBody(campaign.body || "");
  }, [campaign]);

  const patch = async (fields: Record<string, unknown>) => {
    await apiFetch(`/campaigns/${campaign.id}`, { method: "PUT", body: JSON.stringify(fields) });
    onSaved();
  };

  const senderDirty = senderEmail !== (campaign.senderEmail || "") || senderName !== (campaign.senderName || "");
  const subjectDirty = subject !== (campaign.subject || "");
  const bodyDirty = body !== (campaign.body || "");

  const pickSender = (email: string) => {
    setSenderEmail(email);
    const match = senderOptions.find((o) => o.email === email);
    if (match) setSenderName(match.name);
  };

  const handleSaveSender = async () => {
    setSavingSender(true);
    try {
      await patch({ senderEmail, senderName });
      toast.success("Sender saved");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSavingSender(false);
    }
  };

  const handleSaveSubject = async () => {
    setSavingSubject(true);
    try {
      await patch({ subject });
      toast.success("Subject saved");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSavingSubject(false);
    }
  };

  const handleSaveBody = async () => {
    setSavingBody(true);
    try {
      await patch({ body });
      toast.success("Email saved");
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSavingBody(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <SetupSection title="Sender" complete={!!senderEmail.trim() && !!senderName.trim()}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Sender Email</Label>
            <Select value={senderEmail} onValueChange={pickSender}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sender email" />
              </SelectTrigger>
              <SelectContent>
                {senderOptions.map((o) => (
                  <SelectItem key={o.email} value={o.email}>
                    {o.name} — {o.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-stone-400">Sent via your organization's verified domain — any assigned email works.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="setup-sender-name">Sender Name</Label>
            <Input
              id="setup-sender-name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Rhinon Team"
            />
          </div>
          {senderDirty && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveSender} disabled={savingSender}>
                {savingSender ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSenderEmail(campaign.senderEmail || "");
                  setSenderName(campaign.senderName || "");
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </SetupSection>

      <SetupSection title="Recipients" complete={leadsTotal > 0}>
        {leadsTotal > 0 ? (
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <TbUsers size={16} className="text-stone-400" />
              {leadsTotal} contact{leadsTotal === 1 ? "" : "s"} enrolled
            </p>
            <Button size="sm" variant="outline" onClick={onOpenEnroll}>
              <TbUsersGroup size={14} /> Manage
            </Button>
          </div>
        ) : (
          <button
            onClick={onOpenEnroll}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-stone-300 px-4 py-3 text-sm font-medium text-stone-500 hover:border-stone-400 hover:text-stone-700"
          >
            <TbUsersGroup size={16} /> Click to select recipients
          </button>
        )}
      </SetupSection>

      <SetupSection title="Subject" complete={!!subject.trim()}>
        <div className="space-y-2">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />
          <p className="text-xs text-stone-400">You can use variable: {"{{name}}"}</p>
          {subjectDirty && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSaveSubject} disabled={savingSubject}>
                {savingSubject ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSubject(campaign.subject || "")}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </SetupSection>

      <SetupSection title="Email" complete={!!stripHtml(body)}>
        <div className="space-y-2">
          <p className="text-xs text-stone-400">You can use variable: {"{{name}}"}</p>
          <EmailBodyEditor value={body} onChange={setBody} />
          {bodyDirty && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSaveBody} disabled={savingBody}>
                {savingBody ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setBody(campaign.body || "")}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </SetupSection>
    </div>
  );
}
