import crypto from "crypto";
import { Op, UniqueConstraintError } from "sequelize";
import { ClientRequest, Project, ProjectDaySummary, RepoCommit, Task, TaskActivity, TaskComment, TimeEntry, User } from "../models";
import { summarizeWorkDay } from "./gemini";

export interface DayEvent {
  kind: "commit" | "task" | "comment" | "time" | "request";
  text: string;
  at: string | null;
  who: string | null;
}

export interface DaySummary {
  date: string;
  points: string[];
  /** False when the AI call failed; events still come back so the day stays readable. */
  aiAvailable: boolean;
  events: DayEvent[];
}

/** Everything that happened on a project on one IST day, plus AI pointers over it. */
export async function projectDaySummary(project: Project, date: string): Promise<DaySummary> {
  const start = new Date(`${date}T00:00:00+05:30`);
  const between = { [Op.gte]: start, [Op.lt]: new Date(+start + 86400_000) };
  const tasks = await Task.findAll({ where: { projectId: project.id }, attributes: ["id", "title"] });
  const titles = new Map(tasks.map((t) => [t.id, t.title]));
  const taskId = { [Op.in]: [...titles.keys()] };
  const author = { model: User, as: "author", attributes: ["fullName"] };

  const [commits, activity, comments, time, requests] = await Promise.all([
    RepoCommit.findAll({ where: { projectId: project.id, committedAt: between }, include: [author], order: [["committedAt", "ASC"]], limit: 200 }),
    TaskActivity.findAll({ where: { taskId, createdAt: between, type: { [Op.ne]: "commit_linked" } }, include: [{ model: User, as: "actor", attributes: ["fullName"] }], order: [["createdAt", "ASC"]], limit: 200 }),
    TaskComment.findAll({ where: { taskId, createdAt: between }, include: [author], order: [["createdAt", "ASC"]], limit: 100 }),
    TimeEntry.findAll({ where: { taskId, spentOn: date as any }, limit: 100 }),
    ClientRequest.findAll({ where: { projectId: project.id, createdAt: between }, order: [["createdAt", "ASC"]], limit: 50 }),
  ]);
  const name = (row: any, as: string) => row[as]?.fullName ?? null;

  const events: DayEvent[] = [
    ...commits.map((c) => ({ kind: "commit" as const, text: c.message.split("\n")[0], at: c.committedAt.toISOString(), who: name(c, "author") ?? c.authorLogin ?? c.authorName })),
    ...activity.map((a) => ({ kind: "task" as const, text: `${titles.get(a.taskId)}: ${a.summary}`, at: a.createdAt.toISOString(), who: name(a, "actor") })),
    ...comments.map((c) => ({ kind: "comment" as const, text: `${titles.get(c.taskId)}: ${c.body}`, at: c.createdAt.toISOString(), who: name(c, "author") })),
    ...time.map((t) => ({ kind: "time" as const, text: `${titles.get(t.taskId)}: ${t.minutes} min logged${t.note ? ` (${t.note})` : ""}`, at: null, who: null })),
    ...requests.map((r) => ({ kind: "request" as const, text: `${r.type}: ${r.title}`, at: r.createdAt!.toISOString(), who: r.reportedBy ?? null })),
  ];
  if (!events.length) return { date, points: [], aiAvailable: true, events };

  // Reuse the saved summary until the day's events change; only then spend an AI call.
  const fingerprint = crypto.createHash("sha256").update(JSON.stringify(events)).digest("hex");
  const saved = await ProjectDaySummary.findOne({ where: { projectId: project.id, date } });
  if (saved?.fingerprint === fingerprint) return { date, points: saved.points, aiAvailable: true, events };

  try {
    const points = await summarizeWorkDay(project.name, date, events.map((e) => `[${e.kind}] ${e.text}`));
    if (saved) await saved.update({ fingerprint, points });
    else {
      // create, not upsert: upsert skips the hook that stamps organizationId.
      await ProjectDaySummary.create({ projectId: project.id, date, fingerprint, points }).catch(async (err) => {
        if (!(err instanceof UniqueConstraintError)) throw err;
        await ProjectDaySummary.update({ fingerprint, points }, { where: { projectId: project.id, date } });
      });
    }
    return { date, points, aiAvailable: true, events };
  } catch (err: any) {
    console.error("[Day summary] AI failed:", err.message);
    // Older pointers beat none; nothing is saved, so the next open tries again.
    return { date, points: saved?.points ?? [], aiAvailable: false, events };
  }
}
