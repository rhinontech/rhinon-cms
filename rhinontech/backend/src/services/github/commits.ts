import { Op, UniqueConstraintError, cast, col, where as sqlWhere } from "sequelize";
import { ProjectRepo, RepoCommit, Task, User } from "../../models";
import { logActivity } from "../taskActivity";
import { workflowFor } from "../taskStatus";
import { asInstallation } from "./app";

/**
 * Turns pushed commits into Work activity.
 *
 * Tasks have no short number, so a commit names one by the first 8 hex chars
 * of its id: "T-1a2b3c4d". The admin panel shows that ref on every task.
 *   - any mention links the commit to the task (activity entry);
 *   - "fixes/closes/resolves T-…" on the default branch also moves it to Completed;
 *   - everything else waits for AI grouping into feature cards (grouping.ts).
 *
 * Callers must already be inside the repo's org context (runForOrg).
 */
const REF = /\bT-([0-9a-f]{8})\b/gi;
const CLOSE_REF = /\b(?:fix(?:e[sd])?|close[sd]?|resolve[sd]?)\s*:?\s+T-([0-9a-f]{8})\b/gi;

export interface IncomingCommit {
  sha: string;
  message: string;
  url?: string | null;
  authorName?: string | null;
  authorEmail?: string | null;
  authorLogin?: string | null;
  timestamp: string | Date;
  /** Changed paths, when the source provides them (push payloads do). */
  files?: string[] | null;
}

export interface IngestOptions {
  branch: string | null;
  /** Backfills only record and link — they never close or create cards retroactively. */
  applyEffects: boolean;
}

const prefixesIn = (re: RegExp, text: string) =>
  [...new Set([...text.matchAll(re)].map((m) => m[1].toLowerCase()))];

async function tasksByPrefix(projectId: string, prefixes: string[]): Promise<Map<string, Task>> {
  const found = new Map<string, Task>();
  if (!prefixes.length) return found;
  const tasks = await Task.findAll({
    where: {
      projectId,
      [Op.or]: prefixes.map((p) => sqlWhere(cast(col("Task.id"), "text"), { [Op.like]: `${p}%` })),
    },
  });
  for (const t of tasks) found.set(t.id.slice(0, 8), t);
  return found;
}

/**
 * Commit author → employee: GitHub username first (set on the employee
 * profile), then company or personal email. Unmatched commits stay unattributed.
 */
async function matchUser(login: string | null | undefined, email: string | null | undefined): Promise<string | null> {
  if (login) {
    const u = await User.findOne({ where: { githubLogin: login.toLowerCase() }, attributes: ["id"] });
    if (u) return u.id;
  }
  if (!email) return null;
  const safe = email.replace(/[\\%_]/g, "\\$&"); // iLike, not a pattern
  const u = await User.findOne({
    where: { [Op.or]: [{ companyEmail: { [Op.iLike]: safe } }, { personalEmail: { [Op.iLike]: safe } }] },
    attributes: ["id"],
  });
  return u?.id ?? null;
}

export async function completedStatusId(projectId: string): Promise<string | null> {
  const statuses = await workflowFor(projectId);
  return statuses.find((s) => s.group === "Completed")?.id ?? null;
}

export const firstLine = (msg: string) => msg.split("\n")[0].trim();

export async function ingestCommits(
  link: ProjectRepo,
  commits: IncomingCommit[],
  opts: IngestOptions
): Promise<{ stored: number; linked: number; closed: number }> {
  const stats = { stored: 0, linked: 0, closed: 0 };
  const onDefault = opts.branch === link.defaultBranch;

  for (const c of commits) {
    const userId = await matchUser(c.authorLogin, c.authorEmail);
    // Claim the commit before acting on it. The unique (projectRepoId, sha)
    // index is what stops a redelivered or concurrent webhook, or the same sha
    // on another branch, from linking or closing twice; a read-then-write check
    // would race.
    let row: RepoCommit;
    try {
      row = await RepoCommit.create({
        projectRepoId: link.id,
        projectId: link.projectId,
        repoFullName: link.repoFullName,
        sha: c.sha,
        message: c.message,
        branch: opts.branch,
        url: c.url ?? null,
        authorName: c.authorName ?? null,
        authorEmail: c.authorEmail ?? null,
        authorLogin: c.authorLogin ?? null,
        userId,
        committedAt: new Date(c.timestamp),
        files: c.files ?? null,
      });
    } catch (err) {
      if (err instanceof UniqueConstraintError) continue;
      throw err;
    }
    stats.stored++;

    const refs = await tasksByPrefix(link.projectId, prefixesIn(REF, c.message));
    const taskIds = [...refs.values()].map((t) => t.id);
    const short = c.sha.slice(0, 7);
    const title = firstLine(c.message).slice(0, 180);

    for (const task of refs.values()) {
      await logActivity(task.id, userId, "commit_linked", `Commit ${short}: ${title}`, {
        sha: c.sha, url: c.url ?? null, repo: link.repoFullName, branch: opts.branch,
      });
      stats.linked++;
    }

    if (opts.applyEffects && onDefault) {
      const closing = prefixesIn(CLOSE_REF, c.message);
      const doneId = closing.length ? await completedStatusId(link.projectId) : null;
      for (const p of closing) {
        const task = refs.get(p);
        if (!task || task.status === "Done") continue;
        await task.update({ statusId: doneId ?? task.statusId, status: "Done", completedAt: new Date() });
        await logActivity(task.id, userId, "status_changed", `Closed by commit ${short}`, { sha: c.sha });
        stats.closed++;
      }
    }

    // A commit that names its task is already accounted for; merge commits
    // restate work that has its own commits. Neither needs AI grouping.
    if (taskIds.length || /^Merge /.test(c.message)) await row.update({ taskIds, groupedAt: new Date() });
  }
  return stats;
}

/** Pull recent history for a freshly linked repo, so the feed isn't empty until the next push. */
export async function backfillCommits(link: ProjectRepo, days: number) {
  return backfillRange(link, new Date(Date.now() - days * 86400_000));
}

/** Pull the default branch's commits in [since, until) from GitHub — up to 1,000. */
export async function backfillRange(link: ProjectRepo, since: Date, until?: Date) {
  const all: IncomingCommit[] = [];
  const range = `since=${since.toISOString()}${until ? `&until=${until.toISOString()}` : ""}`;
  for (let page = 1; page <= 10; page++) {
    const batch = await asInstallation<any[]>(
      Number(link.installationId),
      `/repos/${link.repoFullName}/commits?sha=${encodeURIComponent(link.defaultBranch)}&${range}&per_page=100&page=${page}`
    );
    for (const c of batch) {
      all.push({
        sha: c.sha,
        message: c.commit?.message ?? "",
        url: c.html_url,
        authorName: c.commit?.author?.name,
        authorEmail: c.commit?.author?.email,
        authorLogin: c.author?.login ?? null,
        timestamp: c.commit?.author?.date ?? new Date(),
      });
    }
    if (batch.length < 100) break;
  }
  // Oldest first so activity lands in the order it happened.
  return ingestCommits(link, all.reverse(), { branch: link.defaultBranch, applyEffects: false });
}
