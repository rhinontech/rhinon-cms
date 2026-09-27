"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AtSign, Loader2, MoreHorizontal, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useSites } from "@/lib/sites";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Member {
  id: string;
  fullName: string;
  companyEmail: string;
  status: string;
}

interface Address {
  id: string;
  localPart: string;
  address: string;
  displayName: string | null;
  assignedUserId: string | null;
  assignee: Member | null;
}

const UNASSIGNED = "__none";
const LOCAL_PART = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;

/** The same local part on every brand's sending domain: hello@rhinontech.in, hello@uppercurve.in. */
function useBrandDomains(workspaceDomain: string) {
  const { sites } = useSites();
  return useMemo(() => {
    const seen = new Map<string, string[]>();
    for (const site of sites) {
      const domain = site.sendingDomain || workspaceDomain;
      if (!domain) continue;
      seen.set(domain, [...(seen.get(domain) ?? []), site.name]);
    }
    if (!seen.size && workspaceDomain) seen.set(workspaceDomain, []);
    return [...seen.entries()].map(([domain, brands]) => ({ domain, brands }));
  }, [sites, workspaceDomain]);
}

function AddressDialog({
  open,
  onOpenChange,
  domain,
  members,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  domain: string;
  members: Member[];
  editing: Address | null;
  onSaved: () => void;
}) {
  const [localPart, setLocalPart] = useState(editing?.localPart ?? "");
  const [displayName, setDisplayName] = useState(editing?.displayName ?? "");
  const [assignee, setAssignee] = useState(editing?.assignedUserId ?? UNASSIGNED);
  const [busy, setBusy] = useState(false);
  const brands = useBrandDomains(domain);

  const cleaned = localPart.trim().toLowerCase();
  const invalid = !editing && cleaned !== "" && !LOCAL_PART.test(cleaned);

  const save = async () => {
    if (!editing && !LOCAL_PART.test(cleaned)) return;
    setBusy(true);
    try {
      const body = {
        displayName: displayName.trim() || null,
        assignedUserId: assignee === UNASSIGNED ? null : assignee,
      };
      if (editing) {
        await apiFetch(`/mailbox-addresses/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
        toast.success(`${editing.address} updated`);
      } else {
        await apiFetch(`/mailbox-addresses`, { method: "POST", body: JSON.stringify({ ...body, localPart: cleaned }) });
        toast.success(`${cleaned}@${domain} created`);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.address}` : "New email address"}</DialogTitle>
          <DialogDescription>
            The person you assign sends and receives as this address, alongside their own — under every brand.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!editing ? (
            <div className="space-y-1.5">
              <Label htmlFor="addr-local">Address</Label>
              <div className="flex items-center rounded-md border border-input focus-within:ring-2 focus-within:ring-ring/50">
                <Input
                  id="addr-local"
                  autoFocus
                  value={localPart}
                  onChange={(e) => setLocalPart(e.target.value.replace(/\s/g, ""))}
                  placeholder="hello"
                  className="border-0 shadow-none focus-visible:ring-0"
                  aria-invalid={invalid}
                />
                <span className="shrink-0 pr-3 text-sm text-muted-foreground">@{domain}</span>
              </div>
              {invalid ? (
                <p className="text-[12px] text-destructive">Letters, numbers, dots, hyphens or underscores only.</p>
              ) : cleaned && brands.length > 1 ? (
                <p className="text-[12px] text-muted-foreground">
                  Also works as {brands.filter((b) => b.domain !== domain).map((b) => `${cleaned}@${b.domain}`).join(", ")}.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="addr-name">Sender name</Label>
            <Input id="addr-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Rhinon Support" maxLength={120} />
            <p className="text-[12px] text-muted-foreground">What recipients see. Leave empty to use the assignee&apos;s own name.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Assigned to</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Nobody yet</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.fullName} <span className="text-muted-foreground">· {m.companyEmail}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editing?.assignedUserId && assignee !== editing.assignedUserId ? (
              <p className="text-[12px] text-amber-600 dark:text-amber-400">
                Its mail history moves with it — the new owner sees everything sent to this address.
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || (!editing && !LOCAL_PART.test(cleaned))}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {editing ? "Save" : "Create address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EmailAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [domain, setDomain] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; editing: Address | null }>({ open: false, editing: null });
  const [toDelete, setToDelete] = useState<Address | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const brands = useBrandDomains(domain);

  const load = useCallback(async () => {
    try {
      const [list, people] = await Promise.all([
        apiFetch<{ domain: string; addresses: Address[] }>("/mailbox-addresses"),
        apiFetch<Member[]>("/employees"),
      ]);
      setAddresses(list.addresses);
      setDomain(list.domain);
      setMembers(people.filter((p) => p.status !== "inactive" && p.companyEmail).sort((a, b) => a.fullName.localeCompare(b.fullName)));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load addresses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reassign = async (row: Address, userId: string) => {
    setBusyId(row.id);
    try {
      await apiFetch(`/mailbox-addresses/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ assignedUserId: userId === UNASSIGNED ? null : userId }),
      });
      const who = members.find((m) => m.id === userId)?.fullName;
      toast.success(who ? `${row.address} → ${who}` : `${row.address} unassigned`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reassign");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await apiFetch(`/mailbox-addresses/${toDelete.id}`, { method: "DELETE" });
      toast.success(`${toDelete.address} removed`);
      setToDelete(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove");
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="sticky top-0 z-10 glass-header flex min-h-16 flex-wrap items-center justify-between gap-2.5 border-b border-border px-3 py-2.5 sm:px-5 sm:py-0">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold tracking-tight sm:text-base">Email addresses</h1>
          <p className="text-[12px] text-muted-foreground">Shared addresses like hello@ or support@, each owned by one person.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setDialog({ open: true, editing: null })} disabled={!domain}>
          <Plus className="size-4" /> New address
        </Button>
      </div>

      <div className="mx-auto w-full max-w-5xl space-y-5 p-3 sm:p-5">
        {brands.length > 1 ? (
          <div className="glass-card rounded-2xl p-4 text-[13px] text-muted-foreground">
            <p>
              One address works under every brand. <span className="font-medium text-foreground">hello</span> sends as{" "}
              {brands.map((b, i) => (
                <span key={b.domain}>
                  {i > 0 ? (i === brands.length - 1 ? " or " : ", ") : ""}
                  <span className="font-mono text-foreground">hello@{b.domain}</span>
                  {b.brands.length ? ` (${b.brands.join(", ")})` : ""}
                </span>
              ))}
              , depending on the brand the person is working in — and mail to any of them lands in the same inbox.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">{error}</div>
        ) : (
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Address</TableHead>
                    <TableHead>Sender name</TableHead>
                    <TableHead>Assigned to</TableHead>
                    <TableHead className="pr-5 text-right"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-5"><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-56" /></TableCell>
                        <TableCell />
                      </TableRow>
                    ))
                  ) : addresses.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4} className="py-14 text-center">
                        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground"><AtSign className="size-5" /></span>
                        <p className="mt-4 text-[15px] font-semibold">No shared addresses yet</p>
                        <p className="mx-auto mt-1 max-w-sm text-[13px] text-muted-foreground">
                          Create hello@ or support@ and hand it to someone. They&apos;ll be able to send from it and receive its mail in their Inbox.
                        </p>
                        <Button size="sm" className="mt-5 gap-1.5" onClick={() => setDialog({ open: true, editing: null })} disabled={!domain}>
                          <Plus className="size-4" /> New address
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    addresses.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="pl-5">
                          <p className="font-mono text-[13.5px] font-medium">{row.address}</p>
                          {brands.length > 1 ? (
                            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                              also {brands.filter((b) => b.domain !== domain).map((b) => `${row.localPart}@${b.domain}`).join(", ")}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-[13px]">
                          {row.displayName || <span className="text-muted-foreground">Assignee&apos;s name</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select value={row.assignedUserId ?? UNASSIGNED} onValueChange={(v) => reassign(row, v)} disabled={busyId === row.id}>
                              <SelectTrigger className="h-8 w-60" aria-label={`Who owns ${row.address}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={UNASSIGNED}>
                                  <span className="text-muted-foreground">Nobody</span>
                                </SelectItem>
                                {members.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    <span className="flex items-center gap-2"><UserRound className="size-3.5 text-muted-foreground" /> {m.fullName}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {busyId === row.id ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
                            {!row.assignedUserId ? <Badge variant="secondary" className="text-[11px]">Mail goes unread</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8" aria-label={`More actions for ${row.address}`}>
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDialog({ open: true, editing: row })}>
                                <Pencil className="size-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(row)}>
                                <Trash2 className="size-4" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {dialog.open ? (
        <AddressDialog
          key={dialog.editing?.id ?? "new"}
          open
          onOpenChange={(v) => !v && setDialog({ open: false, editing: null })}
          domain={domain}
          members={members}
          editing={dialog.editing}
          onSaved={load}
        />
      ) : null}

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {toDelete?.address}?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.assignee ? `${toDelete.assignee.fullName} will no longer be able to send from it or see its mail. ` : ""}
              Mail already received is kept, and comes back if you create the address again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={remove}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
