import { create } from "zustand";
import type { SubNavItem } from "./CollapsibleSubNav";

/**
 * The current module's pages, published by its sub-nav so the main sidebar can
 * show them nested under the active module (one navigation surface instead of
 * two stacked columns, docs/UI_UX_DESIGN_AUDIT.md D1).
 */
export const useModuleNav = create<{ items: SubNavItem[] | null; key: string; set: (items: SubNavItem[] | null, key: string) => void }>((set) => ({
  items: null,
  key: "",
  set: (items, key) => set({ items, key }),
}));
