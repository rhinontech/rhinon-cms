import { create } from "zustand";
import type { PageNode } from "./types";

interface PagesStoreState {
  lastPatch: { id: string; patch: Partial<Pick<PageNode, "title" | "icon">> } | null;
  notifyPageUpdate: (id: string, patch: Partial<Pick<PageNode, "title" | "icon">>) => void;
}

// Bridges PageEditor (which owns the title/icon edits) and PagesSidebar (which
// renders a separately-fetched copy of the tree) so a rename shows up live
// instead of only after a refetch/refresh.
export const usePagesStore = create<PagesStoreState>((set) => ({
  lastPatch: null,
  notifyPageUpdate: (id, patch) => set({ lastPatch: { id, patch } }),
}));
