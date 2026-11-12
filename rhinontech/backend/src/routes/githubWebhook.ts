import { Request, Response } from "express";
import crypto from "crypto";
import { ProjectRepo } from "../models";
import { runAsSystem, runForOrg } from "../services/tenantContext";
import { ingestCommits } from "../services/github/commits";

/**
 * POST /webhooks/github — the GitHub App's webhook.
 *
 * Mounted ahead of the global JSON parser with express.raw: the HMAC is over
 * the exact bytes GitHub sent, and a re-serialised object would not match.
 */
function signatureValid(raw: Buffer, header: string | undefined): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${crypto.createHmac("sha256", secret).update(raw).digest("hex")}`);
  const given = Buffer.from(header);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

export async function githubWebhook(req: Request, res: Response) {
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  if (!signatureValid(raw, req.header("x-hub-signature-256"))) {
    res.status(401).json({ message: "Invalid signature" });
    return;
  }

  const event = req.header("x-github-event");
  let payload: any;
  try {
    payload = JSON.parse(raw.toString("utf8"));
  } catch {
    res.status(400).json({ message: "Invalid payload" });
    return;
  }

  // Answer first: GitHub gives up after 10s, and ingest is ours to retry, not theirs.
  res.status(202).json({ ok: true });
  if (event !== "push" || !payload?.repository?.id || payload.deleted) return;

  const branch = typeof payload.ref === "string" && payload.ref.startsWith("refs/heads/")
    ? payload.ref.slice("refs/heads/".length)
    : null;
  if (!branch) return; // tag pushes

  const commits = (payload.commits ?? []).map((c: any) => ({
    sha: c.id,
    message: c.message ?? "",
    url: c.url,
    authorName: c.author?.name,
    authorEmail: c.author?.email,
    authorLogin: c.author?.username ?? null,
    timestamp: c.timestamp,
    files: [...new Set<string>([...(c.added ?? []), ...(c.modified ?? []), ...(c.removed ?? [])])],
  }));

  try {
    // The repo is how we find the tenant, so the lookup itself is unscoped.
    const links = await runAsSystem("github:webhook", () =>
      ProjectRepo.findAll({ where: { repoId: payload.repository.id } })
    );
    for (const link of links) {
      const orgId = link.get("organizationId") as string;
      await runForOrg(orgId, async () => {
        const stats = await ingestCommits(link, commits, { branch, applyEffects: true });
        await link.update({ lastPushAt: new Date() });
        if (stats.stored) {
          console.log(`[GitHub] ${link.repoFullName}@${branch}: ${stats.stored} commits, ${stats.linked} links, ${stats.closed} closed`);
        }
      }, { label: "github:push" });
    }
  } catch (err: any) {
    console.error("[GitHub] Push ingest failed:", err.message);
  }
}
