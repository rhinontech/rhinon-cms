"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";

/**
 * The brands inside the signed-in workspace, and the routing that splits the
 * brand-aware modules by them.
 *
 * Content got here first (one CMS, two public sites). Inbox, CRM, Outreach,
 * Automation and Analytics are the same shape of problem: running two brands out
 * of one workspace means two pipelines, two inboxes and two sets of traffic, not
 * one merged pile. The brand lives in the URL — /[role]/crm/[domain]/deals — so
 * it survives a refresh, a bookmark and a link pasted into Slack.
 *
 * A workspace with a single site never sees any of this: the picker is skipped
 * and the one site is redirected to.
 */
export interface Site {
  id: string;
  name: string;
  slug: string;
  siteUrl: string | null;
  /** Mail sent under this brand leaves on this domain; null keeps the workspace's. */
  sendingDomain?: string | null;
  isDefault: boolean;
  supportsEvents: boolean;
  supportsCaseStudies: boolean;
}

/**
 * Modules whose URLs carry a `[domain]` segment.
 *
 * Read by lib/api.ts to decide whether to send the brand header, so a module
 * added here without the matching route folder would start filtering requests
 * it has no site for. Keep the two in step.
 */
export const SITE_SCOPED_MODULES = [
  "content",
  "inbox",
  "crm",
  "outreach",
  "automation",
  "analytics",
] as const;

export type SiteScopedModule = (typeof SITE_SCOPED_MODULES)[number];

/**
 * The brand slug for a given admin path, or null when the path is not inside a
 * brand-split module.
 *
 * Derived from the URL on every call rather than held in a store: a stale
 * "active site" left behind after navigating to Payroll would quietly filter a
 * screen that has no brand at all.
 */
export function siteSlugFromPath(pathname: string): string | null {
  const [, , moduleSlug, domain] = pathname.split("/");
  if (!moduleSlug || !domain) return null;
  if (!SITE_SCOPED_MODULES.includes(moduleSlug as SiteScopedModule)) return null;
  return domain;
}

// Shared across the several components that mount on the same screen, so one
// navigation costs one request rather than one per widget.
let cache: Site[] | null = null;
let inFlight: Promise<Site[]> | null = null;

function load(): Promise<Site[]> {
  if (cache) return Promise.resolve(cache);
  if (!inFlight) {
    inFlight = apiFetch<Site[]>("/sites")
      .then((sites) => {
        cache = sites ?? [];
        return cache;
      })
      .catch(() => [])
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/** Drops the cache — call after a site is created, renamed or removed. */
export function invalidateSites() {
  cache = null;
}

export function useSites() {
  const [sites, setSites] = useState<Site[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let active = true;
    load().then((list) => {
      if (!active) return;
      setSites(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { sites, loading };
}

/**
 * The site named by the current URL.
 *
 * `loading` matters: until the workspace's sites have resolved, an unknown slug
 * is not yet proof of a bad URL, and redirecting on it bounces every first
 * paint back to the picker.
 */
export function useCurrentSite() {
  const params = useParams();
  const slug = (params?.domain as string) || null;
  const { sites, loading } = useSites();
  return { slug, site: sites.find((s) => s.slug === slug), sites, loading };
}

/**
 * The URL prefix for the module being viewed, brand included.
 *
 * Components link with this instead of rebuilding `/${role}/crm` by hand, which
 * would drop the brand and bounce the user back to the picker.
 */
export function useModuleBase(): string {
  const pathname = usePathname();
  const [, role, moduleSlug, domain] = pathname.split("/");
  const base = `/${role}/${moduleSlug}`;
  return siteSlugFromPath(pathname) ? `${base}/${domain}` : base;
}

/* ------------------------------------------------------------------ *
 * The brand the whole admin is being viewed as
 * ------------------------------------------------------------------ */

const ACTIVE_BRAND_KEY = "rhinon.activeBrand";

/**
 * The brand the whole admin is currently being viewed as.
 *
 * The URL wins wherever it carries a `[domain]` — a pasted link to another
 * brand's inbox has to show that brand, not whatever was last picked here.
 * Everywhere else (Dashboard, Work, Payroll) there is nothing in the path to
 * read, so the last choice is remembered per browser and the workspace's
 * default brand is the fallback.
 *
 * Reading localStorage is deferred to an effect: touching it during render
 * would make the server and client markup disagree and blow up hydration.
 */
export function useActiveBrand() {
  const pathname = usePathname();
  const { sites, loading } = useSites();
  const fromUrl = siteSlugFromPath(pathname);
  const [remembered, setRemembered] = useState<string | null>(null);

  useEffect(() => {
    try {
      setRemembered(window.localStorage.getItem(ACTIVE_BRAND_KEY));
    } catch {
      /* private mode / blocked storage — the default brand still works */
    }
  }, []);

  // A brand reached by URL becomes the remembered one, so navigating away to
  // Dashboard does not silently snap back to the previous brand.
  useEffect(() => {
    if (!fromUrl) return;
    setRemembered(fromUrl);
    try {
      window.localStorage.setItem(ACTIVE_BRAND_KEY, fromUrl);
    } catch {
      /* ignore */
    }
  }, [fromUrl]);

  const fallback = sites.find((s) => s.isDefault)?.slug ?? sites[0]?.slug ?? null;
  const candidate = fromUrl ?? remembered ?? fallback;
  // A remembered brand that no longer exists must not strand the menu.
  const slug = sites.some((s) => s.slug === candidate) ? candidate : fallback;

  const select = (next: string) => {
    setRemembered(next);
    try {
      window.localStorage.setItem(ACTIVE_BRAND_KEY, next);
    } catch {
      /* ignore */
    }
  };

  return {
    slug,
    brand: sites.find((s) => s.slug === slug) ?? null,
    sites,
    loading,
    select,
  };
}
