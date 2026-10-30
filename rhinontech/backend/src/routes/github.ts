import { Router, Response, NextFunction } from "express";
import { Op } from "sequelize";
import {
  authenticate, authorize, requireInternal, requirePlatformOrg, AuthRequest,
} from "../middleware/authenticate";
import { Project, ProjectRepo, ProjectSecret, RepoCommit, User } from "../models";
import type { ProjectSecretKind } from "../models/GitHub";
import { canAccessProject, getHiddenProjectIds } from "../services/workAccess";
import { encryptSecret, decryptSecret } from "../services/totp";
import { auditRequest } from "../services/audit";
import {
  GitHubError, asInstallation, githubConfigured, installUrl, listAvailableRepos,
} from "../services/github/app";
import { backfillCommits } from "../services/github/commits";
import { groupingJob, startGroupingJob, syncRepoTags } from "../services/github/grouping";
import { generateSshKeyPair, removeDeployKey } from "../services/github/keys";

/**
 * Work ↔ GitHub: repo links, the commit feed, deploy keys and per-project
 * server credentials.
 *
 * Platform-only for now: one GitHub App, installed on Rhinon Tech's org. Opening
 * it to tenants means per-org installations, which this schema allows (links
 * are tenant-scoped) but the routes don't yet offer.
 */
const router = Router();
router.use(authenticate, requirePlatformOrg, requireInternal, authorize("work:read"));

const canWrite = authorize("work:write");
/** Keys of the admin panel's STATUS_CHIP palette. */
const REPO_COLORS = ["blue", "indigo", "cyan", "amber", "green", "stone", "red", "purple"];

const fail = (res: Response, err: any, what: string) => {
  console.error(`[GitHub] ${what}:`, err.message);
  const status = err instanceof GitHubError && err.status < 500 ? 400 : 500;
  res.status(status).json({ message: err instanceof GitHubError ? `GitHub: ${err.message}` : `Could not ${what}` });
};

/** Loads :projectId and 404s when it doesn't exist or isn't visible to this user. */
async function projectGuard(req: AuthRequest, res: Response, next: NextFunction) {
  const project = await Project.findByPk(req.params.projectId, { attributes: ["id", "name"] });
  if (!project || !(await canAccessProject(project.id, req))) {
    res.status(404).json({ message: "Project not found" });
    return;
  }
  (req as any).project = project;
  next();
}

/** Loads :linkId through its project's visibility. */
async function linkGuard(req: AuthRequest, res: Response, next: NextFunction) {
  const link = await ProjectRepo.findByPk(req.params.linkId);
  if (!link || !(await canAccessProject(link.projectId, req))) {
    res.status(404).json({ message: "Repository link not found" });
    return;
  }
  (req as any).link = link;
  next();
}

const publicLink = (l: ProjectRepo) => ({
  id: l.id,
  projectId: l.projectId,
  repoFullName: l.repoFullName,
  defaultBranch: l.defaultBranch,
  color: l.color,
  autoCreateTasks: l.autoCreateTasks,
  deployKeyPublic: l.deployKeyPublic,
  deployKeyReadOnly: l.deployKeyReadOnly,
  hasDeployKey: Boolean(l.deployKeyId),
  lastPushAt: l.lastPushAt,
  createdAt: l.createdAt,
});

router.get("/status", (_req, res) => {
  res.json({ configured: githubConfigured(), installUrl: installUrl() });
});

router.get("/repos/available", canWrite, async (_req, res) => {
  if (!githubConfigured()) {
    res.status(400).json({ message: "GitHub App is not configured on the server." });
    return;
  }
  try {
    res.json(await listAvailableRepos());
  } catch (err: any) {
    fail(res, err, "list repositories");
  }
});

// ---------- Commit feed ----------

/**
 * GET /github/commits?from=&to=&projectId=&userId=
 * from/to are ISO instants; the panel sends the bounds of an IST day.
 */
router.get("/commits", async (req: AuthRequest, res: Response) => {
  try {
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 86400_000);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      res.status(400).json({ message: "Invalid date range" });
      return;
    }
    const where: any = { committedAt: { [Op.gte]: from, [Op.lt]: to } };
    if (req.query.userId) where.userId = String(req.query.userId);
    const hidden = await getHiddenProjectIds(req);
    const projectId = req.query.projectId ? String(req.query.projectId) : null;
    if (projectId && hidden.includes(projectId)) {
      res.json([]);
      return;
    }
    if (projectId) where.projectId = projectId;
    else if (hidden.length) where.projectId = { [Op.notIn]: hidden };

    const commits = await RepoCommit.findAll({
      where,
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "author", attributes: ["id", "fullName"] },
      ],
      order: [["committedAt", "DESC"]],
      limit: 1000,
    });
    res.json(commits);
  } catch (err: any) {
    fail(res, err, "load commits");
  }
});

// ---------- Repo links ----------

router.get("/projects/:projectId/repos", projectGuard, async (req: AuthRequest, res: Response) => {
  const links = await ProjectRepo.findAll({ where: { projectId: req.params.projectId }, order: [["createdAt", "ASC"]] });
  res.json(links.map(publicLink));
});

router.post("/projects/:projectId/repos", canWrite, projectGuard, async (req: AuthRequest, res: Response) => {
  const repoId = Number(req.body?.repoId);
  if (!Number.isFinite(repoId)) {
    res.status(400).json({ message: "repoId is required" });
    return;
  }
  try {
    // Never trust client-supplied repo names or installation ids: re-read them from GitHub.
    const repo = (await listAvailableRepos()).find((r) => r.id === repoId);
    if (!repo) {
      res.status(404).json({ message: "The GitHub App can't see that repository. Install it on the repo first." });
      return;
    }
    const existing = await ProjectRepo.findOne({ where: { projectId: req.params.projectId, repoId } });
    if (existing) {
      res.status(409).json({ message: "That repository is already linked to this project." });
      return;
    }
    const link = await ProjectRepo.create({
      projectId: req.params.projectId as string,
      repoFullName: repo.fullName,
      repoId: repo.id,
      installationId: repo.installationId,
      defaultBranch: repo.defaultBranch,
      createdById: req.user!.userId,
    });
    // The last two weeks, so the feed has something in it straight away.
    backfillCommits(link, 14).catch((err) => console.error("[GitHub] Backfill failed:", err.message));
    res.status(201).json(publicLink(link));
  } catch (err: any) {
    fail(res, err, "link repository");
  }
});

router.patch("/repos/:linkId", canWrite, linkGuard, async (req: AuthRequest, res: Response) => {
  const link: ProjectRepo = (req as any).link;
  const patch: Partial<{ autoCreateTasks: boolean; defaultBranch: string; color: string }> = {};
  if (typeof req.body?.color === "string" && REPO_COLORS.includes(req.body.color)) patch.color = req.body.color;
  if (typeof req.body?.autoCreateTasks === "boolean") patch.autoCreateTasks = req.body.autoCreateTasks;
  if (typeof req.body?.defaultBranch === "string" && req.body.defaultBranch.trim()) {
    patch.defaultBranch = req.body.defaultBranch.trim().slice(0, 200);
  }
  await link.update(patch);
  if (patch.color) await syncRepoTags(link);
  res.json(publicLink(link));
});

router.post("/repos/:linkId/sync", canWrite, linkGuard, async (req: AuthRequest, res: Response) => {
  const days = Math.min(Math.max(Number(req.body?.days) || 14, 1), 90);
  try {
    res.json(await backfillCommits((req as any).link, days));
  } catch (err: any) {
    fail(res, err, "sync commits");
  }
});

/**
 * POST /github/repos/:linkId/group  { from, to } — ISO instants; the panel
 * sends IST day bounds. Syncs that range from GitHub, then groups whatever in
 * it has no card yet. Runs in the background; poll the GET below.
 */
router.post("/repos/:linkId/group", canWrite, linkGuard, async (req: AuthRequest, res: Response) => {
  const from = req.body?.from ? new Date(req.body.from) : null;
  const to = req.body?.to ? new Date(req.body.to) : null;
  if (!from || !to || isNaN(+from) || isNaN(+to) || to <= from) {
    res.status(400).json({ message: "Pick a valid start and end date." });
    return;
  }
  if (+to - +from > 366 * 86400_000) {
    res.status(400).json({ message: "Pick a range of a year or less." });
    return;
  }
  if (from > new Date()) {
    res.status(400).json({ message: "The start date is in the future." });
    return;
  }
  try {
    const { job } = startGroupingJob((req as any).link, { from, to }, "manual");
    res.status(202).json(job);
  } catch (err: any) {
    res.status(409).json({ message: err.message });
  }
});

router.get("/repos/:linkId/group", linkGuard, (req: AuthRequest, res: Response) => {
  res.json(groupingJob(req.params.linkId as string));
});

router.delete("/repos/:linkId", canWrite, linkGuard, async (req: AuthRequest, res: Response) => {
  const link: ProjectRepo = (req as any).link;
  await removeDeployKey(link);
  await RepoCommit.destroy({ where: { projectRepoId: link.id } });
  await link.destroy();
  auditRequest(req, "github.repo_unlinked", { entityType: "project", entityId: link.projectId, metadata: { repo: link.repoFullName } });
  res.json({ ok: true });
});

// ---------- Deploy keys ----------

router.post("/repos/:linkId/deploy-key", canWrite, linkGuard, async (req: AuthRequest, res: Response) => {
  const link: ProjectRepo = (req as any).link;
  const readOnly = req.body?.readOnly !== false;
  try {
    const project = await Project.findByPk(link.projectId, { attributes: ["name"] });
    const title = `Rhinon Work · ${project?.name ?? "project"}`.slice(0, 100);
    const { publicKey, privateKey } = await generateSshKeyPair(title);
    const key = await asInstallation<{ id: number }>(Number(link.installationId), `/repos/${link.repoFullName}/keys`, {
      method: "POST",
      body: JSON.stringify({ title, key: publicKey, read_only: readOnly }),
    });
    // Rotate: the new key is live on GitHub before the old one is removed.
    await removeDeployKey(link);
    await link.update({
      deployKeyId: key.id,
      deployKeyPublic: publicKey,
      deployKeyPrivateEnc: encryptSecret(privateKey),
      deployKeyReadOnly: readOnly,
    });
    auditRequest(req, "github.deploy_key_created", { entityType: "project", entityId: link.projectId, metadata: { repo: link.repoFullName, readOnly } });
    res.json(publicLink(link));
  } catch (err: any) {
    fail(res, err, "create deploy key");
  }
});

router.delete("/repos/:linkId/deploy-key", canWrite, linkGuard, async (req: AuthRequest, res: Response) => {
  const link: ProjectRepo = (req as any).link;
  await removeDeployKey(link);
  await link.update({ deployKeyId: null, deployKeyPublic: null, deployKeyPrivateEnc: null });
  auditRequest(req, "github.deploy_key_removed", { entityType: "project", entityId: link.projectId, metadata: { repo: link.repoFullName } });
  res.json(publicLink(link));
});

router.post("/repos/:linkId/deploy-key/reveal", canWrite, linkGuard, async (req: AuthRequest, res: Response) => {
  const link: ProjectRepo = (req as any).link;
  if (!link.deployKeyPrivateEnc) {
    res.status(404).json({ message: "No deploy key" });
    return;
  }
  await auditRequest(req, "github.deploy_key_revealed", { entityType: "project", entityId: link.projectId, metadata: { repo: link.repoFullName } });
  res.json({ privateKey: decryptSecret(link.deployKeyPrivateEnc) });
});

// ---------- Project secrets (server SSH keys, env, tokens) ----------

const SECRET_KINDS: ProjectSecretKind[] = ["ssh_key", "env", "token", "note"];

const publicSecret = (s: ProjectSecret) => ({
  id: s.id,
  projectId: s.projectId,
  name: s.name,
  kind: s.kind,
  host: s.host,
  username: s.username,
  port: s.port,
  publicKey: s.publicKey,
  createdAt: s.createdAt,
  creator: (s as any).creator ?? null,
});

router.get("/projects/:projectId/secrets", projectGuard, async (req: AuthRequest, res: Response) => {
  const secrets = await ProjectSecret.findAll({
    where: { projectId: req.params.projectId },
    include: [{ model: User, as: "creator", attributes: ["id", "fullName"] }],
    order: [["createdAt", "ASC"]],
  });
  res.json(secrets.map(publicSecret));
});

/**
 * Body: { name, kind, host?, username?, port?, value?, generate? }
 * kind "ssh_key" with generate: true creates a fresh key pair and returns the
 * public half to paste into the server's authorized_keys.
 */
router.post("/projects/:projectId/secrets", canWrite, projectGuard, async (req: AuthRequest, res: Response) => {
  const b = req.body ?? {};
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 120) : "";
  const kind = SECRET_KINDS.includes(b.kind) ? (b.kind as ProjectSecretKind) : null;
  if (!name || !kind) {
    res.status(400).json({ message: "name and a valid kind are required" });
    return;
  }
  const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const port = Number.isInteger(Number(b.port)) && Number(b.port) > 0 && Number(b.port) < 65536 ? Number(b.port) : null;

  try {
    let value = typeof b.value === "string" ? b.value : "";
    let publicKey: string | null = null;
    if (kind === "ssh_key" && b.generate === true) {
      const pair = await generateSshKeyPair(`${name} (Rhinon Work)`.slice(0, 100));
      value = pair.privateKey;
      publicKey = pair.publicKey;
    }
    if (!value) {
      res.status(400).json({ message: "A value is required (or generate: true for an SSH key)" });
      return;
    }
    if (value.length > 20000) {
      res.status(400).json({ message: "Value is too long" });
      return;
    }
    const secret = await ProjectSecret.create({
      projectId: req.params.projectId as string,
      name,
      kind,
      host: str(b.host, 255),
      username: str(b.username, 100),
      port,
      valueEnc: encryptSecret(value),
      publicKey: publicKey ?? str(b.publicKey, 5000),
      createdById: req.user!.userId,
    });
    auditRequest(req, "project.secret_created", { entityType: "project", entityId: secret.projectId, metadata: { name, kind } });
    res.status(201).json(publicSecret(secret));
  } catch (err: any) {
    fail(res, err, "save secret");
  }
});

router.post("/projects/:projectId/secrets/:secretId/reveal", canWrite, projectGuard, async (req: AuthRequest, res: Response) => {
  const secret = await ProjectSecret.findOne({ where: { id: req.params.secretId, projectId: req.params.projectId } });
  if (!secret) {
    res.status(404).json({ message: "Secret not found" });
    return;
  }
  // Awaited, unlike the others, so the trail is written before the value leaves.
  await auditRequest(req, "project.secret_revealed", { entityType: "project", entityId: secret.projectId, metadata: { name: secret.name } });
  res.json({ value: decryptSecret(secret.valueEnc) });
});

router.delete("/projects/:projectId/secrets/:secretId", canWrite, projectGuard, async (req: AuthRequest, res: Response) => {
  const secret = await ProjectSecret.findOne({ where: { id: req.params.secretId, projectId: req.params.projectId } });
  if (!secret) {
    res.status(404).json({ message: "Secret not found" });
    return;
  }
  await secret.destroy();
  auditRequest(req, "project.secret_deleted", { entityType: "project", entityId: secret.projectId, metadata: { name: secret.name } });
  res.json({ ok: true });
});

export default router;
