"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { usePermissions } from "@/context/PermissionsContext";
import { apiFetch } from "@/lib/api";
import { LoadingRows, Notice, SettingsCard } from "@/components/Admin/Settings/parts";

type ThemeId = "admin" | "blocks" | "midnight" | "brutal";

const THEMES: { id: ThemeId; name: string; vibe: string; bg: string; fg: string; accent: string }[] = [
  { id: "admin", name: "Admin", vibe: "Geist type, slate palette, frosted glass. The default.", bg: "#f3f4f8", fg: "#171a24", accent: "#6d4de0" },
  { id: "blocks", name: "Blocks", vibe: "Editorial colour-blocking on warm paper.", bg: "#f4efe6", fg: "#1d1812", accent: "#e8553d" },
  { id: "midnight", name: "Midnight", vibe: "Dark, quiet, neon accents.", bg: "#0f1117", fg: "#f1f2f6", accent: "#7c8cff" },
  { id: "brutal", name: "Brutal", vibe: "Hard borders, heavy type, no softness.", bg: "#fff8d6", fg: "#000000", accent: "#ff3b6b" },
];

/** Which design system the mobile app renders in for everyone in the workspace. Super admin only. */
export function MobileTheme() {
  const { isOwner } = usePermissions();
  const [theme, setTheme] = useState<ThemeId | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<ThemeId | null>(null);

  useEffect(() => {
    apiFetch<{ theme: ThemeId }>("/branding/mobile-theme")
      .then((r) => setTheme(r.theme))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the mobile theme"));
  }, []);

  if (!isOwner) return null;

  const pick = async (id: ThemeId) => {
    if (id === theme || saving) return;
    setSaving(id);
    try {
      await apiFetch("/branding/mobile-theme", { method: "PUT", body: JSON.stringify({ theme: id }) });
      setTheme(id);
      toast.success("Mobile theme updated. The app picks it up on next open.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change the theme");
    } finally {
      setSaving(null);
    }
  };

  return (
    <SettingsCard
      testId="mobile-theme"
      title="Mobile app theme"
      description="The design system the Rhinon mobile app uses for everyone in this workspace."
    >
      {error && <Notice tone="danger">{error}</Notice>}
      {!theme && !error && <LoadingRows rows={2} />}
      {theme && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => pick(t.id)}
              disabled={saving !== null}
              aria-pressed={theme === t.id}
              className={`rounded-xl border p-3 text-left transition ${theme === t.id ? "border-primary ring-2 ring-primary/30" : "hover:border-foreground/30"}`}
            >
              <div className="mb-3 flex h-16 items-end gap-1.5 rounded-lg p-2" style={{ background: t.bg }}>
                <span className="h-8 w-8 rounded-md" style={{ background: t.accent }} />
                <span className="text-lg font-bold leading-none" style={{ color: t.fg }}>Aa</span>
              </div>
              <p className="text-sm font-medium">{t.name}{theme === t.id ? " · current" : ""}</p>
              <p className="text-xs text-muted-foreground">{t.vibe}</p>
            </button>
          ))}
        </div>
      )}
    </SettingsCard>
  );
}
