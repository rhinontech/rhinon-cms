import { TbAlertTriangle, TbClock } from "react-icons/tb";
import type { TaskStatus } from "./types";

export function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === "Done") return false;
  return new Date(dueDate + "T23:59:59") < new Date();
}

export function isDueToday(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === "Done") return false;
  return new Date(dueDate + "T00:00:00").toDateString() === new Date().toDateString();
}

export function ordinalDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? "st"
    : day % 10 === 2 && day !== 12 ? "nd"
    : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${day}${suffix} ${d.toLocaleDateString("en-US", { month: "short" })}`;
}

/** "Prabhat Patra" -> "PP"; falls back to one letter. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Deterministic avatar tint so a person keeps the same colour across sections. */
const AVATAR_TINTS = [
  "bg-blue-100 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300", "bg-emerald-100 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-100 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300", "bg-purple-100 dark:bg-purple-400/15 text-purple-700 dark:text-purple-300",
  "bg-pink-100 dark:bg-pink-400/15 text-pink-700 dark:text-pink-300", "bg-indigo-100 dark:bg-indigo-400/15 text-indigo-700 dark:text-indigo-300",
];

export function avatarTint(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

export function DueBadge({ dueDate, status }: { dueDate: string | null; status: TaskStatus }) {
  if (isOverdue(dueDate, status)) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-red-50 dark:bg-red-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-300">
        <TbAlertTriangle size={10} /> Overdue
      </span>
    );
  }
  if (isDueToday(dueDate, status)) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
        <TbClock size={10} /> Today
      </span>
    );
  }
  return null;
}
