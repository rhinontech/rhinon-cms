"use client";

import Link from "next/link";
import { TbLayoutKanban, TbList } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { useModuleBase } from "@/lib/sites";

/**
 * The board and the list are two views of the same deals, so they are one menu
 * item ("Deals") with a switch, not two items that look like different things.
 */
export function DealsViewToggle({ view }: { view: "board" | "list" }) {
  const base = useModuleBase();
  const option = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors",
      active ? "bg-foreground/[0.08] text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
    );
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-card/70 p-0.5" aria-label="Deals view">
      <Link href={`${base}/pipeline`} prefetch={false} aria-current={view === "board" ? "page" : undefined} className={option(view === "board")}>
        <TbLayoutKanban size={14} /> Board
      </Link>
      <Link href={`${base}/deals`} prefetch={false} aria-current={view === "list" ? "page" : undefined} className={option(view === "list")}>
        <TbList size={14} /> List
      </Link>
    </div>
  );
}
