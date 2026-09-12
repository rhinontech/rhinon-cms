"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export interface CurrentOrganization {
  id: string;
  name: string;
  slug: string;
  /** e.g. swiggy.rhinontech.in — company addresses live here. */
  emailDomain: string;
  status: "active" | "trial" | "suspended";
  plan: "free" | "starter" | "enterprise";
  isPlatform: boolean;
  sesStatus: "inherited" | "pending" | "verified" | "failed";
}

// One in-flight request shared by every caller: several components need the
// workspace on the same screen and /auth/me should not be fetched once each.
let cache: CurrentOrganization | null = null;
let inFlight: Promise<CurrentOrganization | null> | null = null;

function load(): Promise<CurrentOrganization | null> {
  if (cache) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = apiFetch<{ organization?: CurrentOrganization }>("/auth/me")
      .then((me) => {
        cache = me.organization ?? null;
        return cache;
      })
      .catch(() => null)
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/**
 * The signed-in user's workspace.
 *
 * Anywhere the UI used to hardcode "@rhinontech.in" it now needs this — an
 * employee at Swiggy gets aman@swiggy.rhinontech.in, and showing them our
 * domain would be showing them the wrong address to hand out.
 */
export function useOrganization() {
  const [organization, setOrganization] = useState<CurrentOrganization | null>(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let active = true;
    load().then((org) => {
      if (!active) return;
      setOrganization(org);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { organization, loading, emailDomain: organization?.emailDomain ?? "" };
}
