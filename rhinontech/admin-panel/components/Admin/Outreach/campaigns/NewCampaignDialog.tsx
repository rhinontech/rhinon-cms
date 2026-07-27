"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TbLoader } from "react-icons/tb";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Campaign } from "../shared/types";

/**
 * Creates a bare Draft campaign immediately, then routes to its detail page
 * where Sender/Recipients/Subject/Email are filled in independently — no
 * multi-step wizard, nothing is lost if you leave partway through.
 */
export function NewCampaignDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];

  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"Email" | "Cold Email">("Email");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const campaign = await apiFetch<Campaign>("/campaigns", {
        method: "POST",
        body: JSON.stringify({ name, channel }),
      });
      onOpenChange(false);
      setName("");
      router.push(`/${roleSlug}/outreach/campaigns/${campaign.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>New Email Campaign</DialogTitle>
            <DialogDescription>Give it a name — you'll fill in the sender, recipients, and email content next.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-campaign-name">Campaign Name</Label>
              <Input
                id="new-campaign-name"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q4 Founder Outreach"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Cold Email">Cold Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={creating}>
              {creating ? (
                <>
                  <TbLoader className="animate-spin" size={14} /> Creating...
                </>
              ) : (
                "Create Campaign"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
