"use client";

import { useState } from "react";
import { Link, Copy, CheckCircle2, Loader2, Sparkles, Mail } from "lucide-react";
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
import { toast } from "sonner";

export function InviteUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"form" | "loading" | "success">("form");
  const [copied, setCopied] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [prefix, setPrefix] = useState("");
  const [roleId, setRoleId] = useState("role_sdr");
  const [invitationLink, setInvitationLink] = useState("");

  const domain = "rhinonlabs.com";
  const workEmail = prefix ? `${prefix}@${domain}` : `... @${domain}`;

  const handleInvite = async () => {
    if (!name || !personalEmail || !prefix) {
      toast.error("Please fill in all fields");
      return;
    }

    setStep("loading");
    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, personalEmail, workEmailPrefix: prefix, roleId }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Invitation sent successfully!");
        setInvitationLink(`${window.location.origin}/login?email=${encodeURIComponent(workEmail)}`);
        setStep("success");
      } else {
        toast.error(data.error || "Failed to send invitation");
        setStep("form");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      setStep("form");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setStep("form");
        setName("");
        setPersonalEmail("");
        setPrefix("");
      }, 500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold flex items-center gap-2">
          <Mail size={16} />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">Invite New User</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Send an invitation link to your team member.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === "form" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground ml-1">Full Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground ml-1">Personal Email (to send link)</label>
                <Input
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  placeholder="user@personal.com"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-medium text-foreground">Work Email Prefix</label>
                  <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider">{prefix}@rhinonlabs.com</span>
                </div>
                <div className="relative">
                  <Input
                    placeholder="john.doe"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-28"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 text-xs font-medium pointer-events-none">
                    @rhinonlabs.com
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Assign Role</label>
                <Select value={roleId} onValueChange={(val) => val && setRoleId(val)}>
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
          )}

          {step === "loading" && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
              <p className="text-sm text-muted-foreground">Configuring SES and sending invitation...</p>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-6 text-center py-4 animate-in zoom-in-95">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={22} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Invitation Sent!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Credentials have been sent to <strong>{workEmail}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg p-1.5 max-w-sm mx-auto">
                <div className="bg-background text-muted-foreground p-2 rounded flex-1 truncate text-sm flex items-center gap-2">
                  <Link size={13} className="shrink-0" />
                  <span className="truncate">{invitationLink}</span>
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
            <Button onClick={handleInvite} className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">
              Invite & Create Account
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
