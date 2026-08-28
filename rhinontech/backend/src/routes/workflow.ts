import { Router, Response } from "express";
import { authenticate, authorizeAny, requireInternal, AuthRequest } from "../middleware/authenticate";
import { FieldDefinition, Task, WorkflowStatus } from "../models";
import { canAccessProject } from "../services/workAccess";
import { workflowFor } from "../services/taskStatus";

const router = Router();
router.use(authenticate, authorizeAny("work:read", "crm:read"));

/**
 * Board columns and Table columns.
 *
 * Both are scoped the same way: ?projectId= returns that project's own set if it
 * has one, otherwise the company-wide defaults (projectId null). Writing without
 * a projectId edits the defaults, which every project inherits.
 */

function readProjectId(req: AuthRequest): string | null {
  const raw = req.query.projectId;
  return typeof raw === "string" && raw ? raw : null;
}

async function guardProject(projectId: string | null, req: AuthRequest, res: Response): Promise<boolean> {
  if (!projectId) return true;
  if (await canAccessProject(projectId, req)) return true;
  res.status(404).json({ message: "Project not found" });
  return false;
}

// --- STATUSES ---------------------------------------------------------------

router.get("/statuses", async (req: AuthRequest, res: Response) => {
  try {
    const projectId = readProjectId(req);
    if (!(await guardProject(projectId, req, res))) return;
    res.json(await workflowFor(projectId));
  } catch {
    res.status(500).json({ message: "Failed to fetch statuses" });
  }
});

router.post("/statuses", requireInternal, async (req: AuthRequest, res: Response) => {
  try {
    const { name, color, group, projectId, isDefault } = req.body;
    if (!name?.trim()) { res.status(400).json({ message: "name is required" }); return; }
    if (!(await guardProject(projectId ?? null, req, res))) return;

    const count = await WorkflowStatus.count({ where: { projectId: projectId ?? null } });
    const status = await WorkflowStatus.create({
      projectId: projectId ?? null,
      name: String(name).trim(),
      color: color || "blue",
      group: group || "Active",
      order: count,
      isDefault: Boolean(isDefault),
    });
    res.status(201).json(status);
  } catch {
    res.status(500).json({ message: "Failed to create status" });
  }
});

router.put("/statuses/:id", requireInternal, async (req: AuthRequest, res: Response) => {
  try {
    const status = await WorkflowStatus.findByPk(req.params.id);
    if (!status) { res.status(404).json({ message: "Status not found" }); return; }
    if (!(await guardProject(status.projectId, req, res))) return;

    const { name, color, group, order, isDefault } = req.body;
    // Only one default per workflow, or new tasks would land unpredictably.
    if (isDefault) {
      await WorkflowStatus.update({ isDefault: false }, { where: { projectId: status.projectId } });
    }
    await status.update({
      ...(name !== undefined && { name: String(name).trim() }),
      ...(color !== undefined && { color }),
      ...(group !== undefined && { group }),
      ...(order !== undefined && { order }),
      ...(isDefault !== undefined && { isDefault: Boolean(isDefault) }),
    });
    res.json(status);
  } catch {
    res.status(500).json({ message: "Failed to update status" });
  }
});

router.delete("/statuses/:id", requireInternal, async (req: AuthRequest, res: Response) => {
  try {
    const status = await WorkflowStatus.findByPk(req.params.id);
    if (!status) { res.status(404).json({ message: "Status not found" }); return; }
    if (!(await guardProject(status.projectId, req, res))) return;

    // Refusing rather than cascading: deleting a column must never silently
    // delete or orphan the tasks sitting in it.
    const inUse = await Task.count({ where: { statusId: status.id } });
    if (inUse > 0) {
      res.status(409).json({ message: `${inUse} task(s) are in "${status.name}". Move them first.` });
      return;
    }
    await status.destroy();
    res.json({ message: "Status deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete status" });
  }
});

router.put("/statuses/reorder", requireInternal, async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) { res.status(400).json({ message: "ids array is required" }); return; }
    await Promise.all(ids.map((id: string, i: number) => WorkflowStatus.update({ order: i }, { where: { id } })));
    res.json({ message: "Reordered" });
  } catch {
    res.status(500).json({ message: "Failed to reorder" });
  }
});

// --- CUSTOM FIELDS ----------------------------------------------------------

router.get("/fields", async (req: AuthRequest, res: Response) => {
  try {
    const projectId = readProjectId(req);
    if (!(await guardProject(projectId, req, res))) return;
    // Global fields plus this project's own — a project sees both, like Wrike.
    const fields = await FieldDefinition.findAll({
      where: projectId ? ({ projectId: [null, projectId] } as any) : { projectId: null },
      order: [["order", "ASC"]],
    });
    res.json(fields);
  } catch {
    res.status(500).json({ message: "Failed to fetch fields" });
  }
});

router.post("/fields", requireInternal, async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, options, projectId } = req.body;
    if (!name?.trim()) { res.status(400).json({ message: "name is required" }); return; }
    if (!(await guardProject(projectId ?? null, req, res))) return;

    const count = await FieldDefinition.count({ where: { projectId: projectId ?? null } });
    const field = await FieldDefinition.create({
      projectId: projectId ?? null,
      name: String(name).trim(),
      type: type || "text",
      options: Array.isArray(options) ? options : null,
      order: count,
      createdById: req.user!.userId,
    });
    res.status(201).json(field);
  } catch {
    res.status(500).json({ message: "Failed to create field" });
  }
});

router.put("/fields/:id", requireInternal, async (req: AuthRequest, res: Response) => {
  try {
    const field = await FieldDefinition.findByPk(req.params.id);
    if (!field) { res.status(404).json({ message: "Field not found" }); return; }
    if (!(await guardProject(field.projectId, req, res))) return;

    const { name, type, options, order } = req.body;
    await field.update({
      ...(name !== undefined && { name: String(name).trim() }),
      ...(type !== undefined && { type }),
      ...(options !== undefined && { options: Array.isArray(options) ? options : null }),
      ...(order !== undefined && { order }),
    });
    res.json(field);
  } catch {
    res.status(500).json({ message: "Failed to update field" });
  }
});

router.delete("/fields/:id", requireInternal, async (req: AuthRequest, res: Response) => {
  try {
    const field = await FieldDefinition.findByPk(req.params.id);
    if (!field) { res.status(404).json({ message: "Field not found" }); return; }
    if (!(await guardProject(field.projectId, req, res))) return;
    // Values live in Task.customFields keyed by this id; they become orphaned
    // JSON keys, harmless and ignored by the reader.
    await field.destroy();
    res.json({ message: "Field deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete field" });
  }
});

export default router;
