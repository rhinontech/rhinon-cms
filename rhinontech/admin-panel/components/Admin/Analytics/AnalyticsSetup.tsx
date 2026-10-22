"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TbArrowLeft, TbCircleCheck, TbClockHour4, TbKey, TbPlus, TbRefresh, TbX } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { plural, timeAgo } from "@/lib/dates";
import { useModuleBase } from "@/lib/sites";
import { CopyButton, LoadingRows, Notice, Pill, SettingsCard, Spinner } from "@/components/Admin/Settings/parts";

interface Setup {
  site: { id: string; name: string; slug: string; siteUrl: string | null };
  key: string;
  domains: string[];
  suggestedDomain: string | null;
  maxDomains: number;
  scriptUrl: string;
  snippet: string | null;
  lastEventAt: string | null;
  events24h: number;
  rejected: { host: string; at: string } | null;
}

const POLL_MS = 8000;

const INSTALL_HINTS: { name: string; where: string }[] = [
  { name: "Plain HTML / any CMS", where: "Paste it just before </head> on every page (or in the site-wide header / theme setting)." },
  { name: "Next.js", where: "In app/layout.tsx, add it to <head> with next/script: strategy=\"afterInteractive\" and the same src and data-key." },
  { name: "WordPress", where: "Use a header-scripts plugin, or add it to your theme's header.php before </head>." },
  { name: "Google Tag Manager", where: "New Custom HTML tag with the snippet, triggered on All Pages." },
  { name: "Shopify / Webflow / Wix", where: "Paste it in the site's custom code / header section." },
];

/** The screen a customer follows to put analytics on their own site. */
export function AnalyticsSetup() {
  const router = useRouter();
  const base = useModuleBase();
  const confirm = useConfirm();
  const { has } = usePermissions();
  const canEdit = has("settings:write");

  const [setup, setSetup] = useState<Setup | null>(null);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const alive = useRef(true);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setChecking(true);
    try {
      const next = await apiFetch<Setup>("/analytics/setup");
      if (alive.current) setSetup(next);
    } catch (err) {
      if (alive.current && !quiet) setError(err instanceof Error ? err.message : "Could not load tracking setup");
    } finally {
      if (alive.current) setChecking(false);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void load(true);
    return () => {
      alive.current = false;
    };
  }, [load]);

  // Until the first pageview arrives, keep checking so the screen flips to
  // "receiving data" by itself the moment the customer loads their site.
  const waiting = !!setup && !!setup.snippet && !setup.lastEventAt;
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => void load(true), POLL_MS);
    return () => clearInterval(t);
  }, [waiting, load]);

  const saveDomains = async (domains: string[]) => {
    setSaving(true);
    try {
      setSetup(await apiFetch<Setup>("/analytics/setup/domains", { method: "PUT", body: JSON.stringify({ domains }) }));
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the domains");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addDomain = async (value: string) => {
    if (!setup || !value.trim()) return;
    if (await saveDomains([...setup.domains, value.trim()])) setInput("");
  };

  const removeDomain = async (domain: string) => {
    if (!setup) return;
    const ok = await confirm({
      title: `Stop tracking ${domain}?`,
      description: "Pages on this domain will stop being counted. You can add it back at any time.",
      confirmLabel: "Remove domain",
      destructive: true,
    });
    if (ok) await saveDomains(setup.domains.filter((d) => d !== domain));
  };

  const rotate = async () => {
    const ok = await confirm({
      title: "Generate a new tracking key?",
      description: "The snippet on your site stops working immediately. You will need to paste the new one before any more visits are counted.",
      confirmLabel: "Generate new key",
      destructive: true,
    });
    if (!ok) return;
    try {
      setSetup(await apiFetch<Setup>("/analytics/setup/rotate-key", { method: "POST" }));
      toast.success("New key issued — update the snippet on your site");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not rotate the key");
    }
  };

  return (
    <div className="h-full overflow-auto rounded-xl bg-muted/30" data-testid="analytics-setup">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
        <div>
          <button
            type="button"
            onClick={() => router.push(base)}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <TbArrowLeft size={14} /> Back to analytics
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Install tracking</h1>
          <p className="text-sm text-muted-foreground">
            Add one line to your website and its visitors, sources and pages appear here.
            {setup ? ` Reporting for ${setup.site.name}.` : ""}
          </p>
        </div>

        {error && <Notice tone="danger">{error}</Notice>}
        {!setup && !error && <LoadingRows rows={4} />}

        {setup && (
          <>
            <SettingsCard
              title="1. Your website's domain"
              description="Only pages on these domains are counted, so a copied snippet on another site cannot add to your numbers. Subdomains are included."
            >
              <div className="flex flex-wrap gap-2" data-testid="domains">
                {setup.domains.length === 0 && <p className="text-sm text-muted-foreground">No domain yet.</p>}
                {setup.domains.map((d) => (
                  <span key={d} data-testid={`domain-${d}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm">
                    {d}
                    {canEdit && (
                      <button type="button" onClick={() => removeDomain(d)} aria-label={`Remove ${d}`} className="text-muted-foreground hover:text-red-600">
                        <TbX size={14} />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {canEdit ? (
                <form
                  className="mt-4 flex flex-wrap items-end gap-2"
                  data-testid="add-tracked-domain-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void addDomain(input);
                  }}
                >
                  <div className="grid min-w-[220px] flex-1 gap-1.5">
                    <Label htmlFor="tracked-domain">Add a domain</Label>
                    <Input
                      id="tracked-domain"
                      data-testid="tracked-domain"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="yourcompany.com"
                      autoComplete="off"
                      spellCheck={false}
                      disabled={setup.domains.length >= setup.maxDomains}
                    />
                  </div>
                  <Button type="submit" data-testid="add-tracked-domain" disabled={saving || !input.trim() || setup.domains.length >= setup.maxDomains}>
                    {saving ? <Spinner /> : <TbPlus size={16} />} Add
                  </Button>
                  {setup.suggestedDomain && !setup.domains.includes(setup.suggestedDomain) && (
                    <Button type="button" variant="outline" data-testid="use-suggested" onClick={() => addDomain(setup.suggestedDomain!)}>
                      Use {setup.suggestedDomain}
                    </Button>
                  )}
                </form>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">Ask a workspace admin to change the domains.</p>
              )}
            </SettingsCard>

            <SettingsCard
              title="2. Paste this on your site"
              description="Put it in the <head> of every page — a site-wide header or layout is the easiest place."
            >
              {setup.snippet ? (
                <div className="relative rounded-lg border border-border bg-card" data-testid="snippet-box">
                  <pre className="whitespace-pre-wrap break-all p-3 pr-24 text-xs leading-relaxed" data-testid="snippet"><code>{setup.snippet}</code></pre>
                  <CopyButton text={setup.snippet} label="Snippet" testId="copy-snippet" className="absolute right-2 top-2 bg-card" />
                </div>
              ) : (
                <Notice tone="info" testId="snippet-locked">Add your domain above and the snippet for it appears here.</Notice>
              )}

              {setup.snippet && (
                <details className="mt-4 group" data-testid="install-hints">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">Where does it go on my platform?</summary>
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {INSTALL_HINTS.map((h) => (
                      <li key={h.name}>
                        <span className="font-medium text-foreground">{h.name}</span> — {h.where}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </SettingsCard>

            <SettingsCard
              title="3. Check that it works"
              description="Open your website in another tab after adding the snippet. This page updates by itself."
              actions={
                <Button variant="outline" size="sm" data-testid="check-install" onClick={() => load()} disabled={checking}>
                  <TbRefresh size={14} className={checking ? "animate-spin" : ""} /> Check now
                </Button>
              }
            >
              {!setup.snippet ? (
                <p className="text-sm text-muted-foreground">Waiting for a domain.</p>
              ) : setup.lastEventAt ? (
                <div className="flex flex-wrap items-center gap-2" data-testid="install-ok">
                  <Pill tone="green"><TbCircleCheck size={13} /> Receiving data</Pill>
                  <span className="text-sm text-muted-foreground">
                    Last visit {timeAgo(setup.lastEventAt)} · {plural(setup.events24h, "pageview")} in the last 24 hours
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2" data-testid="install-waiting">
                  <Pill tone="amber"><TbClockHour4 size={13} /> Waiting for the first visit</Pill>
                  <span className="text-sm text-muted-foreground">Nothing has arrived yet.</span>
                </div>
              )}

              {setup.rejected && (
                <div className="mt-3" data-testid="rejected-host">
                  <Notice tone="warning">
                    A visit from <strong>{setup.rejected.host}</strong> {timeAgo(setup.rejected.at)} was ignored because that domain is not on your list.
                    {canEdit && setup.rejected.host.includes(".") && !setup.domains.includes(setup.rejected.host) && (
                      <>
                        {" "}
                        <button type="button" className="font-medium underline" data-testid="add-rejected" onClick={() => addDomain(setup.rejected!.host)}>
                          Add {setup.rejected.host}
                        </button>
                      </>
                    )}
                  </Notice>
                </div>
              )}
            </SettingsCard>

            {canEdit && (
              <SettingsCard
                title="Tracking key"
                description="Public by design — it only lets a page on your registered domains add a pageview. Replace it if the snippet was copied somewhere it should not be."
                actions={
                  <Button variant="outline" size="sm" data-testid="rotate-tracking-key" onClick={rotate}>
                    <TbKey size={14} /> Generate new key
                  </Button>
                }
              >
                <code className="rounded bg-muted px-2 py-1 text-xs" data-testid="tracking-key">{setup.key}</code>
              </SettingsCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
