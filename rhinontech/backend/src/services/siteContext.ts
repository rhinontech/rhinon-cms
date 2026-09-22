import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request *site* context — the brand axis that sits inside a tenant.
 *
 * A workspace can run more than one public brand (Rhinon runs rhinonlabs and
 * uppercurve off one org). Content already splits that way; Inbox, CRM,
 * Outreach, Automation and Analytics now do too, so a reply to an Uppercurve
 * lead does not land in the Rhinon Labs inbox.
 *
 * This deliberately behaves differently from tenantContext:
 *
 *   - Missing context is NORMAL, not a bug. Cron sweeps, the dashboard and
 *     every module that is not brand-split query across all of a workspace's
 *     sites, so "no site" means "no filter" and never warns.
 *   - The filter only applies when the caller asked for one (`explicit`), i.e.
 *     the admin sent X-Site-Slug / ?siteId=. Writes still get stamped with the
 *     resolved site even when the caller did not ask, so a row created from a
 *     non-brand screen still belongs to the workspace's default site instead of
 *     landing site-less and invisible.
 */
export interface SiteContext {
  siteId: string | null;
  siteSlug: string | null;
  /** True when the caller named a site. Only then do reads get filtered. */
  explicit: boolean;
}

const storage = new AsyncLocalStorage<SiteContext>();

export function getSiteContext(): SiteContext | undefined {
  return storage.getStore();
}

/** The site reads should be filtered to, or null for "every site in the org". */
export function currentSiteFilter(): string | null {
  const ctx = storage.getStore();
  return ctx?.explicit ? ctx.siteId : null;
}

/** The site a newly created row belongs to, filtered or not. */
export function currentSiteId(): string | null {
  return storage.getStore()?.siteId ?? null;
}

export function currentSiteSlug(): string | null {
  return storage.getStore()?.siteSlug ?? null;
}

/** Run `fn` bound to one site. `explicit` decides whether reads are filtered. */
export function runForSite<T>(
  site: { id: string; slug: string } | null,
  explicit: boolean,
  fn: () => T
): T {
  return storage.run(
    { siteId: site?.id ?? null, siteSlug: site?.slug ?? null, explicit: explicit && !!site },
    fn
  );
}

/**
 * Run `fn` with site filtering off — cron sweeps and cross-brand reports.
 *
 * Used where a site context may already be on the stack and the work underneath
 * must still see the whole workspace.
 */
export function runAcrossSites<T>(fn: () => T): T {
  return storage.run({ siteId: null, siteSlug: null, explicit: false }, fn);
}
