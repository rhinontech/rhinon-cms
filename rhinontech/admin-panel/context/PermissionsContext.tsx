"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { apiFetch } from "@/lib/api";

interface RoleWithPermissions {
  id: string;
  slug: string;
  Permissions: { name: string }[];
}

type PermissionsContextType = {
  /** The signed-in user's own permissions (ignoring any preview). */
  permissions: string[];
  /** The signed-in user's own role. */
  roleSlug: string;
  /** The signed-in user's id — null until /auth/me lands. Comes from the same
   *  request as the permissions rather than the JWT, because the JWT is a frozen
   *  snapshot and doesn't carry `department` at all. */
  userId: string | null;
  fullName: string;
  department: string | null;
  /** True while previewing another role's URL as superadmin. */
  isPreviewing: boolean;
  /** The role currently in effect for gating decisions — the previewed role's
   *  slug while superadmin is browsing another role's URL, else roleSlug. */
  effectiveRoleSlug: string;
  ready: boolean;
  /** Permission check that accounts for preview mode and the superadmin
   *  override — use this everywhere instead of reading `permissions` directly. */
  has: (...anyOf: string[]) => boolean;
  refresh: () => void;
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

function readCookieHint() {
  try {
    return JSON.parse(Cookies.get("permissions") || "[]") as string[];
  } catch {
    return [];
  }
}

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Start empty on both server and client — document.cookie isn't available
  // during SSR, so seeding this synchronously from the cookie would make the
  // very first client render diverge from the server-rendered HTML (a
  // hydration mismatch). Instead the cookie hint is applied a tick later from
  // an effect below (client-only, runs after hydration), and /auth/me then
  // replaces it with the live DB state.
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roleSlug, setRoleSlug] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [previewRolePermissions, setPreviewRolePermissions] = useState<string[] | null>(null);

  const urlRoleSlug = pathname.split("/")[1] || "";
  const isPreviewing = roleSlug === "superadmin" && urlRoleSlug !== "superadmin" && urlRoleSlug !== "";

  useEffect(() => {
    setPermissions(readCookieHint());
  }, []);

  useEffect(() => {
    let cancelled = false;
    // /auth/me returns the whole user row (minus passwordHash), so identity comes
    // along for free with the permissions — no second request.
    apiFetch<{
      permissions: string[];
      roleSlug: string;
      id?: string;
      fullName?: string;
      department?: string | null;
    }>("/auth/me")
      .then((data) => {
        if (cancelled) return;
        setPermissions(data.permissions || []);
        setRoleSlug(data.roleSlug || "");
        setUserId(data.id ?? null);
        setFullName(data.fullName || "");
        setDepartment(data.department ?? null);
        setReady(true);
        // Keep the cookie warm as the fast-path hint for the next page load.
        Cookies.set("permissions", JSON.stringify(data.permissions || []), { expires: 7 });
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => { cancelled = true; };
  }, [tick]);

  useEffect(() => {
    if (!isPreviewing) {
      setPreviewRolePermissions(null);
      return;
    }
    let cancelled = false;
    apiFetch<RoleWithPermissions[]>("/roles")
      .then((roles) => {
        if (cancelled) return;
        const role = roles.find((r) => r.slug === urlRoleSlug);
        setPreviewRolePermissions(role ? role.Permissions.map((p) => p.name) : []);
      })
      .catch(() => { if (!cancelled) setPreviewRolePermissions([]); });
    return () => { cancelled = true; };
  }, [isPreviewing, urlRoleSlug]);

  const has = (...anyOf: string[]) => {
    if (isPreviewing) {
      return (previewRolePermissions ?? []).some((p) => anyOf.includes(p));
    }
    if (roleSlug === "superadmin") return true;
    return anyOf.some((p) => permissions.includes(p));
  };

  const effectiveRoleSlug = isPreviewing ? urlRoleSlug : roleSlug;

  return (
    <PermissionsContext.Provider
      value={{ permissions, roleSlug, userId, fullName, department, isPreviewing, effectiveRoleSlug, ready, has, refresh: () => setTick((t) => t + 1) }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
