import express, { Router, Request, Response } from "express";
import { runForOrg } from "../services/tenantContext";
import { runForSite } from "../services/siteContext";
import { rateLimit } from "../middleware/rateLimit";
import { TRACKER_SCRIPT } from "../services/trackerScript";
import { parseBeaconBody, recordPageview, enrichGeoInBackground } from "../services/pageviewIngest";
import { domainAllowed, noteRejectedHost, requestHost, resolveTrackerKey } from "../services/analyticsSetup";

/**
 * Customer-facing analytics ingest. Mounted at the API root (not /public) so it
 * is not swept into the "no key means the platform workspace" fallback that
 * /public has — here, no valid key means nothing is recorded.
 */
const router = Router();

// GET /t.js — the tracker. Cached an hour; the file only changes when we ship.
router.get("/t.js", (_req: Request, res: Response) => {
  res.type("application/javascript; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.set("Cross-Origin-Resource-Policy", "cross-origin");
  res.send(TRACKER_SCRIPT);
});

// POST /collect — one pageview. Fire-and-forget: it answers 204 to everything, so
// a probe learns nothing about which keys exist, and a tracking problem can never
// surface on the customer's page.
router.post(
  "/collect",
  // Per client address, so one abusive client cannot flood a customer's numbers.
  rateLimit({ name: "collect-ip", windowMs: 60_000, max: 240 }),
  express.text({ type: ["text/plain"] }),
  async (req: Request, res: Response) => {
    try {
      const body = parseBeaconBody(req.body);
      const key = typeof body.k === "string" ? body.k.trim().slice(0, 64) : "";
      const target = key ? await resolveTrackerKey(key) : null;
      if (!target) return void res.status(204).end();

      const host = requestHost(req.headers.origin as string | undefined, req.headers.referer as string | undefined);
      if (!domainAllowed(host, target.domains)) {
        noteRejectedHost(target.siteId, host);
        return void res.status(204).end();
      }

      const view = await runForOrg(
        target.organizationId,
        () =>
          runForSite({ id: target.siteId, slug: target.siteSlug }, true, () =>
            recordPageview(req, body, { siteId: target.siteId, companyLookup: target.isPlatform })
          ),
        { label: "collect" }
      );
      res.status(204).end();
      if (view) enrichGeoInBackground(req, view);
    } catch (err) {
      console.error("Failed to collect pageview:", err);
      res.status(204).end();
    }
  }
);

export default router;
