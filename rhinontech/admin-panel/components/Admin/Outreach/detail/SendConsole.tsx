"use client";

import { useEffect, useRef } from "react";
import { TbLoader, TbTerminal2, TbX } from "react-icons/tb";

export type SendLogLine = {
  level: "info" | "success" | "warn" | "error";
  message: string;
  ts?: string;
};

export type SendProgress = { done: number; total: number; sent: number; skipped: number; failed: number };

const LEVEL_CLASS: Record<SendLogLine["level"], string> = {
  info: "text-neutral-400",
  success: "text-emerald-400",
  warn: "text-amber-400",
  error: "text-red-400",
};

const clock = (ts?: string) => {
  if (!ts) return "";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour12: false });
};

/**
 * Live terminal for a bulk campaign send.
 *
 * A 100+ lead send takes minutes, and the old flow gave no feedback at all until
 * the final toast — indistinguishable from a hang. This streams one line per
 * lead as the server dispatches it.
 */
export function SendConsole({
  lines,
  progress,
  running,
  onClose,
}: {
  lines: SendLogLine[];
  progress: SendProgress | null;
  running: boolean;
  onClose: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // Only follow the tail while the user is already at the bottom, so scrolling
  // back to read an error isn't yanked away by the next line.
  const pinnedRef = useRef(true);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const onScroll = () => {
      pinnedRef.current = body.scrollHeight - body.scrollTop - body.clientHeight < 40;
    };
    body.addEventListener("scroll", onScroll);
    return () => body.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (pinnedRef.current) endRef.current?.scrollIntoView({ block: "end" });
  }, [lines.length]);

  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 shadow-lg">
      <div className="flex items-center gap-2 border-b border-neutral-800 px-3 py-2">
        <TbTerminal2 size={14} className="text-neutral-500" />
        <span className="text-[11px] font-bold text-neutral-300">Send console</span>
        {running ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-400">
            <TbLoader size={12} className="animate-spin" /> Sending
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase text-emerald-400">Finished</span>
        )}
        {progress && (
          <span className="text-[10px] font-medium text-neutral-500">
            {progress.done}/{progress.total} · {progress.sent} sent
            {progress.skipped > 0 && ` · ${progress.skipped} skipped`}
            {progress.failed > 0 && ` · ${progress.failed} failed`}
          </span>
        )}
        <button
          onClick={onClose}
          title={running ? "Hide console (the send keeps running on the server)" : "Close"}
          className="ml-auto rounded p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
        >
          <TbX size={14} />
        </button>
      </div>

      <div className="h-1 w-full bg-neutral-800">
        <div
          className="h-full bg-emerald-500 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div ref={bodyRef} className="max-h-64 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            <span className="text-neutral-600">{clock(line.ts)} </span>
            <span className={LEVEL_CLASS[line.level]}>{line.message}</span>
          </div>
        ))}
        {running && <div className="text-neutral-600">▌</div>}
        <div ref={endRef} />
      </div>
    </div>
  );
}
