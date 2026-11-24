import { Op } from "sequelize";
import { Account, Deal, Lead, Page, Project, Task, User } from "../models";
import { hasPermission, type AuthRequest } from "../middleware/authenticate";
import { mergeWhere, projectScopedWhere, projectVisibilityWhere } from "./workAccess";
import { getVisiblePageIds } from "./pageAccess";
import { scopeToOwner } from "./crmScope";

/** A CRM search obeys the same record scope as the CRM lists (own + unassigned without crm:viewAll). */
function crmScoped(req: AuthRequest, where: Record<string | symbol, unknown>) {
  const scope: Record<string, unknown> = {};
  scopeToOwner(req, scope);
  return "ownerId" in scope ? { [Op.and]: [where, { ownerId: scope.ownerId }] } : where;
}

/**
 * Global search behind ⌘K: one box that finds records across modules.
 *
 * Each record type is searched only when the person could open that module,
 * and with the same visibility rules its own screen applies (private projects,
 * private pages). The workspace scope comes from the tenant hooks like every
 * other query. Links are built by the client, which knows the role and brand.
 */

export type SearchResultType = "lead" | "deal" | "account" | "project" | "task" | "person" | "page";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string | null;
  /** Tasks open inside their project's workspace. */
  projectId?: string | null;
}

const PER_TYPE = 5;

/** % and _ are wildcards in ILIKE; a search for "50%" should look for the text "50%". */
function likePattern(query: string): string {
  return `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

async function safe<T>(label: string, run: () => Promise<T[]>): Promise<T[]> {
  try {
    return await run();
  } catch (err) {
    console.error(`[Search] ${label} failed:`, err instanceof Error ? err.message : err);
    return [];
  }
}

export async function searchWorkspace(req: AuthRequest, query: string): Promise<SearchResult[]> {
  const like = likePattern(query);
  const can = (...perms: string[]) => hasPermission(req, ...perms);

  const groups = await Promise.all([
    can("crm:read", "outreach:read")
      ? safe("leads", async () =>
          (await Lead.findAll({
            where: crmScoped(req, { [Op.or]: [{ name: { [Op.iLike]: like } }, { company: { [Op.iLike]: like } }, { email: { [Op.iLike]: like } }] }),
            attributes: ["id", "name", "company", "email"],
            order: [["updatedAt", "DESC"]],
            limit: PER_TYPE,
          })).map((l): SearchResult => ({
            type: "lead",
            id: l.id,
            title: l.name || l.email || "Unnamed lead",
            subtitle: [l.company, l.email].filter(Boolean).join(" · ") || null,
          }))
        )
      : [],
    can("crm:read")
      ? safe("deals", async () =>
          (await Deal.findAll({
            where: crmScoped(req, { title: { [Op.iLike]: like } }),
            attributes: ["id", "title", "status"],
            order: [["updatedAt", "DESC"]],
            limit: PER_TYPE,
          })).map((d): SearchResult => ({ type: "deal", id: d.id, title: d.title, subtitle: d.status }))
        )
      : [],
    can("crm:read")
      ? safe("accounts", async () =>
          (await Account.findAll({
            where: crmScoped(req, { [Op.or]: [{ name: { [Op.iLike]: like } }, { domain: { [Op.iLike]: like } }] }),
            attributes: ["id", "name", "domain"],
            order: [["updatedAt", "DESC"]],
            limit: PER_TYPE,
          })).map((a): SearchResult => ({ type: "account", id: a.id, title: a.name, subtitle: a.domain ?? null }))
        )
      : [],
    can("work:read")
      ? safe("projects", async () =>
          (await Project.findAll({
            where: mergeWhere({ name: { [Op.iLike]: like } }, await projectVisibilityWhere(req)),
            attributes: ["id", "name", "status"],
            order: [["updatedAt", "DESC"]],
            limit: PER_TYPE,
          })).map((p): SearchResult => ({ type: "project", id: p.id, title: p.name, subtitle: p.status }))
        )
      : [],
    can("work:read")
      ? safe("tasks", async () =>
          (await Task.findAll({
            where: mergeWhere({ title: { [Op.iLike]: like } }, await projectScopedWhere(req)),
            attributes: ["id", "title", "status", "projectId"],
            order: [["updatedAt", "DESC"]],
            limit: PER_TYPE,
          })).map((t): SearchResult => ({ type: "task", id: t.id, title: t.title, subtitle: t.status, projectId: t.projectId ?? null }))
        )
      : [],
    can("people:read")
      ? safe("people", async () =>
          (await User.findAll({
            where: {
              status: "active",
              userType: "internal",
              [Op.or]: [{ fullName: { [Op.iLike]: like } }, { companyEmail: { [Op.iLike]: like } }],
            },
            attributes: ["id", "fullName", "department", "companyEmail"],
            order: [["fullName", "ASC"]],
            limit: PER_TYPE,
          })).map((u): SearchResult => ({
            type: "person",
            id: u.id,
            title: u.fullName,
            subtitle: [u.department, u.companyEmail].filter(Boolean).join(" · ") || null,
          }))
        )
      : [],
    can("pages:read")
      ? safe("pages", async () => {
          const visible = await getVisiblePageIds(req.user!.userId);
          if (visible.size === 0) return [];
          return (await Page.findAll({
            where: { id: { [Op.in]: Array.from(visible) }, title: { [Op.iLike]: like } },
            attributes: ["id", "title", "icon"],
            order: [["updatedAt", "DESC"]],
            limit: PER_TYPE,
          })).map((p): SearchResult => ({ type: "page", id: p.id, title: p.title || "Untitled", subtitle: null }));
        })
      : [],
  ]);

  return groups.flat();
}
