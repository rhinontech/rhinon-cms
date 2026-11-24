import { Page, PageShare } from "../models";

/** The fields page access is decided on: who owns it, how it is shared, and where it sits. */
export interface PageNode {
  id: string;
  parentId: string | null;
  ownerId: string;
  visibility: "private" | "workspace";
}

/**
 * Every page id visible to userId: pages they own, pages shared with them,
 * workspace-visible pages, and every descendant of any of those.
 *
 * One function for the Pages tree, Pages search and the global search (⌘K),
 * so the three can never disagree about what someone may see.
 */
export async function getVisiblePageIds(userId: string): Promise<Set<string>> {
  const allPages = await Page.findAll({
    where: { isArchived: false },
    attributes: ["id", "parentId", "ownerId", "visibility"],
    raw: true,
  }) as unknown as PageNode[];

  const childrenOf = new Map<string, string[]>();
  for (const p of allPages) {
    if (!p.parentId) continue;
    if (!childrenOf.has(p.parentId)) childrenOf.set(p.parentId, []);
    childrenOf.get(p.parentId)!.push(p.id);
  }

  const shareRows = await PageShare.findAll({ where: { userId }, attributes: ["pageId"], raw: true });
  const sharedIds = new Set(shareRows.map((s) => s.pageId));

  const visible = new Set<string>();
  const markVisible = (id: string) => {
    if (visible.has(id)) return;
    visible.add(id);
    (childrenOf.get(id) || []).forEach(markVisible);
  };

  for (const p of allPages) {
    if (p.ownerId === userId || p.visibility === "workspace" || sharedIds.has(p.id)) {
      markVisible(p.id);
    }
  }

  return visible;
}
