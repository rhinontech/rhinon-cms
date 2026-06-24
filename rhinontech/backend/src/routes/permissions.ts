import { Router, Response } from "express";
import { Permission } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";

const router = Router();

router.use(authenticate);

router.get("/", async (_req: AuthRequest, res: Response) => {
  const permissions = await Permission.findAll();
  res.json(permissions);
});

export default router;
