import type { Request, RequestHandler } from "express";
import { Organization } from "../models/Organization";
import { Site } from "../models/Site";
import { hashApiKey } from "./orgProvisioning";
import { runForOrg } from "./tenantContext";

/**
 * Works out which workspace an unauthenticated public request is for.
 *
 * Three ways in, in priority order:
 *   1. `/public/:orgSlug/...`   — readable, shareable, no secret in the URL
 *   2. `x-api-key` header        — for headless CMS consumers
 *   3. nothing                   — falls back to the PLATFORM org
 *
 * That fallback is not a convenience, it is a compatibility requirement:
 * rhinonlabs.com already calls `/public/blogs` and `/public/case-studies` with
 * no key at all. Without it, the live marketing site's blog and case-study
 * pages would go blank the moment this shipped.
 */

let platformOrgId: string | null = null;

async function getPlatformOrgId(): Promise<string | null> {
  if (platformOrgId) return platformOrgId;
  const org = await Organization.findOne({ where: { isPlatform: true }, attributes: ["id"] });
  platformOrgId = org?.id ?? null;
  return platformOrgId;
}

async function resolveOrganization(
  slug: string | undefined,
  apiKey: string | undefined
): Promise<Organization | null> {
  if (slug) {
    return Organization.findOne({ where: { slug: slug.toLowerCase() } });
  }
  if (apiKey) {
    return Organization.findOne({ where: { apiKeyHash: hashApiKey(apiKey) } });
  }
  const id = await getPlatformOrgId();
  return id ? Organization.findByPk(id) : null;
}

/**
 * Enters the resolved workspace's context for the rest of the request, so every
 * tenant query underneath is filtered without each public handler re-deriving
 * the organization.
 */
export function publicTenantContext(): RequestHandler {
  return (req, res, next) => {
    const slug = (req.params as Record<string, string | undefined>).orgSlug;
    const apiKey = req.header("x-api-key") ?? undefined;

    resolveOrganization(slug, apiKey)
      .then((org) => {
        if (!org) {
          res.status(404).json({ message: "Unknown workspace." });
          return;
        }
        if (org.status === "suspended") {
          res.status(403).json({ message: "This workspace is not available." });
          return;
        }
        (req as unknown as { organization?: Organization }).organization = org;
        runForOrg(org.id, next, { label: "public" });
      })
      .catch((err) => {
        console.error("[Public] Tenant resolution failed:", err.message);
        res.status(500).json({ message: "Could not resolve workspace." });
      });
  };
}

const hostOf = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
};

/**
 * Picks a site within the already-resolved workspace.
 *
 * Order: an explicit name (`?domain=uppercurve`, the legacy spelling the Uppercurve
 * site still sends), then the brand whose `siteUrl` host matches the request's
 * Origin/Referer, then the workspace default. The Origin step is what keeps
 * rhinonlabs.com's forms and beacon — which name no brand — on Rhinon Labs now that
 * the default is another brand.
 */
export async function resolvePublicSite(slug?: unknown, req?: Pick<Request, "header">): Promise<Site | null> {
  if (typeof slug === "string" && slug) {
    const match = await Site.findOne({ where: { slug } });
    if (match) return match;
  }
  const from = hostOf(req?.header("origin")) ?? hostOf(req?.header("referer"));
  if (from) {
    const sites = await Site.findAll({ attributes: ["id", "siteUrl"] });
    const hit = sites.find((s) => hostOf(s.siteUrl) === from);
    if (hit) return hit;
  }
  return (await Site.findOne({ where: { isDefault: true } })) ?? (await Site.findOne());
}
