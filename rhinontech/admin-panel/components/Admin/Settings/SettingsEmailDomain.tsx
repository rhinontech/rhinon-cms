"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { TbAlertTriangle, TbCircleCheck, TbClockHour4, TbPlus, TbRefresh, TbTrash } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import type { Site } from "@/lib/sites";
import { CopyButton, LoadingRows, Notice, Pill, SettingsCard, SettingsFrame, Spinner } from "@/components/Admin/Settings/parts";

interface DnsRecord {
  type: "CNAME" | "MX" | "TXT";
  name: string;
  value: string;
  priority?: number;
  purpose: string;
  optional?: boolean;
}

interface DomainItem {
  domain: string;
  status: "pending" | "verified" | "failed";
  siteId: string | null;
  records: DnsRecord[];
  message: string;
}

interface DomainView {
  domains: DomainItem[];
  /** Null = unlimited (the platform workspace). */
  limit: number | null;
  canAddMore: boolean;
}

const NEW_BRAND = "__new__";
const POLL_MS = 30_000;

function RecordsTable({ records }: { records: DnsRecord[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead className="glass-thead text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Name / host</th>
            <th className="px-3 py-2 font-medium">Value</th>
            <th className="px-3 py-2 font-medium">What it does</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border align-top">
          {records.map((r, i) => (
            <tr key={`${r.type}-${r.name}-${i}`} data-testid="dns-record">
              <td className="px-3 py-2.5">
                <span className="font-mono font-semibold">{r.type}</span>
                {r.priority !== undefined && <div className="text-muted-foreground">{`priority ${r.priority}`}</div>}
                {r.optional && <div className="mt-1"><Pill tone="gray">Optional</Pill></div>}
              </td>
              <td className="px-3 py-2.5">
                <div className="break-all font-mono">{r.name}</div>
                <CopyButton text={r.name} label="Copy" className="mt-1.5" />
              </td>
              <td className="px-3 py-2.5">
                <div className="break-all font-mono">{r.value}</div>
                <CopyButton text={r.value} label="Copy" className="mt-1.5" />
              </td>
              <td className="max-w-xs px-3 py-2.5 leading-relaxed text-muted-foreground">{r.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SettingsEmailDomain() {
  const confirm = useConfirm();
  const pathname = usePathname();
  const { isOwner, account } = usePermissions();
  const isPlatform = !!account.organization?.isPlatform;

  const [view, setView] = useState<DomainView | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const [domain, setDomain] = useState("");
  const [siteChoice, setSiteChoice] = useState<string>("");
  const [brandName, setBrandName] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setChecking(true);
    try {
      setView(await apiFetch<DomainView>("/email-domain"));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your email domains");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
    apiFetch<Site[]>("/sites").then(setSites).catch(() => setSites([]));
  }, [load]);

  // While DNS is propagating, keep asking: the GET re-checks with the email provider.
  const anyPending = !!view?.domains.some((d) => d.status === "pending");
  useEffect(() => {
    if (!anyPending) return;
    const timer = setInterval(() => void load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [anyPending, load]);

  const siteName = useMemo(() => new Map(sites.map((s) => [s.id, s.name])), [sites]);

  // A brand can send from one domain, so only brands without one are offered.
  const freeBrands = useMemo(
    () => sites.filter((s) => !s.sendingDomain && !view?.domains.some((d) => d.siteId === s.id)),
    [sites, view]
  );
  // Non-platform workspaces have a single brand; the choice only exists for a workspace running several.
  const choosesBrand = isPlatform;
  useEffect(() => {
    if (!choosesBrand) return;
    if (!siteChoice || (siteChoice !== NEW_BRAND && !freeBrands.some((s) => s.id === siteChoice))) {
      setSiteChoice(freeBrands[0]?.id ?? NEW_BRAND);
    }
  }, [choosesBrand, freeBrands, siteChoice]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const body: Record<string, string> = { domain: domain.trim() };
      if (choosesBrand) {
        if (siteChoice === NEW_BRAND) body.brandName = brandName.trim();
        else body.siteId = siteChoice;
      }
      const next = await apiFetch<DomainView>("/email-domain", { method: "POST", body: JSON.stringify(body) });
      setView(next);
      setDomain("");
      setBrandName("");
      toast.success("Domain added. Publish the DNS records below to finish.");
      // A brand created alongside should show up by name straight away.
      apiFetch<Site[]>("/sites").then(setSites).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add that domain");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (item: DomainItem) => {
    const ok = await confirm({
      title: `Remove ${item.domain}?`,
      description:
        item.status === "verified"
          ? "Mail will go back to being sent from your workspace address. You can add the domain again later."
          : "The pending verification is cancelled. You can add the domain again later.",
      confirmLabel: "Remove domain",
      destructive: true,
    });
    if (!ok) return;
    setRemoving(item.domain);
    try {
      setView(await apiFetch<DomainView>(`/email-domain/${encodeURIComponent(item.domain)}`, { method: "DELETE" }));
      toast.success(`${item.domain} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove the domain");
    } finally {
      setRemoving(null);
    }
  };

  const billingHref = `/${pathname.split("/")[1]}/settings/billing`;
  const noPlanAccess = view?.limit === 0;
  const canSubmit =
    domain.trim().length > 3 && (!choosesBrand || siteChoice !== NEW_BRAND || brandName.trim().length > 1) && !adding;

  return (
    <SettingsFrame
      title="Email domain"
      description="Send from your own domain, like you@yourcompany.com"
      actions={
        view && view.domains.length > 0 ? (
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={checking} data-testid="check-status">
            {checking ? <Spinner /> : <TbRefresh />} Check status
          </Button>
        ) : undefined
      }
    >
      {error && <Notice tone="danger">{error}</Notice>}
      {!view && !error && <LoadingRows rows={3} />}

      {view && noPlanAccess && (
        <Notice tone="info" testId="domain-needs-upgrade">
          Sending from your own domain is included on paid plans. Until then your team sends from{" "}
          <strong>{account.organization?.emailDomain}</strong>.{" "}
          <Link href={billingHref} className="font-medium underline underline-offset-2">See plans</Link>
        </Notice>
      )}

      {view && view.domains.length === 0 && !noPlanAccess && (
        <Notice tone="info">
          {`Your team currently sends from ${account.organization?.emailDomain ?? "your workspace address"}. Add your own domain and every address will switch to it, like sam@yourcompany.com.`}
        </Notice>
      )}

      {view?.domains.map((item) => (
        <SettingsCard
          key={item.domain}
          testId={`domain-${item.domain}`}
          title={item.domain}
          description={
            choosesBrand && item.siteId ? (
              <>
                Sends for the brand <strong>{siteName.get(item.siteId) ?? "—"}</strong>
              </>
            ) : undefined
          }
          actions={
            <div className="flex items-center gap-2">
              {item.status === "verified" && <Pill tone="green" testId="status-verified"><TbCircleCheck size={13} /> Verified</Pill>}
              {item.status === "pending" && <Pill tone="amber" testId="status-pending"><TbClockHour4 size={13} /> Waiting for DNS</Pill>}
              {item.status === "failed" && <Pill tone="red" testId="status-failed"><TbAlertTriangle size={13} /> Verification failed</Pill>}
              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-red-600 hover:text-red-700 dark:text-red-300"
                  onClick={() => void remove(item)}
                  disabled={removing === item.domain}
                  data-testid={`remove-${item.domain}`}
                >
                  <TbTrash /> Remove
                </Button>
              )}
            </div>
          }
        >
          <p className="mb-3 text-sm text-muted-foreground">{item.message}</p>
          {item.status !== "verified" && (
            <>
              <RecordsTable records={item.records} />
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Some DNS providers want only the part before your domain — for <span className="font-mono">abc._domainkey.acme.com</span>, enter{" "}
                <span className="font-mono">abc._domainkey</span>. Changes can take up to an hour to be seen. This page checks automatically.
              </p>
            </>
          )}
          {item.status === "verified" && item.records.some((r) => r.type === "MX") && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none font-medium text-foreground/80">Receiving replies in your inbox (optional)</summary>
              <div className="mt-3"><RecordsTable records={item.records.filter((r) => r.optional)} /></div>
            </details>
          )}
        </SettingsCard>
      ))}

      {view && !noPlanAccess && isOwner && (
        <SettingsCard
          title={view.domains.length ? "Add another domain" : "Add your domain"}
          description={
            view.limit === null
              ? "Each domain belongs to one brand."
              : view.canAddMore
                ? "Your plan includes one custom domain."
                : "Your plan includes one custom domain and it is in use. Remove it to use a different one."
          }
        >
          {view.canAddMore ? (
            <form onSubmit={add} className="grid gap-4 sm:max-w-xl" data-testid="add-domain-form">
              <div className="grid gap-1.5">
                <Label htmlFor="domain">Domain</Label>
                <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourcompany.com" autoComplete="off" spellCheck={false} />
                <p className="text-xs text-muted-foreground">A domain you own — not a Gmail or Outlook address.</p>
              </div>

              {choosesBrand && (
                <div className="grid gap-1.5">
                  <Label>Brand</Label>
                  <Select value={siteChoice} onValueChange={setSiteChoice}>
                    <SelectTrigger className="w-full" data-testid="brand-select"><SelectValue placeholder="Choose a brand" /></SelectTrigger>
                    <SelectContent>
                      {freeBrands.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      <SelectItem value={NEW_BRAND}>Create a new brand…</SelectItem>
                    </SelectContent>
                  </Select>
                  {siteChoice === NEW_BRAND && (
                    <Input data-testid="brand-name" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Brand name, e.g. Uppercurve" className="mt-1" />
                  )}
                  <p className="text-xs text-muted-foreground">Mail sent while working in that brand leaves from this domain.</p>
                </div>
              )}

              <div>
                <Button type="submit" disabled={!canSubmit} data-testid="add-domain">
                  {adding ? <Spinner /> : <TbPlus />} Add domain
                </Button>
              </div>
            </form>
          ) : null}
        </SettingsCard>
      )}

      {view && !isOwner && !noPlanAccess && <Notice tone="info">Only the workspace owner can add or remove domains.</Notice>}
    </SettingsFrame>
  );
}
