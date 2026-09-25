import { Router, Response, NextFunction } from "express";
import { authenticate, AuthRequest } from "../middleware/authenticate";
import { MailboxAddress, User } from "../models";
import { LOCAL_PART_PATTERN, addressTaken } from "../services/userMailboxes";

/**
 * Extra email addresses (hello@, support@) and who each belongs to.
 *
 * Superadmin only: an address carries every message ever sent to it, so
 * handing one out is handing over that history.
 */
const router = Router();

router.use(authenticate);
router.use((req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.roleSlug !== "superadmin" || req.user?.userType === "guest") {
    res.status(403).json({ message: "Only the Super Admin can manage email addresses." });
    return;
  }
  next();
});

const assigneeInclude = { model: User, as: "assignee", attributes: ["id", "fullName", "companyEmail", "status"] };

function serialize(row: MailboxAddress, emailDomain: string) {
  const json = row.toJSON() as unknown as Record<string, unknown>;
  return { ...json, address: `${row.localPart}@${emailDomain}` };
}

/** An assignee must be an active internal member of this workspace (tenant-scoped lookup). */
async function checkAssignee(userId: unknown): Promise<string | null | undefined> {
  if (userId === undefined) return undefined;
  if (userId === null || userId === "") return null;
  const user = await User.findOne({ where: { id: String(userId), userType: "internal" }, attributes: ["id", "status"] });
  if (!user || user.status === "inactive") throw Object.assign(new Error("Pick an active team member."), { status: 400 });
  return user.id;
}

function cleanName(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  const name = typeof value === "string" ? value.replace(/[\r\n<>"]/g, "").trim().slice(0, 120) : "";
  return name || null;
}

router.get("/", async (req: AuthRequest, res: Response) => {
  const rows = await MailboxAddress.findAll({ include: [assigneeInclude], order: [["localPart", "ASC"]] });
  res.json({ domain: req.user!.emailDomain, addresses: rows.map((r) => serialize(r, req.user!.emailDomain)) });
});

router.post("/", async (req: AuthRequest, res: Response) => {
  const localPart = String(req.body?.localPart || "").trim().toLowerCase();
  if (!LOCAL_PART_PATTERN.test(localPart)) {
    res.status(400).json({ message: "Use letters, numbers, dots, hyphens or underscores — like hello or support." });
    return;
  }
  const taken = await addressTaken(localPart, req.user!.emailDomain);
  if (taken) {
    res.status(409).json({ message: taken });
    return;
  }
  try {
    const row = await MailboxAddress.create({
      localPart,
      displayName: cleanName(req.body?.displayName) ?? null,
      assignedUserId: (await checkAssignee(req.body?.assignedUserId)) ?? null,
    });
    await row.reload({ include: [assigneeInclude] });
    res.status(201).json(serialize(row, req.user!.emailDomain));
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Could not create the address." });
  }
});

router.patch("/:id", async (req: AuthRequest, res: Response) => {
  const row = await MailboxAddress.findByPk(String(req.params.id));
  if (!row) {
    res.status(404).json({ message: "Address not found" });
    return;
  }
  try {
    const assignedUserId = await checkAssignee(req.body?.assignedUserId);
    const displayName = cleanName(req.body?.displayName);
    await row.update({
      ...(assignedUserId !== undefined ? { assignedUserId } : {}),
      ...(displayName !== undefined ? { displayName } : {}),
    });
    await row.reload({ include: [assigneeInclude] });
    res.json(serialize(row, req.user!.emailDomain));
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message || "Could not update the address." });
  }
});

/**
 * Removes the address. Mail already received stays in the table but belongs to
 * nobody until the address is created again, at which point it comes back.
 */
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const row = await MailboxAddress.findByPk(String(req.params.id));
  if (!row) {
    res.status(404).json({ message: "Address not found" });
    return;
  }
  await row.destroy();
  res.json({ ok: true });
});

export default router;
