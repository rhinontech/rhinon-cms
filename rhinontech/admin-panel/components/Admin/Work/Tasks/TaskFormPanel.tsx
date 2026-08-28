"use client";

import { TbLoader } from "react-icons/tb";
import { PRIORITIES, STATUSES } from "./constants";
import type { ApiTask, PersonOption, ProjectOption, TaskFormState } from "./types";

function Field({
  label, value, onChange, required, type = "text", ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        {...rest}
      />
    </label>
  );
}

function SelectField({
  label, value, onChange, children, className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className ? `block ${className}` : "block"}>
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}

export function TaskFormPanel({
  form, setForm, saving, tasks, editingId, projects, people, onSubmit, onCancel,
}: {
  form: TaskFormState;
  setForm: React.Dispatch<React.SetStateAction<TaskFormState>>;
  saving: boolean;
  tasks: ApiTask[];
  editingId: string | null;
  projects: ProjectOption[];
  people: PersonOption[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const set = <K extends keyof TaskFormState>(k: K, v: TaskFormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 space-y-4 overflow-auto p-5">
        <Field label="Task Title" value={form.title} onChange={(v) => set("title", v)} required placeholder="What needs doing?" />

        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="min-h-20 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Priority" value={form.priority} onChange={(v) => set("priority", v as TaskFormState["priority"])}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </SelectField>

          <SelectField label="Status" value={form.status} onChange={(v) => set("status", v as TaskFormState["status"])}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </SelectField>

          <SelectField label="Assignee" value={form.assigneeId} onChange={(v) => set("assigneeId", v)}>
            <option value="">Unassigned</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </SelectField>

          <SelectField label="Project" value={form.projectId} onChange={(v) => set("projectId", v)}>
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>

          <Field label="Due date" type="date" value={form.dueDate} onChange={(v) => set("dueDate", v)} />
          <Field label="Estimate (h)" type="number" step="0.5" min="0" value={form.estimatedHours} onChange={(v) => set("estimatedHours", v)} />

          <SelectField label="Recurrence" value={form.recurrence} onChange={(v) => set("recurrence", v)}>
            <option value="">None</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </SelectField>

          <SelectField label="Blocked by" value={form.blockedById} onChange={(v) => set("blockedById", v)}>
            <option value="">Not blocked</option>
            {tasks.filter((t) => t.id !== editingId).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </SelectField>
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t p-4">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50">
          {saving && <TbLoader className="animate-spin" size={13} />} Save Task
        </button>
      </div>
    </form>
  );
}
