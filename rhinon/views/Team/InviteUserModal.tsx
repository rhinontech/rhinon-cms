"use client";

import { useState } from "react";
import { Link, Copy, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dummyRoles } from "@/lib/dummy-data";

export function InviteUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"form" | "link">("form");
  const [copied, setCopied] = useState(false);

  // Fake invite link
  const inviteLink = "https://app.rhinon.tech/invite/x78f92ma";

  const handleGenerate = () => {
    setStep("link");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => setStep("form"), 500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium">
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-slate-950 border-slate-800 text-slate-200">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription className="text-slate-400">
            Generate a secure invite link to add a new member to Core Ops.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === "form" ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <Input placeholder="colleague@company.com" className="bg-slate-900 border-slate-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Assign Role</label>
                <Select defaultValue="role_sdr">
                  <SelectTrigger className="bg-slate-900 border-slate-800">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    {dummyRoles.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center py-4 animate-in zoom-in-95">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-200">Invite Link Generated</h3>
                <p className="text-sm text-slate-400 mt-1">Copy the link below and share it securely.</p>
              </div>

              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-1 max-w-sm mx-auto">
                <div className="bg-slate-950 text-slate-400 p-2 rounded flex-1 truncate text-sm flex items-center gap-2">
                  <Link size={14} className="min-w-[14px]" />
                  <span className="truncate">{inviteLink}</span>
                </div>
                <Button
                  size="sm"
                  className={copied ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950" : "bg-slate-800 hover:bg-slate-700 text-slate-200"}
                  onClick={handleCopy}
                >
                  {copied ? "Copied!" : <><Copy size={14} className="mr-2" /> Copy</>}
                </Button>
              </div>
            </div>
          )}
        </div>

        {step === "form" && (
          <DialogFooter className="border-t border-slate-800 pt-4">
            <Button variant="ghost" onClick={() => handleClose(false)} className="text-slate-400 hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleGenerate} className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium">
              Generate Link
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
