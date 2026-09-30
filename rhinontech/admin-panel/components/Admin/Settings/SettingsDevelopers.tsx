"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TbKey, TbRefresh } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { usePermissions } from "@/context/PermissionsContext";
import { API_URL, apiFetch } from "@/lib/api";
import { dateTime } from "@/lib/dates";
import { CopyButton, LoadingRows, Notice, SettingsCard, SettingsFrame, Spinner } from "@/components/Admin/Settings/parts";

interface KeyInfo {
  prefix: string | null;
  rotatedAt: string | null;
  exists: boolean;
  slug: string;
}

// Signup hands the one-time key to this screen through the session (see Signup.tsx).
const STASH = "rhinon.newApiKey";

function Code({ children, label }: { children: string; label: string }) {
  return (
    <div className="relative rounded-lg border border-border bg-muted/40">
      <pre className="overflow-x-auto p-3 pr-20 text-xs leading-relaxed"><code>{children}</code></pre>
      <CopyButton text={children} label={label} className="absolute right-2 top-2 bg-card" />
    </div>
  );
}

export function SettingsDevelopers() {
  const confirm = useConfirm();
  const { isOwner } = usePermissions();
  const [info, setInfo] = useState<KeyInfo | null>(null);
  const [error, setError] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  const load = useCallback(async () => {
    try {
      setInfo(await apiFetch<KeyInfo>("/workspace/api-key"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your API key");
    }
  }, []);

  useEffect(() => {
    if (isOwner) void load();
    try {
      setFresh(sessionStorage.getItem(STASH));
    } catch {
      /* storage unavailable: no one-time key to show */
    }
  }, [isOwner, load]);

  const dismissFresh = () => {
    setFresh(null);
    try {
      sessionStorage.removeItem(STASH);
    } catch {
      /* ignore */
    }
  };

  const rotate = async () => {
    const ok = await confirm({
      title: "Replace your API key?",
      description: "The current key stops working the moment you do this. Anything using it — a website, an integration — will need the new one.",
      confirmLabel: "Replace key",
      destructive: true,
    });
    if (!ok) return;
    setRotating(true);
    try {
      const res = await apiFetch<{ apiKey: string; prefix: string; rotatedAt: string }>("/workspace/api-key/rotate", { method: "POST" });
      setFresh(res.apiKey);
      try {
        sessionStorage.setItem(STASH, res.apiKey);
      } catch {
        /* the key is on screen regardless */
      }
      await load();
      toast.success("New key created. Copy it now — it is shown only once.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not replace the key");
    } finally {
      setRotating(false);
    }
  };

  const shown = fresh ?? "YOUR_API_KEY";

  return (
    <SettingsFrame title="Developers" description="The key that lets your own website or tools read your workspace's public content">
      {!isOwner && <Notice tone="info">Only the workspace owner can see or replace the API key.</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}
      {isOwner && !info && !error && <LoadingRows rows={2} />}

      {isOwner && fresh && (
        <SettingsCard testId="fresh-key" title="Your new API key" description="Copy it now and keep it somewhere safe. For security we only store a fingerprint, so it cannot be shown again.">
          <div className="flex flex-wrap items-center gap-2">
            <code data-testid="fresh-key-value" className="min-w-0 flex-1 break-all rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-sm">{fresh}</code>
            <CopyButton text={fresh} label="Copy key" testId="copy-fresh-key" />
          </div>
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={dismissFresh} data-testid="dismiss-fresh-key">I have saved it</Button>
          </div>
        </SettingsCard>
      )}

      {isOwner && info && (
        <SettingsCard
          title="API key"
          description="Send it as an x-api-key header. It can only read public content — blog posts, case studies, events — never your private data."
          actions={
            <Button size="sm" variant="outline" onClick={rotate} disabled={rotating} data-testid="rotate-key">
              {rotating ? <Spinner /> : <TbRefresh />} {info.exists ? "Replace key" : "Create key"}
            </Button>
          }
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground"><TbKey size={18} /></span>
            <div>
              <p className="font-mono text-sm" data-testid="key-prefix">{info.prefix ? `${info.prefix}…` : "No key yet"}</p>
              <p className="text-xs text-muted-foreground">
                {info.rotatedAt ? `Created ${dateTime(info.rotatedAt)}` : "Not created"}
              </p>
            </div>
          </div>
        </SettingsCard>
      )}

      {isOwner && info && (
        <SettingsCard title="Using it" description="Two ways to address your workspace from outside — pick whichever suits the tool.">
          <div className="grid gap-4">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">With the key</p>
              <Code label="Copy command">{`curl -H "x-api-key: ${shown}" ${API_URL}/public/blogs`}</Code>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                By workspace name — no key needed for public content
              </p>
              <Code label="Copy command">{`curl ${API_URL}/public/${info.slug}/blogs`}</Code>
            </div>
          </div>
        </SettingsCard>
      )}
    </SettingsFrame>
  );
}
