"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddIdentityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type UserOption = {
  _id: string;
  name: string;
  email: string;
};

export function AddIdentityModal({ isOpen, onOpenChange, onSuccess }: AddIdentityModalProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setUsers(data.users.map((u: any) => ({ _id: u._id, name: u.name, email: u.email })));
        }
      } catch {
        // non-critical — user assignment is optional
      }
    };
    fetchUsers();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !displayName) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/outreach-identities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          ...(assignedUserId ? { userId: assignedUserId } : {}),
        }),
      });

      if (res.ok) {
        toast.success("Outreach identity added successfully");
        setEmail("");
        setDisplayName("");
        setAssignedUserId("");
        onSuccess();
        onOpenChange(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add identity");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Add Outreach Identity</DialogTitle>
          <DialogDescription>
            Create a secondary outreach email. Optionally assign it to a specific user.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="e.g. Sales Support"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="outreach@rhinonlabs.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          {users.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="assignedUser">Assign to User <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                <SelectTrigger id="assignedUser" className="bg-secondary border-border">
                  <SelectValue placeholder="No assignment (shared pool)" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="">No assignment (shared pool)</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-cyan-500 hover:bg-cyan-600 font-bold"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Mail size={16} className="mr-2" />}
              Create Identity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
