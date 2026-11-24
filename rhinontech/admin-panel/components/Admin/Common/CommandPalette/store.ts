import { create } from "zustand";

/**
 * Whether the ⌘K search is open. A store rather than component state because
 * the sidebar's Search item, the header's search box and the keyboard shortcut
 * all open the same palette, and the shell remounts on every module change.
 */
export const useCommandPalette = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
