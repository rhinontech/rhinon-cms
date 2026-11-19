/**
 * Column header look shared by the Tasks board and the Project board: a solid colour pill
 * for the column name over a thin accent line. Class names are written out in full so
 * Tailwind can see them.
 */
export const COLUMN_PILL: Record<string, string> = {
  blue: "bg-blue-500 text-white",
  indigo: "bg-indigo-400 text-white",
  cyan: "bg-cyan-500 text-white",
  amber: "bg-amber-300 text-amber-950",
  green: "bg-emerald-500 text-white",
  stone: "bg-stone-400 text-white",
  red: "bg-red-600 text-white",
  purple: "bg-purple-500 text-white",
};

export const COLUMN_TOP: Record<string, string> = {
  blue: "border-t-blue-500!",
  indigo: "border-t-indigo-400!",
  cyan: "border-t-cyan-500!",
  amber: "border-t-amber-300!",
  green: "border-t-emerald-500!",
  stone: "border-t-stone-400!",
  red: "border-t-red-600!",
  purple: "border-t-purple-500!",
};
