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

/** What /auth/me says about the workspace the user is signed into. */
export interface AccountStatus {
  organization: {
    id: string;
    name: string;
    slug: string;
    emailDomain: string;
    status: "active" | "trial" | "suspended";
    plan: "free" | "starter" | "enterprise";
    isPlatform: boolean;
  } | null;
  /** The owner has not yet clicked the link we emailed at signup. */
  emailVerificationPending: boolean;
  trialEndsAt: string | null;
  trialExpired: boolean;
  termsVersion: string | null;
  termsAccepted: boolean;
}

const EMPTY_ACCOUNT: AccountStatus = {
  organization: null,
  emailVerificationPending: false,
  trialEndsAt: null,
  trialExpired: false,
  termsVersion: null,
  termsAccepted: true, // unknown is not "unaccepted": never nag before the answer arrives
};

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
  /** The workspace owner (its superadmin), acting as themselves rather than previewing a role. */
  isOwner: boolean;
  /** The platform workspace's owner — the only person who can manage other workspaces. */
  isPlatformOwner: boolean;
  /** Workspace, trial, verification and terms state, from the same /auth/me call. */
  account: AccountStatus;
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
  const [account, setAccount] = useState<AccountStatus>(EMPTY_ACCOUNT);

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
      organization?: AccountStatus["organization"];
      emailVerificationPending?: boolean;
      trialEndsAt?: string | null;
      trialExpired?: boolean;
      termsVersion?: string | null;
      termsAccepted?: boolean;
    }>("/auth/me")
      .then((data) => {
        if (cancelled) return;
        setPermissions(data.permissions || []);
        setRoleSlug(data.roleSlug || "");
        setUserId(data.id ?? null);
        setFullName(data.fullName || "");
        setDepartment(data.department ?? null);
        setAccount({
          organization: data.organization ?? null,
          emailVerificationPending: !!data.emailVerificationPending,
          trialEndsAt: data.trialEndsAt ?? null,
          trialExpired: !!data.trialExpired,
          termsVersion: data.termsVersion ?? null,
          termsAccepted: data.termsAccepted ?? true,
        });
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
    // No blanket superadmin override. Every workspace owner is a superadmin of
    // their own org, so returning true here showed customers the platform
    // modules — Content, Startup Ideas, Analytics — in the sidebar, even though
    // the API refuses them. The server already gives a platform superadmin the
    // whole catalog and a tenant's only what their workspace holds, so the list
    // is the answer for both.
    //
    // The one exception is the window before that list arrives: falling back to
    // "allow" there would flash the full sidebar, so an empty list means the
    // nav simply has not rendered yet.
    return anyOf.some((p) => permissions.includes(p));
  };

  const effectiveRoleSlug = isPreviewing ? urlRoleSlug : roleSlug;
  const isOwner = roleSlug === "superadmin" && !isPreviewing;
  const isPlatformOwner = isOwner && !!account.organization?.isPlatform;

  return (
    <PermissionsContext.Provider
      value={{ permissions, roleSlug, userId, fullName, department, isPreviewing, isOwner, isPlatformOwner, account, effectiveRoleSlug, ready, has, refresh: () => setTick((t) => t + 1) }}
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
