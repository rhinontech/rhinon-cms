import { Op } from "sequelize";
import { hasPermission, type AuthRequest } from "../middleware/authenticate";

/**
 * CRM record scope. Someone whose role has crm:viewAll sees every lead, deal
 * and account; anyone else sees the records they own plus unassigned ones (the
 * shared pool, so new leads don't vanish before someone picks them up).
 *
 * Every role that could read the CRM when this shipped was given crm:viewAll,
 * so nothing changed for them; the Sales rep template starts without it.
 */
export function seesAllCrm(req: AuthRequest): boolean {
  return hasPermission(req, "crm:viewAll");
}

/** Narrows a list query to what this person may see. Overrides any ownerId filter they sent. */
export function scopeToOwner(req: AuthRequest, where: Record<string, unknown>): void {
  if (seesAllCrm(req)) return;
  const requested = where.ownerId;
  const mine = { [Op.or]: [req.user!.userId, null] };
  // "Show me X's records" from someone who may only see their own: honour it only for themselves or unassigned.
  where.ownerId = requested === req.user!.userId || requested === null ? requested : mine;
}

/** Whether one record (by its owner) is visible to this person. */
export function canSeeCrmRecord(req: AuthRequest, ownerId: string | null | undefined): boolean {
  return seesAllCrm(req) || !ownerId || ownerId === req.user!.userId;
}
