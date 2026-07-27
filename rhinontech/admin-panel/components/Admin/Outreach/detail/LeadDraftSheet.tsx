"use client";

import { useEffect, useState } from "react";
import { TbCheck, TbLoader } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EmailBodyEditor } from "../shared/EmailBodyEditor";
import type { CampaignLead } from "../shared/types";

/** View & edit a lead's mail-merged draft before it goes out. Subject is set at the campaign level. */
export function LeadDraftSheet({
  lead,
  onOpenChange,
  onSaved,
}: {
  lead: CampaignLead | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: CampaignLead) => void;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) setBody(lead.aiDraft || "");
  }, [lead]);

  if (!lead) return null;

  const dirty = body !== (lead.aiDraft || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/leads/${lead.id}`, {
        method: "PUT",
        body: JSON.stringify({ aiDraft: body }),
      });
      toast.success("Draft updated");
      onSaved({ ...lead, aiDraft: body });
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
          <div className="flex min-h-0 flex-1 flex-col space-y-1.5">
            <Label>Email Body</Label>
            <EmailBodyEditor value={body} onChange={setBody} minHeight="280px" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? <TbLoader className="animate-spin" size={14} /> : <TbCheck size={14} />}
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
