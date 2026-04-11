"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { User } from "@/lib/types";

interface AssignedEmail {
  _id: string;
  email: string;
  displayName: string;
  type: "primary" | "secondary";
}

interface ManageEmailsModalProps {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageEmailsModal({ user, isOpen, onOpenChange }: ManageEmailsModalProps) {
  const [emails, setEmails] = useState<AssignedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");

  const fetchEmails = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/emails`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load emails");

      // Include primary email at the top (it may not be in the userId-scoped list)
      const secondaryList: AssignedEmail[] = Array.isArray(data.emails) ? data.emails : [];
      const hasPrimary = secondaryList.some((e) => e.type === "primary");

      if (!hasPrimary && user.email) {
        setEmails([
          { _id: "primary", email: user.email, displayName: user.name, type: "primary" },
          ...secondaryList,
        ]);
      } else {
        setEmails(secondaryList);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchEmails();
      setNewEmail("");
      setNewDisplayName("");
    }
  }, [isOpen, user?.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newEmail || !newDisplayName) {
      toast.error("Please fill in both fields");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, displayName: newDisplayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add email");

      toast.success("Secondary email added");
      setNewEmail("");
      setNewDisplayName("");
      await fetchEmails();
    } catch (error: any) {
      toast.error(error.message || "Failed to add email");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (identity: AssignedEmail) => {
    if (identity.type === "primary") return;
    if (!window.confirm(`Remove ${identity.email} from ${user?.name}?`)) return;

    setRemovingId(identity._id);
    try {
      const res = await fetch(`/api/admin/outreach-identities/${identity._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove email");

      toast.success("Email removed");
      await fetchEmails();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove email");
    } finally {
      setRemovingId(null);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={18} className="text-cyan-500" />
            Manage Emails — {user.name}
          </DialogTitle>
          <DialogDescription>
            View and manage outreach email identities assigned to this user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Assigned Emails List */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Assigned Emails</p>

            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : emails.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 text-center">No emails assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {emails.map((identity) => (
                  <div
                    key={identity._id}
                    className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Mail size={15} className={identity.type === "primary" ? "text-cyan-500 shrink-0" : "text-muted-foreground shrink-0"} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{identity.email}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{identity.displayName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {identity.type === "primary" ? (
                        <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-500 bg-cyan-500/5 flex items-center gap-1">
                          <ShieldCheck size={10} /> Primary
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                          onClick={() => handleRemove(identity)}
                          disabled={removingId === identity._id}
                        >
                          {removingId === identity._id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Secondary Email Form */}
          <form onSubmit={handleAdd} className="space-y-3 border-t border-border pt-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Add Secondary Email</p>

            <div className="space-y-2">
              <Label htmlFor="newDisplayName">Display Name</Label>
              <Input
                id="newDisplayName"
                placeholder="e.g. Sales Outreach"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newEmail">Email Address</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="outreach@rhinonlabs.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <Button
              type="submit"
              disabled={adding}
              className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold"
            >
              {adding ? (
                <Loader2 size={15} className="animate-spin mr-2" />
              ) : (
                <Plus size={15} className="mr-2" />
              )}
              Add Email
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
