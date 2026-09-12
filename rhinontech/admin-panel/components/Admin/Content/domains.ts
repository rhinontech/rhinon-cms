"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

/**
 * Publishing brands for the signed-in workspace.
 *
 * This file used to hardcode Rhinon's own two brands (rhinonlabs, uppercurve).
 * Under multi-tenancy that put Rhinon's brand names in every customer's Content
 * module, so the list now comes from GET /content/sites — which is tenant-scoped,
 * returns exactly one site for a new workspace, and still returns both of
 * Rhinon's brands for Rhinon. The slugs are unchanged, so existing
 * /content/rhinonlabs/... URLs keep working.
 */
export type ContentResource = "blogs" | "case-studies" | "events";

export interface Site {
  id: string;
  name: string;
  slug: string;
  siteUrl: string | null;
  isDefault: boolean;
  supportsEvents: boolean;
  supportsCaseStudies: boolean;
}

export interface ContentDomainConfig {
  slug: string;
  label: string;
  description: string;
  siteUrl: string;
  resources: Array<{ key: ContentResource; label: string }>;
}

export function toDomainConfig(site: Site): ContentDomainConfig {
  const resources: ContentDomainConfig["resources"] = [{ key: "blogs", label: "Blogs" }];
  if (site.supportsCaseStudies) resources.push({ key: "case-studies", label: "Case Studies" });
  if (site.supportsEvents) resources.push({ key: "events", label: "Events" });

  return {
    slug: site.slug,
    label: site.name,
    description: resources.map((r) => r.label).join(" and "),
    siteUrl: site.siteUrl || "",
    resources,
  };
}

// Shared across the several Content components that mount on the same screen.
let cache: ContentDomainConfig[] | null = null;
let inFlight: Promise<ContentDomainConfig[]> | null = null;

function load(): Promise<ContentDomainConfig[]> {
  if (cache) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = apiFetch<Site[]>("/content/sites")
      .then((sites) => {
        cache = (sites ?? []).map(toDomainConfig);
        return cache;
      })
      .catch(() => [])
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function useContentDomains() {
  const [domains, setDomains] = useState<ContentDomainConfig[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let active = true;
    load().then((list) => {
      if (!active) return;
      setDomains(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { domains, loading };
}

/** One site by slug. `loading` matters: until it resolves, absence is not proof. */
export function useDomainConfig(slug: string) {
  const { domains, loading } = useContentDomains();
  return { config: domains.find((d) => d.slug === slug), loading, domains };
}
