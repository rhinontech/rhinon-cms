"use client";

import { FormEvent, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  TbAlertTriangle, TbChevronDown, TbChevronRight, TbFile, TbPaperclip, TbPlus, TbSubtask, TbTrash, TbX,
} from "react-icons/tb";
import { CustomFieldCell, SelectCell, TitleCell } from "./CellEditors";
import { DatePicker } from "@/components/ui/date-picker";
import { STATUS_CHIP } from "./constants";
import type { FieldDefinition, FieldType, PersonOption, ProjectTask, TaskRow, WorkflowStatus } from "./types";
import type { GroupKey } from "./WorkspaceToolbar";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "percent", label: "Percent" },
  { value: "date", label: "Date" },
  { value: "checkbox", label: "Checkbox" },
  { value: "dropdown", label: "Dropdown" },
  { value: "user", label: "Person" },
];

function isOverdue(task: ProjectTask) {
  if (!task.dueDate || task.status === "Done") return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

export function TableView({
  rows, statuses, fields, people, collapsed, rosterAvailable, group,
  onToggleCollapsed, onPatch, onCreate, onDelete, onAddField, onRemoveField, onOpenTask,
}: {
  rows: TaskRow[];
  statuses: WorkflowStatus[];
  fields: FieldDefinition[];
  people: PersonOption[];
  collapsed: Set<string>;
  rosterAvailable: boolean;
  group: GroupKey;
  onToggleCollapsed: (id: string) => void;
  onPatch: (id: string, patch: Record<string, unknown>) => void;
  onCreate: (title: string, parentTaskId?: string | null) => void;
  onDelete: (id: string) => void;
  onAddField: (name: string, type: FieldType, options?: string[]) => void;
  onRemoveField: (id: string) => void;
  onOpenTask: (task: ProjectTask) => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [addingField, setAddingField] = useState(false);
  const [fieldForm, setFieldForm] = useState({ name: "", type: "text" as FieldType, options: "" });
  const [subtaskFor, setSubtaskFor] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  // Fixed columns, then one per custom field, then Files and the add-column button.
  const gridTemplate = `2.4rem minmax(220px,2fr) 150px 150px 120px ${fields.map(() => "120px").join(" ")} 90px 2.5rem`;

  /**
   * Grouping flattens the tree: a section can't also be a hierarchy without the
   * two orderings fighting, so when a group is active every task renders at
   * depth 0 under its section header.
   */
  const sections = useMemo(() => {
    if (group === "none") return [{ key: "__all", label: "", rows }];
    const buckets = new Map<string, { key: string; label: string; rows: TaskRow[] }>();
    for (const row of rows) {
      const t = row.task;
      let key = "__none";
      let label = "None";
      if (group === "assignee") {
        key = t.assigneeId ?? "__none";
        label = t.assignee?.fullName ?? "Unassigned";
      } else if (group === "status") {
        key = t.statusId ?? "__none";
        label = t.workflowStatus?.name ?? "No status";
      } else if (group === "priority") {
        key = t.priority;
        label = t.priority;
      }
      if (!buckets.has(key)) buckets.set(key, { key, label, rows: [] });
      buckets.get(key)!.rows.push({ ...row, depth: 0, hasChildren: false });
    }
    return [...buckets.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [rows, group]);

  const submitField = (e: FormEvent) => {
    e.preventDefault();
    if (!fieldForm.name.trim()) return;
    const options = fieldForm.type === "dropdown"
      ? fieldForm.options.split(",").map((o) => o.trim()).filter(Boolean)
      : undefined;
    onAddField(fieldForm.name.trim(), fieldForm.type, options);
    setFieldForm({ name: "", type: "text", options: "" });
    setAddingField(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!rosterAvailable && (
        <p className="flex shrink-0 items-center gap-1.5 border-b bg-amber-50 px-4 py-1.5 text-[11px] text-amber-800">
          <TbAlertTriangle size={12} className="shrink-0" />
          Your role lacks <code className="font-mono">people:read</code>, so the assignee list only
          shows people already on this project. An admin can grant it in Settings → Roles.
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-max">
          {/* header */}
          <div
            className="sticky top-0 z-10 grid items-center border-b glass-thead px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <span />
            <span className="px-1.5">Name</span>
            <span className="px-1.5">Assignee</span>
            <span className="px-1.5">Status</span>
            <span className="px-1.5">Due date</span>
            {fields.map((f) => (
              <span key={f.id} className="group flex items-center gap-1 px-1.5">
                <span className="truncate">{f.name}</span>
                <button
                  onClick={() => {
                    if (window.confirm(`Remove the "${f.name}" column? Existing values are kept but hidden.`)) {
                      onRemoveField(f.id);
                    }
                  }}
                  className="opacity-0 transition group-hover:opacity-100"
                  title="Remove column"
                >
                  <TbX size={11} className="text-stone-400 hover:text-red-600" />
                </button>
              </span>
            ))}
            <span className="px-1.5">Files</span>
            <button
              onClick={() => setAddingField((a) => !a)}
              title="Add a column"
              className="flex items-center justify-center rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
            >
              <TbPlus size={14} />
            </button>
          </div>

          {addingField && (
            <form onSubmit={submitField} className="flex flex-wrap items-center gap-2 border-b bg-blue-50/50 px-3 py-2">
              <input
                autoFocus
                value={fieldForm.name}
                onChange={(e) => setFieldForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Column name (e.g. Budget)"
                className="w-56 rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={fieldForm.type}
                onChange={(e) => setFieldForm((f) => ({ ...f, type: e.target.value as FieldType }))}
                className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm outline-none"
              >
                {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {fieldForm.type === "dropdown" && (
                <input
                  value={fieldForm.options}
                  onChange={(e) => setFieldForm((f) => ({ ...f, options: e.target.value }))}
                  placeholder="Low, Medium, High"
                  className="w-56 rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              <button type="submit" className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white">
                Add column
              </button>
              <button type="button" onClick={() => setAddingField(false)} className="rounded-lg px-2 py-1.5 text-xs text-stone-600 hover:bg-stone-100">
                Cancel
              </button>
            </form>
          )}

          {/* rows */}
          {sections.map((section) => (
            <div key={section.key}>
              {group !== "none" && (
                <div className="sticky top-[37px] z-[5] flex items-center gap-2 border-b glass-thead px-3 py-1.5">
                  <span className="text-xs font-semibold text-stone-700">{section.label}</span>
                  <span className="text-[11px] text-stone-400">{section.rows.length}</span>
                </div>
              )}
              {section.rows.map(({ task, depth, hasChildren }, index) => (
            <div key={task.id}>
              <div
                className="group grid items-center border-b px-2 py-1 hover:bg-stone-50"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <span className="pl-1 text-[11px] text-stone-400">{index + 1}</span>

                <span className="flex min-w-0 items-center gap-1" style={{ paddingLeft: depth * 18 }}>
                  {hasChildren ? (
                    <button
                      onClick={() => onToggleCollapsed(task.id)}
                      className="shrink-0 rounded p-0.5 text-stone-400 hover:bg-stone-200"
                    >
                      {collapsed.has(task.id) ? <TbChevronRight size={13} /> : <TbChevronDown size={13} />}
                    </button>
                  ) : (
                    <span className="w-[18px] shrink-0" />
                  )}
                  <TbFile size={13} className="shrink-0 text-stone-400" />
                  <TitleCell
                    title={task.title}
                    onOpen={() => onOpenTask(task)}
                    onRename={(v) => onPatch(task.id, { title: v })}
                    className="font-medium text-stone-900"
                  />
                  <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => { setSubtaskFor(task.id); setSubtaskTitle(""); }}
                      title="Add subitem"
                      className="rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
                    >
                      <TbSubtask size={13} />
                    </button>
                    <button
                      onClick={() => window.confirm(`Delete "${task.title}"?`) && onDelete(task.id)}
                      title="Delete"
                      className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <TbTrash size={13} />
                    </button>
                  </span>
                </span>

                <SelectCell
                  value={task.assigneeId ?? ""}
                  options={people.map((p) => ({ value: p.id, label: p.fullName }))}
                  onCommit={(v) => onPatch(task.id, { assigneeId: v || null })}
                  placeholder="Unassigned"
                />

                <span className="px-0.5">
                  <select
                    value={task.statusId ?? ""}
                    onChange={(e) => onPatch(task.id, { statusId: e.target.value || null })}
                    className={cn(
                      "w-full cursor-pointer truncate rounded-full border-0 px-2 py-1 text-[11px] font-medium outline-none",
                      STATUS_CHIP[task.workflowStatus?.color ?? "stone"] ?? STATUS_CHIP.stone
                    )}
                  >
                    <option value="">—</option>
                    {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </span>

                <DatePicker
                  variant="cell"
                  ariaLabel={`Due date for ${task.title}`}
                  value={task.dueDate}
                  onChange={(v) => onPatch(task.id, { dueDate: v })}
                  className={isOverdue(task) ? "text-red-600" : undefined}
                />

                {fields.map((f) => (
                  <span key={f.id} className="px-0.5">
                    <CustomFieldCell
                      field={f}
                      value={task.customFields?.[f.id]}
                      people={people}
                      onCommit={(v) => onPatch(task.id, { customFields: { [f.id]: v } })}
                    />
                  </span>
                ))}

                <button
                  data-task-opener
                  onClick={() => onOpenTask(task)}
                  className="flex items-center gap-1 px-1.5 text-xs text-stone-500 hover:text-stone-800"
                >
                  {task.attachments?.length ? (
                    <><TbPaperclip size={12} /> {task.attachments.length}</>
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </button>
                <span />
              </div>

              {subtaskFor === task.id && (
                <div className="grid border-b bg-blue-50/40 px-2 py-1.5" style={{ gridTemplateColumns: gridTemplate }}>
                  <span />
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!subtaskTitle.trim()) return;
                      onCreate(subtaskTitle, task.id);
                      setSubtaskTitle("");
                      setSubtaskFor(null);
                    }}
                    style={{ paddingLeft: (depth + 1) * 18 }}
                    className="flex items-center gap-2"
                  >
                    <input
                      autoFocus
                      value={subtaskTitle}
                      onChange={(e) => setSubtaskTitle(e.target.value)}
                      onBlur={() => !subtaskTitle && setSubtaskFor(null)}
                      placeholder="Subitem name…"
                      className="w-full rounded border border-stone-200 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </form>
                </div>
              )}
            </div>
              ))}
            </div>
          ))}

          {/* add row */}
          <form
            onSubmit={(e) => { e.preventDefault(); onCreate(newTitle); setNewTitle(""); }}
            className="grid items-center px-2 py-1.5"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <span className="flex justify-center text-stone-400"><TbPlus size={13} /></span>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Item"
              className="w-full rounded border border-transparent px-1.5 py-1 text-sm outline-none placeholder:text-stone-400 hover:border-stone-200 focus:border-blue-500"
            />
          </form>

          {!rows.length && (
            <p className="px-4 py-10 text-center text-sm text-stone-400">
              No tasks in this project yet — add the first one above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
