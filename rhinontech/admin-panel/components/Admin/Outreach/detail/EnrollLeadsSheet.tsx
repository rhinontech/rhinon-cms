"use client";

import { useState } from "react";
import { TbLoader } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LeadPicker } from "../shared/LeadPicker";
import { GroupPicker } from "../contacts/GroupPicker";

export function EnrollLeadsSheet({
  campaignId,
  open,
  onOpenChange,
  onEnrolled,
}: {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnrolled: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (selectedIds.size === 0) return;
    setEnrolling(true);
    try {
      await apiFetch(`/campaigns/${campaignId}/enroll`, {
        method: "POST",
        body: JSON.stringify({ leadIds: Array.from(selectedIds) }),
      });
      toast.success(`${selectedIds.size} lead${selectedIds.size > 1 ? "s" : ""} enrolled`);
      setSelectedIds(new Set());
      onOpenChange(false);
      onEnrolled();
    } catch (err: any) {
      toast.error("Enrollment failed: " + err.message);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>Enroll Leads</SheetTitle>
          <SheetDescription>Pick leads from your CRM to add to this campaign.</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <Tabs defaultValue="leads" className="flex min-h-0 flex-1 flex-col gap-3">
            <TabsList>
              <TabsTrigger value="leads">Pick Leads</TabsTrigger>
              <TabsTrigger value="group">Pick Group</TabsTrigger>
            </TabsList>
            <TabsContent value="leads" className="flex min-h-0 flex-1 flex-col">
              <LeadPicker selectedIds={selectedIds} onChange={setSelectedIds} />
            </TabsContent>
            <TabsContent value="group" className="flex min-h-0 flex-1 flex-col">
              <GroupPicker selectedIds={selectedIds} onChange={setSelectedIds} />
            </TabsContent>
          </Tabs>
          <div className="flex justify-end border-t pt-4">
            <Button onClick={handleEnroll} disabled={enrolling || selectedIds.size === 0}>
              {enrolling ? (
                <>
                  <TbLoader className="animate-spin" size={14} /> Enrolling...
                </>
              ) : (
                `Enroll ${selectedIds.size || ""} Lead${selectedIds.size === 1 ? "" : "s"}`
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
