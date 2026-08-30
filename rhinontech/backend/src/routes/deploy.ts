import { Router, Response } from "express";
import { spawn } from "child_process";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { Deployment } from "../models";
import { authenticate, authorize, AuthRequest } from "../middleware/authenticate";
import {
  DEPLOY_TARGETS,
  DEPLOY_ENABLED,
  DEPLOY_LOG_DIR,
  deployExitPath,
  deployLogPath,
  getDeployTarget,
  type DeployTarget,
  type DeployKind,
} from "../config/deployTargets";

/**
 * Jenkins-style manual deploys, triggered from Settings → Deploy.
 *
 * There is no SSH and no PEM key anywhere in this flow: the API already runs on the
 * EC2 box as the same `ubuntu` user an operator would SSH in as, so the deploy is a
 * plain local `git pull && npm run build && pm2 restart`. Docker targets (FurrCircle)
 * take the same path through a different script: `git pull && docker compose restart`.
 *
 * The catch is that restarting "prod" kills THIS process mid-request. So the work is
 * handed to a detached child (scripts/deploy.sh) that outlives us, streams to a log
 * file, and drops an exit-code file when it finishes. Nothing here ever awaits the
 * child — status is reconstructed from those files on the next poll, which is what
 * makes the flow survive the API restarting underneath it.
 */
const router = Router();
router.use(authenticate);

const SCRIPTS_DIR = path.join(__dirname, "..", "..", "scripts");
const SCRIPT_FOR: Record<DeployKind, string> = {
  pm2: path.join(SCRIPTS_DIR, "deploy.sh"),
  docker: path.join(SCRIPTS_DIR, "deploy-docker.sh"),
};
/** A run that has produced no exit file by now is assumed dead (script SIGKILLed, box rebooted). */
const STALE_AFTER_MS = 20 * 60 * 1000;
const metaPath = (id: string) => path.join(DEPLOY_LOG_DIR, `${id}.meta`);

function publicTarget(t: DeployTarget) {
  return {
    key: t.key,
    label: t.label,
    kind: t.kind,
    app: t.app,
    branch: t.branch,
    // What actually gets restarted — a pm2 process or a compose service.
    unit: t.kind === "docker" ? `${t.compose!.service} (compose)` : t.proc!,
    port: t.port,
    description: t.description,
  };
}

async function readIfExists(p: string): Promise<string | null> {
  try {
    return await fsp.readFile(p, "utf8");
  } catch {
    return null;
  }
}

/** Parse the script's key=value handoff (see scripts/deploy.sh). */
function parseMeta(raw: string | null) {
  const out: Record<string, string> = {};
  for (const line of (raw || "").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0) out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

/**
 * Bring a `running` row in line with what's on disk. Idempotent and safe to call on
 * every read — the detached script can't write to the DB itself, so this is the only
 * place a deploy ever becomes success/failed.
 */
async function finalize(dep: Deployment): Promise<Deployment> {
  if (dep.status !== "running") return dep;

  const exitRaw = await readIfExists(deployExitPath(dep.id));
  const meta = parseMeta(await readIfExists(metaPath(dep.id)));
  const patch: any = {};
  if (meta.before && !dep.commitBefore) patch.commitBefore = meta.before;
  if (meta.after) patch.commitAfter = meta.after;
  if (meta.message) patch.commitMessage = meta.message;

  if (exitRaw !== null) {
    const code = parseInt(exitRaw.trim(), 10);
    patch.exitCode = Number.isNaN(code) ? 1 : code;
    patch.status = patch.exitCode === 0 ? "success" : "failed";
    patch.finishedAt = new Date();
    patch.log = (await readIfExists(deployLogPath(dep.id))) || dep.log;
  } else if (Date.now() - new Date(dep.startedAt).getTime() > STALE_AFTER_MS) {
    patch.status = "failed";
    patch.exitCode = -1;
    patch.finishedAt = new Date();
    patch.log =
      ((await readIfExists(deployLogPath(dep.id))) || "") +
      "\n=== ABANDONED — no result after 20 minutes; the deploy script died or the box restarted. ===\n";
  }

  if (Object.keys(patch).length === 0) return dep;
  return dep.update(patch);
}

// GET /deploy/targets — the deployable environments plus each one's latest run.
router.get("/targets", authorize("deploy:read"), async (_req: AuthRequest, res: Response) => {
  try {
    const targets = await Promise.all(
      Object.values(DEPLOY_TARGETS).map(async (t) => {
        const latest = await Deployment.findOne({
          where: { target: t.key },
          order: [["createdAt", "DESC"]],
        });
        return {
          ...publicTarget(t),
          latest: latest ? summarize(await finalize(latest)) : null,
        };
      })
    );
    res.json({ enabled: DEPLOY_ENABLED, targets });
  } catch (err) {
    console.error("List deploy targets failed:", err);
    res.status(500).json({ message: "Could not load deploy targets" });
  }
});

// GET /deploy/history?target=prod — recent runs, newest first.
router.get("/history", authorize("deploy:read"), async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    const target = req.query.target ? String(req.query.target) : "";
    if (target && getDeployTarget(target)) where.target = target;

    const rows = await Deployment.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: Math.min(Number(req.query.limit) || 20, 100),
    });
    const deployments = await Promise.all(rows.map(async (r) => summarize(await finalize(r))));
    res.json({ deployments });
  } catch (err) {
    console.error("Deploy history failed:", err);
    res.status(500).json({ message: "Could not load deploy history" });
  }
});

// GET /deploy/run/:id — one run with its log, for the live console.
router.get("/run/:id", authorize("deploy:read"), async (req: AuthRequest, res: Response) => {
  try {
    const dep = await Deployment.findByPk(req.params.id);
    if (!dep) {
      res.status(404).json({ message: "Deployment not found" });
      return;
    }
    const current = await finalize(dep);
    // While running the file is the source of truth; once finished it has been ingested.
    const log = current.log ?? (await readIfExists(deployLogPath(current.id))) ?? "";
    res.json({ deployment: { ...summarize(current), log } });
  } catch (err) {
    console.error("Deploy status failed:", err);
    res.status(500).json({ message: "Could not load deployment" });
  }
});

// POST /deploy/:target — pull, build and restart. Returns immediately with the run id.
router.post("/:target", authorize("deploy:trigger"), async (req: AuthRequest, res: Response) => {
  const target = getDeployTarget(req.params.target);
  if (!target) {
    res.status(400).json({ message: "Unknown deploy target" });
    return;
  }
  if (!DEPLOY_ENABLED) {
    res.status(400).json({
      message: "Deploys are disabled on this server. Set DEPLOY_ENABLED=true in the backend .env.",
    });
    return;
  }

  try {
    if (!fs.existsSync(target.repo)) {
      res.status(400).json({ message: `Checkout not found on this server: ${target.repo}` });
      return;
    }

    // One deploy per target at a time — two concurrent `git pull`s in one checkout
    // leave it in a state neither run expected.
    const inFlight = await Deployment.findOne({
      where: { target: target.key, status: "running" },
      order: [["createdAt", "DESC"]],
    });
    if (inFlight && (await finalize(inFlight)).status === "running") {
      res.status(409).json({
        message: `A ${target.label} deploy is already running.`,
        deploymentId: inFlight.id,
      });
      return;
    }

    const dep = await Deployment.create({
      target: target.key,
      status: "running",
      triggeredById: req.user!.userId,
      triggeredByName: req.user!.fullName,
      startedAt: new Date(),
    });

    await fsp.mkdir(DEPLOY_LOG_DIR, { recursive: true });

    // Run a COPY of the script: `git pull` rewrites scripts/deploy.sh underneath a
    // running bash, which reads its script lazily and would execute garbage.
    const runner = path.join(os.tmpdir(), `rhinon-deploy-${dep.id}.sh`);
    await fsp.copyFile(SCRIPT_FOR[target.kind], runner);
    await fsp.chmod(runner, 0o755);

    const child = spawn("bash", [runner], {
      // detached — this child must survive `pm2 restart` killing the API that spawned it.
      detached: true,
      stdio: "ignore",
      env: {
        ...process.env,
        REPO: target.repo,
        BRANCH: target.branch,
        PORT: String(target.port),
        HEALTH_PATH: target.healthPath,
        // Only one of these pairs is read, by the script the kind selected.
        PROC: target.proc || "",
        COMPOSE_DIR: target.compose?.dir || "",
        SERVICE: target.compose?.service || "",
        LOG: deployLogPath(dep.id),
        EXIT_FILE: deployExitPath(dep.id),
        META_FILE: metaPath(dep.id),
      },
    });
    child.on("error", async (err) => {
      console.error("Deploy spawn failed:", err);
      await dep.update({
        status: "failed",
        exitCode: -1,
        finishedAt: new Date(),
        log: `Could not start the deploy script: ${err.message}`,
      });
    });
    child.unref();

    console.log(`[deploy] ${target.key} started by ${req.user!.companyEmail} (${dep.id})`);
    res.status(202).json({ deploymentId: dep.id, deployment: summarize(dep) });
  } catch (err) {
    console.error("Trigger deploy failed:", err);
    res.status(500).json({ message: "Could not start the deploy" });
  }
});

function summarize(d: Deployment) {
  return {
    id: d.id,
    target: d.target,
    status: d.status,
    triggeredByName: d.triggeredByName,
    commitBefore: d.commitBefore,
    commitAfter: d.commitAfter,
    commitMessage: d.commitMessage,
    exitCode: d.exitCode,
    startedAt: d.startedAt,
    finishedAt: d.finishedAt,
  };
}

export default router;
