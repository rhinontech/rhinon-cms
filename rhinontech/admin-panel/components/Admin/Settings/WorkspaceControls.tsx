"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";
import { usePermissions } from "@/context/PermissionsContext";
import { MODULES, NAV_SECTIONS } from "@/components/Admin/Common/navConfig";
import { SettingsCard } from "@/components/Admin/Settings/parts";

/**
 * Switch off the modules this workspace doesn't use. A sales team shouldn't
 * have to look past Payroll and Attendance. Hidden modules leave the sidebar,
 * Home and search; roles still decide who may open what.
 */
export function ModuleSwitches() {
  const { account, refresh } = usePermissions();
  const [off, setOff] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => setOff(account.organization?.disabledModules ?? []), [account.organization?.disabledModules]);

  const save = async (next: string[]) => {
    setOff(next);
    setSaving(true);
    try {
      await apiFetch("/workspace/modules", { method: "PUT", body: JSON.stringify({ disabledModules: next }) });
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
      setOff(account.organization?.disabledModules ?? []);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsCard title="Modules" description="Turn off what your team doesn't use. It disappears from the menu, Home and search for everyone; you can turn it back on any time.">
      <div className="grid gap-4 sm:grid-cols-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.key}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.label}</p>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm">{MODULES[item.key].label}</span>
                  <Switch
                    checked={!off.includes(item.key)}
                    disabled={saving}
                    onCheckedChange={(on) => save(on ? off.filter((k) => k !== item.key) : [...off, item.key])}
                    aria-label={`${MODULES[item.key].label} on or off`}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

interface Member { id: string; fullName: string; status: string; roleSlug?: string; role?: { slug: string } }

/** Hand the workspace to someone else. One owner per workspace: they become owner, you become Admin. */
export function TransferOwnership() {
  const [people, setPeople] = useState<Member[]>([]);
  const [to, setTo] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch<Member[]>("/people").then((list) => setPeople(list.filter((p) => p.status === "active" && (p.role?.slug ?? p.roleSlug) !== "superadmin"))).catch(() => setPeople([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await apiFetch<{ message: string }>("/workspace/transfer-ownership", { method: "POST", body: JSON.stringify({ userId: to, password }) });
      toast.success(r.message);
      setPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not transfer ownership");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsCard title="Transfer ownership" description="Give this workspace to another member. They become the owner; you become an Admin.">
      <form onSubmit={submit} className="grid gap-3 sm:max-w-md">
        <div className="grid gap-1.5">
          <Label htmlFor="new-owner">New owner</Label>
          <NativeSelect id="new-owner" value={to} onChange={(e) => setTo(e.target.value)} required className="rounded-md border border-input bg-transparent px-3 py-2 text-sm">
            <option value="">Choose a member…</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="owner-password">Your password</Label>
          <Input id="owner-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <div><Button type="submit" variant="outline" disabled={busy || !to || !password}>{busy ? "Transferring…" : "Transfer ownership"}</Button></div>
      </form>
    </SettingsCard>
  );
}
