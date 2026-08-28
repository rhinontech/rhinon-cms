import { Op } from "sequelize";
import { Project, ProjectMember, Task, TeamMember } from "../models";
import { AuthRequest } from "../middleware/authenticate";

/**
 * Visibility for the Work module.
 *
 * Mirrors the approach already used by Docs (routes/pages.ts): one resolver that
 * every read path funnels through, so the list endpoint, the detail endpoint and
 * the aggregate counts can never drift apart and start disagreeing about who can
 * see what.
 *
 * The project is the unit of access. Tasks and client requests INHERIT their
 * project's visibility rather than carrying their own ACL — two sources of truth
 * is how a task eventually leaks out of a project that was meant to be sealed.
 * Work with no project attached keeps the old assignee/creator rules.
 */

/** Superadmin (the CEO panel) retains full authority here, as it does everywhere else. */
function isSuperadmin(req: AuthRequest): boolean {
  return req.user?.roleSlug === "superadmin";
}

/** External collaborators reach projects ONLY through an explicit ProjectMember grant. */
export function isGuest(req: AuthRequest): boolean {
  return req.user?.userType === "guest";
}

const GUEST_PROJECTS_CACHE = Symbol("workAccess.guestProjectIds");

/** The only projects a guest can reach. Memoised per request like the hidden set. */
export async function getGuestProjectIds(req: AuthRequest): Promise<string[]> {
  const cached = (req as any)[GUEST_PROJECTS_CACHE] as Promise<string[]> | undefined;
  if (cached) return cached;
  const pending = ProjectMember.findAll({
    where: { userId: req.user!.userId },
    attributes: ["projectId"],
    raw: true,
  }).then((rows) => (rows as any[]).map((r) => r.projectId));
  (req as any)[GUEST_PROJECTS_CACHE] = pending;
  return pending;
}

/**
 * Extra `where` for guests reading tasks. Sharing a project does NOT share its
 * back catalogue — each task is exposed deliberately via guestVisible.
 */
export async function guestTaskWhere(req: AuthRequest): Promise<Record<string, unknown>> {
  return isGuest(req) ? { guestVisible: true } : {};
}

/**
 * Whether a guest may write in this project ("collaborate" grants, "view" does not).
 * Always true for internal users — their limits come from the normal rules.
 */
export async function canGuestCollaborate(projectId: string, req: AuthRequest): Promise<boolean> {
  if (!isGuest(req)) return true;
  const row = await ProjectMember.findOne({
    where: { projectId, userId: req.user!.userId },
    attributes: ["access"],
  });
  return row?.access === "collaborate";
}

/** Team ids the user belongs to. */
export async function getUserTeamIds(userId: string): Promise<string[]> {
  const rows = await TeamMember.findAll({ where: { userId }, attributes: ["teamId"], raw: true });
  return rows.map((r: any) => r.teamId);
}

/**
 * Memoised per request. A single update can ask the same question half a dozen
 * times (route guard, then load, then canEdit, then the re-file check) and the
 * answer cannot change mid-request.
 */
const HIDDEN_CACHE = Symbol("workAccess.hiddenProjectIds");

/**
 * The projects this user may NOT see.
 *
 * Deliberately inverted: almost every project is workspace-visible, so the
 * hidden set stays small and cheap to pass to a NOT IN, where the visible set
 * would grow without bound.
 */
export async function getHiddenProjectIds(req: AuthRequest): Promise<string[]> {
  const cached = (req as any)[HIDDEN_CACHE] as Promise<string[]> | undefined;
  if (cached) return cached;
  // Cache the promise, not the result, so concurrent callers inside one request
  // share a single round trip instead of racing to compute the same thing.
  const pending = computeHiddenProjectIds(req);
  (req as any)[HIDDEN_CACHE] = pending;
  return pending;
}

async function computeHiddenProjectIds(req: AuthRequest): Promise<string[]> {
  if (isSuperadmin(req)) return [];
  const userId = req.user!.userId;
  const teamIds = await getUserTeamIds(userId);

  const restricted = await Project.findAll({
    where: { visibility: { [Op.ne]: "workspace" } },
    attributes: ["id", "visibility", "teamId", "ownerId", "createdById"],
    raw: true,
  }) as unknown as Array<{
    id: string;
    visibility: "workspace" | "team" | "private";
    teamId: string | null;
    ownerId: string | null;
    createdById: string | null;
  }>;

  return restricted
    .filter((p) => {
      // ownerId is backfilled from createdById; treat the creator as owner only
      // while ownerId is still unset, so transferring a project doesn't quietly
      // leave the previous owner with access.
      const owner = p.ownerId ?? p.createdById;
      if (owner === userId) return false;
      if (p.visibility === "team" && p.teamId && teamIds.includes(p.teamId)) return false;
      return true;
    })
    .map((p) => p.id);
}

/**
 * A `where` fragment restricting a Project query to what the user may see.
 * Returns {} when nothing is hidden, so the common case adds no SQL at all.
 */
export async function projectVisibilityWhere(req: AuthRequest): Promise<Record<string, unknown>> {
  // Guests are an allowlist, not a denylist: an empty grant list must mean
  // "nothing", which is exactly what IN () yields.
  if (isGuest(req)) return { id: { [Op.in]: await getGuestProjectIds(req) } };
  const hidden = await getHiddenProjectIds(req);
  return hidden.length === 0 ? {} : { id: { [Op.notIn]: hidden } };
}

/**
 * A `where` fragment for any model with a nullable `projectId` (Task,
 * ClientRequest). Unattached rows stay visible — `projectId NOT IN (...)`
 * is NULL, not true, for a NULL projectId, so it has to be spelled out.
 */
export async function projectScopedWhere(req: AuthRequest): Promise<Record<string, unknown>> {
  // Note the absence of a `projectId: null` branch — work with no project is
  // internal by definition and must never fall to a guest.
  if (isGuest(req)) return { projectId: { [Op.in]: await getGuestProjectIds(req) } };
  const hidden = await getHiddenProjectIds(req);
  if (hidden.length === 0) return {};
  return {
    [Op.or as any]: [{ projectId: null }, { projectId: { [Op.notIn]: hidden } }],
  };
}

/** Merge a visibility fragment into an existing `where` without either clobbering the other's Op.or. */
export function mergeWhere(
  base: Record<string, unknown>,
  scope: Record<string, unknown>
): Record<string, unknown> {
  const scopeKeys = [...Object.keys(scope), ...Object.getOwnPropertySymbols(scope)];
  if (scopeKeys.length === 0) return base;
  const baseKeys = [...Object.keys(base), ...Object.getOwnPropertySymbols(base)];
  if (baseKeys.length === 0) return scope;
  // Both may carry their own Op.or; Op.and keeps them independent.
  return { [Op.and as any]: [base, scope] };
}

export async function canAccessProject(projectId: string | null | undefined, req: AuthRequest): Promise<boolean> {
  if (isGuest(req)) {
    // Unattached work has no project to grant access through, so it is never reachable.
    if (!projectId) return false;
    return (await getGuestProjectIds(req)).includes(projectId);
  }
  if (!projectId) return true;
  if (isSuperadmin(req)) return true;
  const hidden = await getHiddenProjectIds(req);
  return !hidden.includes(projectId);
}

/** Whether the user may see a task at all — i.e. whether its project is reachable. */
export async function canAccessTask(task: Task, req: AuthRequest): Promise<boolean> {
  if (isGuest(req) && !task.guestVisible) return false;
  return canAccessProject(task.projectId, req);
}

/** Same check starting from a task id, for the /tasks/:id/* sub-routes. */
export async function canAccessTaskId(taskId: string, req: AuthRequest): Promise<boolean> {
  const task = await Task.findByPk(taskId, { attributes: ["id", "projectId", "guestVisible"] });
  if (!task) return false;
  return canAccessTask(task, req);
}

/**
 * Whether the user may put a project into this visibility state. Only a team
 * member can file work under that team — otherwise you could hide a project
 * inside a team you have no way of opening.
 */
export async function canUseVisibility(
  visibility: string,
  teamId: string | null | undefined,
  req: AuthRequest
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (isGuest(req)) return { ok: false, message: "Collaborators cannot change project visibility" };
  if (visibility === "workspace" || visibility === "private") return { ok: true };
  if (visibility !== "team") return { ok: false, message: "Unknown visibility" };
  if (!teamId) return { ok: false, message: "A team is required for team visibility" };
  if (isSuperadmin(req)) return { ok: true };
  const teamIds = await getUserTeamIds(req.user!.userId);
  if (!teamIds.includes(teamId)) return { ok: false, message: "You are not a member of that team" };
  return { ok: true };
}
