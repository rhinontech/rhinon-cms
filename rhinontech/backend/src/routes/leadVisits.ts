import { Router, Response } from "express";
import { Lead, Visitor } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";

/**
 * GET /lead-visits/:leadId — the website visits a lead made through their
 * personalised campaign links, newest first. Tenant-scoped by the model hooks,
 * so a lead id from another workspace finds nothing.
 */
const router = Router();
router.use(authenticate);

router.get("/:leadId", authorize("crm:read"), async (req: AuthRequest, res: Response) => {
  const lead = await Lead.findByPk(req.params.leadId, { attributes: ["id"] });
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }
  const visits = await Visitor.findAll({
    where: { leadId: lead.id },
    attributes: ["id", "path", "referrer", "city", "country", "visitedAt", "userAgent"],
    order: [["visitedAt", "DESC"]],
    limit: 200,
  });
  res.json(visits);
});

export default router;
