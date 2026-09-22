import { Router, Response } from "express";
import { Permission } from "../models";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { permissionsForOrg } from "../config/permissions";

const router = Router();

router.use(authenticate);

// The catalog drives the Settings > Roles toggles, so a workspace is shown only
// what it can actually hold: listing the platform modules there would offer a
// customer switches that grant nothing (the routes refuse them anyway).
router.get("/", async (req: AuthRequest, res: Response) => {
  const allowed = new Set(permissionsForOrg(Boolean(req.user?.isPlatformOrg)));
  const permissions = await Permission.findAll();
  res.json(permissions.filter((p) => allowed.has(p.name)));
});

export default router;
