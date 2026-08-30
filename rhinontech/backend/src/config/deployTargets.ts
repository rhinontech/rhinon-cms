import path from "path";
import os from "os";

/**
 * Deploy targets, defined HERE and nowhere else.
 *
 * The admin panel sends only a key ("prod" | "beta"); the repo path, branch and pm2
 * process name are never accepted from the client. If a caller could supply a path or
 * a command, this endpoint would be a remote shell for anyone holding a stolen token.
 */
export type DeployKind = "pm2" | "docker";

export interface DeployTarget {
  key: string;
  label: string;
  /** How this app is served — decides which deploy script runs. */
  kind: DeployKind;
  /** Absolute path to the git checkout on this EC2 box. */
  repo: string;
  branch: string;
  /** pm2 process name to restart once the build succeeds. `kind: "pm2"` only. */
  proc?: string;
  /** Directory holding docker-compose.yml, and the service to restart. `kind: "docker"` only. */
  compose?: { dir: string; service: string };
  /** Local port and path used for the post-restart health check. */
  port: number;
  healthPath: string;
  /** Apps grouped in the UI, so Rhinon and FurrCircle don't read as one system. */
  app: string;
  description: string;
}

export const DEPLOY_TARGETS: Record<string, DeployTarget> = {
  prod: {
    key: "prod",
    label: "Production",
    kind: "pm2",
    app: "Rhinon Tech",
    repo: process.env.DEPLOY_PROD_REPO || "/home/ubuntu/rhinon-cms",
    branch: "main",
    proc: "rhinontech-backend",
    port: 5002,
    healthPath: "/health",
    description: "api.rhinontech.in — live backend serving the admin panel and website.",
  },
  beta: {
    key: "beta",
    label: "Beta",
    kind: "pm2",
    app: "Rhinon Tech",
    repo: process.env.DEPLOY_BETA_REPO || "/home/ubuntu/rhinon-cms-beta",
    branch: "beta",
    proc: "rhinontech-backend-beta",
    port: 5003,
    healthPath: "/health",
    description: "Staging backend on port 5003 — safe to deploy any time.",
  },
  furrcircle: {
    key: "furrcircle",
    label: "FurrCircle API",
    kind: "docker",
    app: "FurrCircle",
    repo: process.env.DEPLOY_FURRCIRCLE_REPO || "/home/ubuntu/FurrCircle",
    branch: "main",
    compose: {
      dir: (process.env.DEPLOY_FURRCIRCLE_REPO || "/home/ubuntu/FurrCircle") + "/backend",
      service: "backend",
    },
    port: 5001,
    // No liveness route on this app — /api/health is pet medical records. `/` returns 200.
    healthPath: "/",
    description: "api.furrcircle.com — Docker container, restarted in place (no image rebuild).",
  },
};

export function getDeployTarget(key: string): DeployTarget | null {
  return Object.prototype.hasOwnProperty.call(DEPLOY_TARGETS, key)
    ? DEPLOY_TARGETS[key]
    : null;
}

/**
 * Where the deploy script streams its output. Lives outside every checkout so a
 * `git pull` (or a branch switch) can never disturb an in-flight run's log.
 */
export const DEPLOY_LOG_DIR =
  process.env.DEPLOY_LOG_DIR || path.join(os.homedir(), "deploy-logs");

/**
 * Deploying is off unless explicitly enabled, so a laptop or a rebuilt instance
 * never exposes a self-restart button by accident. Set DEPLOY_ENABLED=true in the
 * server's .env.
 */
export const DEPLOY_ENABLED = process.env.DEPLOY_ENABLED === "true";

export const deployLogPath = (id: string) => path.join(DEPLOY_LOG_DIR, `${id}.log`);
/** Written by the script's EXIT trap — the only signal that a detached run finished. */
export const deployExitPath = (id: string) => path.join(DEPLOY_LOG_DIR, `${id}.exit`);
