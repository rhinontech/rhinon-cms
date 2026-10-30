"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TbX } from "react-icons/tb";
import { STATUS_CHIP } from "./constants";
import type { ProjectTask, TaskRow } from "./types";

/**
 * The client portal's task detail: what the work is and where it stands,
 * nothing editable. The description is shown as plain text — stored HTML is
 * never rendered on an unauthenticated page.
 */
function plainText(task: ProjectTask): string {
  if (task.description?.trim()) return task.description;
  if (!task.descriptionHtml) return "";
  return task.descriptionHtml
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

const day = (v: string | null | undefined) => (v ? format(new Date(v), "d MMM yyyy") : null);

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm text-foreground/85">{children}</div>
    </div>
  );
}

export function PublicTaskPanel({ task, rows, onClose, onOpen }: {
  task: ProjectTask & { completedAt?: string | null };
  rows: TaskRow[];
  onClose: () => void;
  onOpen: (t: ProjectTask) => void;
}) {
  const children = rows.filter((r) => r.task.parentTaskId === task.id).map((r) => r.task);
  const body = plainText(task);

  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l bg-card shadow-xl">
      <div className="flex items-start gap-2 border-b px-5 py-4">
        <h2 className="min-w-0 flex-1 text-lg font-semibold leading-snug text-foreground">{task.title}</h2>
        <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Close">
          <TbX size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-auto px-5 py-4">
        <div className="grid grid-cols-2 gap-4">
          <Fact label="Status">
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", STATUS_CHIP[task.workflowStatus?.color ?? "stone"] ?? STATUS_CHIP.stone)}>
              {task.workflowStatus?.name ?? task.status}
            </span>
          </Fact>
          <Fact label="Assignee">{task.assignee?.fullName ?? <span className="text-muted-foreground">Unassigned</span>}</Fact>
          <Fact label="Priority">{task.priority}</Fact>
          {day(task.startDate) && <Fact label="Started">{day(task.startDate)}</Fact>}
          {day(task.dueDate) && <Fact label="Due">{day(task.dueDate)}</Fact>}
          {day(task.completedAt) && <Fact label="Completed">{day(task.completedAt)}</Fact>}
        </div>

        {!!task.tags?.length && (
          <div className="flex flex-wrap gap-1.5">
            {task.tags.map((t) => (
              <span key={t.id} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground/75">{t.label}</span>
            ))}
          </div>
        )}

        {body && (
          <Fact label="Details">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{body}</p>
          </Fact>
        )}

        {!!children.length && (
          <Fact label={`Subitems (${children.length})`}>
            <ul className="mt-1 space-y-1">
              {children.map((c) => (
                <li key={c.id}>
                  <button onClick={() => onOpen(c)} className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-sm hover:bg-muted">
                    <span className={cn("rounded-full px-1.5 text-[10px]", STATUS_CHIP[c.workflowStatus?.color ?? "stone"] ?? STATUS_CHIP.stone)}>
                      {c.workflowStatus?.name ?? c.status}
                    </span>
                    <span className="truncate">{c.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Fact>
        )}
      </div>
    </aside>
  );
}
