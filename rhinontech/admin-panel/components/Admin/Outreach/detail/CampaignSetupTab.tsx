"use client";

import { useEffect, useState } from "react";
import { TbCircleCheck, TbCircleX, TbUsers, TbUsersGroup } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmailBodyEditor } from "../shared/EmailBodyEditor";
import type { Campaign } from "../shared/types";

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
    <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="mb-3.5 sm:mb-4 flex items-center gap-2.5">
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
  const senderEmail = campaign.senderEmail || "";
  const senderName = campaign.senderName || "";

  const [subject, setSubject] = useState(campaign.subject || "");
  const [savingSubject, setSavingSubject] = useState(false);

  const [body, setBody] = useState(campaign.body || "");
  const [savingBody, setSavingBody] = useState(false);

  useEffect(() => {
    setSubject(campaign.subject || "");
    setBody(campaign.body || "");
  }, [campaign]);

  const patch = async (fields: Record<string, unknown>) => {
    await apiFetch(`/campaigns/${campaign.id}`, { method: "PUT", body: JSON.stringify(fields) });
    onSaved();
  };

  const subjectDirty = subject !== (campaign.subject || "");
  const bodyDirty = body !== (campaign.body || "");

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
    <div className="mx-auto space-y-3 sm:space-y-4">
      <SetupSection title="Sender" complete={!!senderEmail.trim() && !!senderName.trim()}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label>Sender Name</Label>
            <Input value={senderName || "—"} disabled className="bg-stone-50/80 font-medium text-stone-800" />
          </div>
          <div className="space-y-1.5">
            <Label>Sender Email</Label>
            <Input value={senderEmail || "—"} disabled className="bg-stone-50/80 font-medium text-stone-800" />
          </div>
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
