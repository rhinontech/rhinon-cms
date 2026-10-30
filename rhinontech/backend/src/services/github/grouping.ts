import { Op } from "sequelize";
import { Project, ProjectRepo, RepoCommit, Task, TaskActivity, User } from "../../models";
import { groupCommitsIntoWork, type CommitGroup } from "../gemini";
import { logActivity } from "../taskActivity";
import { asInstallation } from "./app";
import { backfillRange, completedStatusId, firstLine } from "./commits";
import { runForOrg } from "../tenantContext";

/**
 * AI grouping: developers commit in small steps, so 3-4 commits usually make
 * one feature. Every commit not already tied to a task is handed to Gemini,
 * which clusters them into units of shipped work; each unit becomes (or
 * extends) one Done card that lists its commits.
 *
 * Gemini's answer is never trusted as-is: unknown shas and card ids are
 * dropped, a sha claimed twice keeps its first group, and anything the model
 * leaves out lands in a catch-all card — no commit goes unaccounted for.
 *
 * Callers must be inside the repo's org context (runForOrg).
 */
const SOURCE = "ai-commit-group";
const BATCH = 150;
const RECENT_DAYS = 14;

export interface GroupingResult {
  commits: number;
  created: number;
  extended: number;
}

// One run per link at a time — the nightly job and the "Group now" button
// must not both turn the same commits into cards.
const running = new Set<string>();

/** Push payloads carry file lists; history pulled through the API doesn't, so fetch it. */
async function hydrateFiles(link: ProjectRepo, commits: RepoCommit[]) {
  const todo = commits.filter((c) => !c.files);
  // A few at a time: sequential is slow on a fresh backfill, unbounded trips GitHub's abuse limits.
  for (let i = 0; i < todo.length; i += 8) await Promise.all(todo.slice(i, i + 8).map((c) => hydrateOne(link, c)));
}

async function hydrateOne(link: ProjectRepo, c: RepoCommit) {
  try {
    const full = await asInstallation<{ files?: { filename: string }[] }>(
      Number(link.installationId),
      `/repos/${link.repoFullName}/commits/${c.sha}`
    );
    await c.update({ files: (full.files ?? []).map((f) => f.filename) });
  } catch (err: any) {
    console.error(`[GitHub] Files for ${c.sha.slice(0, 7)}:`, err.message);
    c.files = [];
  }
}

/** AI cards for this project from the last two weeks — candidates for "same feature, next day". */
async function recentCards(projectId: string): Promise<Map<string, Task>> {
  const since = new Date(Date.now() - RECENT_DAYS * 86400_000);
  const entries = await TaskActivity.findAll({
    where: { type: "created", createdAt: { [Op.gte]: since }, "details.source": SOURCE } as any,
    attributes: ["taskId"],
  });
  const tasks = entries.length
    ? await Task.findAll({ where: { id: { [Op.in]: entries.map((e) => e.taskId) }, projectId } })
    : [];
  return new Map(tasks.map((t) => [t.id, t]));
}

function validGroups(
  raw: CommitGroup[],
  pending: Map<string, RepoCommit>,
  cards: Map<string, Task>,
  claimed = new Set<string>()
): CommitGroup[] {
  const groups: CommitGroup[] = [];
  for (const g of raw) {
    const shas = (Array.isArray(g?.shas) ? g.shas : [])
      .map((s) => String(s).trim().toLowerCase())
      .filter((s) => pending.has(s) && !claimed.has(s));
    if (!shas.length) continue;
    shas.forEach((s) => claimed.add(s));
    groups.push({
      title: String(g.title || "").trim().slice(0, 200) || firstLine(pending.get(shas[0])!.message).slice(0, 200),
      summary: String(g.summary || "").trim().slice(0, 1500),
      existingTaskId: g.existingTaskId && cards.has(g.existingTaskId) ? g.existingTaskId : null,
      shas,
    });
  }
  return groups;
}

const IST: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata" };
const fmtDay = (d: Date) => d.toLocaleDateString("en-IN", { ...IST, day: "numeric", month: "short", year: "numeric" });
const fmtStamp = (d: Date) => d.toLocaleString("en-IN", { ...IST, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

const commitLine = (c: RepoCommit, names: Map<string, string>) =>
  `${c.sha.slice(0, 7)}  ${fmtStamp(c.committedAt)}  ${firstLine(c.message).slice(0, 120)}  (${(c.userId && names.get(c.userId)) || c.authorLogin || c.authorName || "unknown"})`;

/**
 * Card body: shipped dates, the AI summary, then one line per commit. The
 * dates are also on the task itself (startDate / completedAt) for the Gantt
 * and Calendar; this line is so they read at a glance in the description.
 */
function renderDescription(summary: string, first: Date, last: Date, lines: string): string {
  const a = fmtDay(first), b = fmtDay(last);
  return `Shipped: ${a === b ? a : `${a} – ${b}`} (IST)\n\n${summary}\n\nCommits:\n${lines}`.trim();
}

/** Inverse of renderDescription, for extending a card: [summary, commit lines]. */
function parseDescription(text: string | null | undefined): [string, string] {
  const [head, lines = ""] = (text ?? "").split("\n\nCommits:\n");
  return [head.replace(/^Shipped:[^\n]*\n\n/, "").trim(), lines.trim()];
}

/** Most frequent matched author — who the card is assigned to. */
function leadAuthor(commits: RepoCommit[]): string | null {
  const counts = new Map<string, number>();
  for (const c of commits) if (c.userId) counts.set(c.userId, (counts.get(c.userId) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export interface GroupingRange {
  from?: Date;
  to?: Date;
}

/**
 * Groups every not-yet-grouped commit in [from, to) — all of them when no
 * range is given — in batches of BATCH, oldest first, so a feature spanning
 * a batch boundary can still be extended across it.
 */
export async function groupCommitsWithAI(link: ProjectRepo, range: GroupingRange = {}): Promise<GroupingResult> {
  if (running.has(link.id)) throw new Error("Grouping is already running for this repository.");
  running.add(link.id);
  try {
    const total: GroupingResult = { commits: 0, created: 0, extended: 0 };
    const committedAt: any = {};
    if (range.from) committedAt[Op.gte] = range.from;
    if (range.to) committedAt[Op.lt] = range.to;
    const inRange = range.from || range.to ? { committedAt } : {};
    await releaseOrphans(link, inRange);
    for (let round = 0; round < 20; round++) {
      const fetched = await RepoCommit.findAll({
        where: { projectRepoId: link.id, groupedAt: null, ...inRange },
        order: [["committedAt", "ASC"]],
        limit: BATCH,
      });
      if (!fetched.length) break;
      const r = await groupBatch(link, fetched);
      total.commits += r.commits;
      total.created += r.created;
      total.extended += r.extended;
      // Nothing placed (e.g. no owner for new cards): stop rather than spin on the same rows.
      if (!r.commits && fetched.every((f) => !f.taskIds.length)) break;
    }
    return total;
  } finally {
    running.delete(link.id);
  }
}

/**
 * A deleted card must not keep its commits: they would count as "already
 * grouped" forever. Drop task ids that no longer exist, and put commits left
 * with none back in the queue so this run groups them again.
 */
async function releaseOrphans(link: ProjectRepo, inRange: Record<string, unknown>) {
  const grouped = await RepoCommit.findAll({
    where: { projectRepoId: link.id, groupedAt: { [Op.ne]: null }, ...inRange },
    attributes: ["id", "taskIds", "groupedAt", "message"],
  });
  const referenced = [...new Set(grouped.flatMap((c) => c.taskIds))];
  if (!referenced.length && !grouped.length) return;
  const alive = new Set(
    referenced.length
      ? (await Task.findAll({ where: { id: { [Op.in]: referenced } }, attributes: ["id"] })).map((t) => t.id)
      : []
  );
  for (const c of grouped) {
    // Merge commits are marked grouped with no task on purpose; leave them be.
    if (!c.taskIds.length) continue;
    const kept = c.taskIds.filter((id) => alive.has(id));
    if (kept.length === c.taskIds.length) continue;
    await c.update({ taskIds: kept, groupedAt: kept.length ? c.groupedAt : null });
  }
}

async function groupBatch(link: ProjectRepo, fetched: RepoCommit[]): Promise<GroupingResult> {
  const result: GroupingResult = { commits: 0, created: 0, extended: 0 };
  // Rows stored before grouping existed may already belong to a task; they're accounted for.
  const linked = fetched.filter((r) => r.taskIds.length);
  if (linked.length) {
    await RepoCommit.update({ groupedAt: new Date() }, { where: { id: { [Op.in]: linked.map((r) => r.id) } } });
  }
  const rows = fetched.filter((r) => !r.taskIds.length);
  if (!rows.length) return result;

  await hydrateFiles(link, rows);
  const users = await User.findAll({
    where: { id: { [Op.in]: [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[] } },
    attributes: ["id", "fullName"],
  });
  const names = new Map(users.map((u) => [u.id, u.fullName]));
  const cards = await recentCards(link.projectId);
  const pending = new Map(rows.map((r) => [r.sha.toLowerCase(), r]));

  const ask = (subset: RepoCommit[]) =>
    groupCommitsIntoWork(
      link.repoFullName,
      subset.map((r) => ({
        sha: r.sha.toLowerCase(),
        message: r.message,
        author: (r.userId && names.get(r.userId)) || r.authorLogin || r.authorName || "unknown",
        at: r.committedAt.toISOString(),
        files: r.files ?? [],
      })),
      [...cards.values()].map((t) => ({ id: t.id, title: t.title, summary: parseDescription(t.description)[0] }))
    );
  const claimed = new Set<string>();
  const groups = validGroups(await ask(rows), pending, cards, claimed);
  // Long batches make the model drop a few commits; a second, small pass usually places them.
  let missed = rows.filter((r) => !claimed.has(r.sha.toLowerCase()));
  if (missed.length) {
    groups.push(...validGroups(await ask(missed), pending, cards, claimed));
    missed = rows.filter((r) => !claimed.has(r.sha.toLowerCase()));
  }
  if (missed.length) {
    groups.push({
      title: "Other changes",
      summary: "Commits the AI grouping did not place in a feature.",
      existingTaskId: null,
      shas: missed.map((r) => r.sha.toLowerCase()),
    });
  }

  const project = await Project.findByPk(link.projectId, { attributes: ["ownerId", "createdById"] });
  const doneId = await completedStatusId(link.projectId);

  for (const g of groups) {
    const commits = g.shas.map((s) => pending.get(s)!).sort((a, b) => +a.committedAt - +b.committedAt);
    const lead = leadAuthor(commits);
    const lines = commits.map((c) => commitLine(c, names)).join("\n");
    const first = commits[0].committedAt;
    const last = commits[commits.length - 1].committedAt;
    let task: Task;

    if (g.existingTaskId) {
      task = cards.get(g.existingTaskId)!;
      const [summary, oldLines] = parseDescription(task.description);
      const start = task.startDate && task.startDate < first ? task.startDate : first;
      const end = task.completedAt && task.completedAt > last ? task.completedAt : last;
      await task.update({
        description: renderDescription(summary, start, end, [oldLines, lines].filter(Boolean).join("\n")),
        startDate: start,
        dueDate: end,
        completedAt: end,
      });
      await logActivity(task.id, null, "commit_linked", `AI added ${commits.length} commit${commits.length === 1 ? "" : "s"} to this card`, {
        source: SOURCE, shas: commits.map((c) => c.sha),
      });
      result.extended++;
    } else {
      const createdById = lead ?? project?.ownerId ?? project?.createdById ?? link.createdById;
      if (!createdById) continue; // no one to own it; commits stay pending for the next run
      task = await Task.create({
        title: g.title,
        description: renderDescription(g.summary, first, last, lines),
        projectId: link.projectId,
        createdById,
        assigneeId: lead ?? undefined,
        statusId: doneId,
        status: "Done",
        startDate: first,
        // The finish date doubles as the due date, so the Gantt draws the real span.
        dueDate: last,
        completedAt: last,
      });
      await logActivity(task.id, null, "created", `Created by AI from ${commits.length} commit${commits.length === 1 ? "" : "s"}`, {
        source: SOURCE, shas: commits.map((c) => c.sha),
      });
      cards.set(task.id, task);
      result.created++;
    }

    const now = new Date();
    for (const c of commits) await c.update({ taskIds: [...new Set([...c.taskIds, task.id])], groupedAt: now });
    result.commits += commits.length;
  }
  return result;
}

/* ---------- Background runs ---------- */

/**
 * A run over a date range syncs from GitHub and then makes several AI calls —
 * minutes, not seconds, which is longer than nginx will hold a request open.
 * So runs happen in the background and the panel polls this state. In memory
 * on purpose: a restart loses only the status line, and the commits a dead run
 * didn't reach simply stay pending for the next one.
 */
export interface GroupingJob {
  state: "syncing" | "grouping" | "done" | "failed";
  from: string | null;
  to: string | null;
  trigger: "manual" | "nightly";
  startedAt: string;
  finishedAt: string | null;
  synced: number | null;
  result: GroupingResult | null;
  error: string | null;
}

const jobs = new Map<string, GroupingJob>();

export const groupingJob = (linkId: string): GroupingJob | null => jobs.get(linkId) ?? null;

/** Starts a sync-then-group run; resolves when it finishes. Throws if one is already running. */
export function startGroupingJob(
  link: ProjectRepo,
  range: GroupingRange,
  trigger: GroupingJob["trigger"]
): { job: GroupingJob; done: Promise<GroupingJob> } {
  const current = jobs.get(link.id);
  if (running.has(link.id) || current?.state === "syncing" || current?.state === "grouping") {
    throw new Error("A grouping run is already in progress for this repository.");
  }
  const job: GroupingJob = {
    state: "syncing",
    from: range.from?.toISOString() ?? null,
    to: range.to?.toISOString() ?? null,
    trigger,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    synced: null,
    result: null,
    error: null,
  };
  jobs.set(link.id, job);
  const orgId = link.get("organizationId") as string;

  const done = runForOrg(orgId, async () => {
    try {
      // Pull the range first: a missed webhook, or dates older than the link, would otherwise leave gaps.
      if (range.from) job.synced = (await backfillRange(link, range.from, range.to)).stored;
      job.state = "grouping";
      job.result = await groupCommitsWithAI(link, range);
      job.state = "done";
    } catch (err: any) {
      job.state = "failed";
      job.error = err?.message || "Grouping failed";
      console.error(`[GitHub] Grouping ${link.repoFullName} failed:`, job.error);
    } finally {
      job.finishedAt = new Date().toISOString();
    }
    return job;
  }, { label: `github:grouping:${trigger}` });

  return { job, done };
}
