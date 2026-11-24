"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { apiFetch } from "@/lib/api";

interface RoleOption { id: string; name: string; slug: string }

/**
 * Invite someone with just a name, an email and a role.
 *
 * Adding a person used to mean the full HR form (department, joining date,
 * mailbox prefix, offer letter). That still exists for HR; this is for the
 * owner who just wants a colleague in. The API defaults the HR fields and
 * picks a free company address, and the person gets the usual setup email.
 */
export function InviteDialog({ open, onClose, roles, onInvited }: { open: boolean; onClose: () => void; roles: RoleOption[]; onInvited: () => void }) {
  // The owner role is one per workspace and guests use the client portal, so neither is offered.
  const options = roles.filter((r) => r.slug !== "superadmin" && r.slug !== "collaborator");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [sending, setSending] = useState(false);
  const chosen = roleId || options.find((r) => r.slug === "employee")?.id || options[0]?.id || "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const created = await apiFetch<{ companyEmail?: string }>("/employees", {
        method: "POST",
        body: JSON.stringify({ fullName: name.trim(), personalEmail: email.trim(), roleId: chosen }),
      });
      toast.success(created?.companyEmail ? `Invite sent. Their address is ${created.companyEmail}.` : "Invite sent.");
      setName(""); setEmail(""); setRoleId("");
      onInvited();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the invite");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a teammate</DialogTitle>
          <DialogDescription>They get an email to set their password. You can add HR details later from their profile.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3" id="invite-form">
          <div className="grid gap-1.5">
            <Label htmlFor="invite-name">Name</Label>
            <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="invite-email">Their email</Label>
            <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@gmail.com" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <NativeSelect id="invite-role" value={chosen} onChange={(e) => setRoleId(e.target.value)} className="rounded-md border border-input bg-transparent px-3 py-2 text-sm">
              {options.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">Decides what they can see. Change a role's access in Settings → Roles & Permissions.</p>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button type="submit" form="invite-form" disabled={sending || !chosen}>{sending ? "Sending…" : "Send invite"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
