"use client";

import { useEffect, useState } from "react";
import { TbCheck, TbLoader, TbSparkles } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CampaignLead } from "../shared/types";

/** View & edit a lead's drafted email before approving/sending. */
export function LeadDraftSheet({
  lead,
  isAgent,
  onOpenChange,
  onSaved,
  onApproveToggle,
  onRedraft,
}: {
  lead: CampaignLead | null;
  isAgent: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: CampaignLead) => void;
  onApproveToggle: (lead: CampaignLead) => void;
  onRedraft: (lead: CampaignLead) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setSubject(lead.draftSubject || "");
      setBody(lead.aiDraft || "");
    }
  }, [lead]);

  if (!lead) return null;

  const dirty = subject !== (lead.draftSubject || "") || body !== (lead.aiDraft || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/leads/${lead.id}`, {
        method: "PUT",
        body: JSON.stringify({ draftSubject: subject, aiDraft: body }),
      });
      toast.success("Draft updated");
      onSaved({ ...lead, draftSubject: subject, aiDraft: body });
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={!!lead} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>Draft for {lead.name}</SheetTitle>
          <SheetDescription>
            {lead.company} · {lead.email}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
          <div className="space-y-1.5">
            <Label htmlFor="draft-subject">Subject</Label>
            <Input id="draft-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col space-y-1.5">
            <Label htmlFor="draft-body">Email Body</Label>
            <Textarea
              id="draft-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-64 flex-1 resize-none font-mono text-xs leading-relaxed"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t p-4">
          {isAgent ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onRedraft(lead)}>
                <TbSparkles size={14} /> Re-draft
              </Button>
              <Button
                variant={lead.draftApproved ? "secondary" : "outline"}
                size="sm"
                disabled={!lead.aiDraft}
                onClick={() => onApproveToggle(lead)}
              >
                <TbCheck size={14} /> {lead.draftApproved ? "Approved ✓" : "Approve"}
              </Button>
            </div>
          ) : (
            <span />
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? <TbLoader className="animate-spin" size={14} /> : <TbCheck size={14} />}
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
