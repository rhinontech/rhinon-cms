import { Router, Response } from "express";
import { User } from "../models";
import { authenticate, authorizeAny, AuthRequest } from "../middleware/authenticate";

const router = Router();
router.use(authenticate);

const readAccess = authorizeAny("crm:read", "outreach:read");

/**
 * GET /crm/users - assignable record owners.
 *
 * Deliberately not /people: that route requires `people:read` (the HR directory),
 * which a sales user has no reason to hold. This returns only what an owner
 * picker needs, behind the CRM's own permission.
 */
router.get("/users", readAccess, async (_req: AuthRequest, res: Response) => {
  const users = await User.findAll({
    where: { status: "active" },
    attributes: ["id", "fullName", "companyEmail"],
    order: [["fullName", "ASC"]],
  });
  res.json(users);
});

export default router;
