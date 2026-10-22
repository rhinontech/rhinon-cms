import { Router, Response } from "express";
import { Op } from "sequelize";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import { AuditLog } from "../models/AuditLog";

const router = Router();
router.use(authenticate);

/**
 * The workspace's own trail, newest first. Administrators only (settings:write) —
 * it names who changed what, which is not something every employee should see.
 * Tenant scoping is automatic: AuditLog is a tenant model.
 */
router.get("/", authorize("settings:write"), async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 50, 1), 200);
  const before = req.query.before ? new Date(String(req.query.before)) : null;
  const where: Record<string, unknown> = {};
  if (typeof req.query.actorId === "string") where.actorId = req.query.actorId;
  if (typeof req.query.action === "string") where.action = { [Op.iLike]: `%${req.query.action}%` };
  if (before && !Number.isNaN(before.getTime())) where.createdAt = { [Op.lt]: before };

  const rows = await AuditLog.findAll({ where, order: [["createdAt", "DESC"]], limit });
  res.json({ entries: rows, nextBefore: rows.length === limit ? rows[rows.length - 1].createdAt : null });
});

export default router;
