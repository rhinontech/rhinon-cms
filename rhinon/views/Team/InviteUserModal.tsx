"use client";

import { useState } from "react";
import { Link, Copy, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { dummyRoles } from "@/lib/dummy-data";

export function InviteUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"form" | "link">("form");
  const [copied, setCopied] = useState(false);

  const inviteLink = "https://app.rhinon.tech/invite/x78f92ma";

  const handleGenerate = () => setStep("link");
  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) setTimeout(() => setStep("form"), 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">Invite New User</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Generate a secure invite link to add a new member to Core Ops.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === "form" ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input
                  placeholder="colleague@company.com"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Assign Role</label>
                <Select defaultValue="role_sdr">
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {dummyRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="text-foreground">
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center py-4 animate-in zoom-in-95">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={22} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Invite Link Generated</h3>
                <p className="text-sm text-muted-foreground mt-1">Copy the link below and share it securely.</p>
              </div>

              <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg p-1.5 max-w-sm mx-auto">
                <div className="bg-background text-muted-foreground p-2 rounded flex-1 truncate text-sm flex items-center gap-2">
                  <Link size={13} className="shrink-0" />
                  <span className="truncate">{inviteLink}</span>
                </div>
                <Button
                  size="sm"
                  className={
                    copied
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "bg-card hover:bg-secondary border border-border text-foreground"
                  }
                  onClick={handleCopy}
                >
                  {copied ? "Copied!" : <><Copy size={13} className="mr-1.5" /> Copy</>}
                </Button>
              </div>
            </div>
          )}
        </div>

        {step === "form" && (
          <DialogFooter className="border-t border-border pt-4">
            <Button variant="ghost" onClick={() => handleClose(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button onClick={handleGenerate} className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">
              Generate Link
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
