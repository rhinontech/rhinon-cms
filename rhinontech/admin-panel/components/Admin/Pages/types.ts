export interface PageNode {
  id: string;
  title: string;
  icon: string | null;
  parentId: string | null;
  position: number;
  ownerId: string;
  visibility: "private" | "workspace";
}

export interface PageShareEntry {
  userId: string;
  access: "view" | "edit";
  user?: { id: string; fullName: string; avatarKey?: string | null };
}

export interface PageAttachmentEntry {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  uploadedBy?: { id: string; fullName: string } | null;
}

export interface PageDoc extends PageNode {
  coverImage: string | null;
  content: Record<string, any> | null;
  myAccess: "view" | "edit";
  shares: PageShareEntry[];
  updatedAt: string;
  createdAt: string;
}

export interface PageTreeNode extends PageNode {
  children: PageTreeNode[];
}

export function isImageIcon(icon: string | null | undefined): boolean {
  return !!icon && /^https?:\/\//.test(icon);
}

export function buildTree(pages: PageNode[]): PageTreeNode[] {
  const byId = new Map<string, PageTreeNode>();
  pages.forEach((p) => byId.set(p.id, { ...p, children: [] }));

  const roots: PageTreeNode[] = [];
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortByPosition = (nodes: PageTreeNode[]) => {
    nodes.sort((a, b) => a.position - b.position);
    nodes.forEach((n) => sortByPosition(n.children));
  };
  sortByPosition(roots);

  return roots;
}
