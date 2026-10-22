import { Router, Response, NextFunction } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { Organization } from "../models/Organization";
import { auditRequest } from "../services/audit";
import {
  CustomDomainError, customDomainView, requestCustomDomain, refreshCustomDomain, removeCustomDomain,
} from "../services/customDomain";

/** Sending from the workspace's own domain. Owner only — it changes who the company's mail appears to come from. */
const router = Router();
router.use(authenticate);

function requireOwner(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.roleSlug !== "superadmin" || req.user.userType === "guest") {
    res.status(403).json({ message: "Only the workspace owner can change the sending domain." });
    return;
  }
  next();
}

const fail = (res: Response, err: unknown) => {
  if (err instanceof CustomDomainError) { res.status(err.status).json({ message: err.message }); return; }
  console.error("[CustomDomain]", err);
  res.status(500).json({ message: "Something went wrong." });
};

const load = (req: AuthRequest) => Organization.findByPk(req.user!.organizationId);

// Current state; re-checks SES while pending so polling this endpoint is all the UI needs.
router.get("/", authorize("settings:read"), async (req: AuthRequest, res: Response) => {
  try {
    const org = await load(req);
    if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }
    res.json(await refreshCustomDomain(org));
  } catch (err) { fail(res, err); }
});

router.post("/", requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const org = await load(req);
    if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }
    const view = await requestCustomDomain(org, {
      domain: req.body?.domain,
      siteId: typeof req.body?.siteId === "string" ? req.body.siteId : undefined,
      brandName: typeof req.body?.brandName === "string" && req.body.brandName.trim() ? req.body.brandName : undefined,
    });
    void auditRequest(req, "email_domain.requested", { entityType: "organization", entityId: org.id, metadata: { domain: String(req.body?.domain ?? "").toLowerCase() } });
    res.status(201).json(view);
  } catch (err) { fail(res, err); }
});

router.delete("/:domain", requireOwner, async (req: AuthRequest, res: Response) => {
  try {
    const org = await load(req);
    if (!org) { res.status(404).json({ message: "Workspace not found" }); return; }
    const view = await removeCustomDomain(org, req.params.domain);
    void auditRequest(req, "email_domain.removed", { entityType: "organization", entityId: org.id, metadata: { domain: req.params.domain.toLowerCase() } });
    res.json(view);
  } catch (err) { fail(res, err); }
});

export default router;
