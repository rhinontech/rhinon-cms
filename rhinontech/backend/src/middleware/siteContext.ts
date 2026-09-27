import { Response, NextFunction } from "express";
import { Site } from "../models";
import { runForSite } from "../services/siteContext";
import { currentOrganizationId } from "../services/tenantContext";
import { AuthRequest } from "./authenticate";

/**
 * Resolves which of the workspace's brands a request is about, then runs the
 * rest of the request inside that site's context.
 *
 * Where the site comes from, in order:
 *   1. `X-Site-Slug` / `X-Site-Id` headers — what the admin panel sends, derived
 *      from the `[domain]` segment in the URL it is showing.
 *   2. `?siteId=` / `?domain=` — the spelling the Content module already used.
 *   3. nothing — the workspace's default site, used for stamping writes but NOT
 *      for filtering reads, so the dashboard and exports still see every brand.
 *
 * Site lookups run inside the tenant context the auth middleware already
 * entered, so a caller can never name another workspace's site: the tenant hooks
 * filter that query too, and an unknown id simply falls through to the default.
 */
export async function resolveSiteContext(req: AuthRequest, _res: Response, next: NextFunction) {
  // Reached without a tenant (the cron entry point on /campaigns skips auth):
  // there is no workspace whose sites we could pick from, and looking anyway
  // would trip the tenancy guard. Cross-brand is the right answer there.
  if (!currentOrganizationId()) return next();

  const header = (name: string) => {
    const value = req.header(name);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  const query = (name: string) => {
    const value = (req.query as Record<string, unknown>)[name];
    return typeof value === "string" && value ? value : null;
  };

  const askedId = header("x-site-id") ?? query("siteId");
  const askedSlug = header("x-site-slug") ?? query("domain");

  try {
    let site: Site | null = null;
    if (askedId) site = await Site.findByPk(askedId);
    if (!site && askedSlug) site = await Site.findOne({ where: { slug: askedSlug } });

    const explicit = !!site;
    if (!site) {
      site =
        (await Site.findOne({ where: { isDefault: true } })) ?? (await Site.findOne());
    }

    runForSite(site, explicit, next);
  } catch (err: any) {
    // A brand lookup must never take a request down: fall through unscoped,
    // which is exactly how every one of these routes behaved before sites.
    console.error("[Sites] Context resolution failed:", err.message);
    next();
  }
}
