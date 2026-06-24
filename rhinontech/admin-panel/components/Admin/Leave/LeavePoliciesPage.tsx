"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbTarget,
  TbPlus,
  TbLayoutSidebarRightFilled,
  TbLoader,
  TbChevronRight,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";

interface LeaveType {
  id: string;
  name: string;
  daysPerYear: number;
  color: string;
  isPaid: boolean;
  description?: string;
}

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#EC4899", "#84CC16", "#F97316", "#6366F1",
];

export function LeavePoliciesPage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LeaveType | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    daysPerYear: 12,
    color: "#3B82F6",
    isPaid: true,
    description: "",
  });

  const fetchTypes = useCallback(async () => {
    try {
      const data = await apiFetch<LeaveType[]>("/leave/types");
      setLeaveTypes(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const openNew = () => {
    setForm({ name: "", daysPerYear: 12, color: "#3B82F6", isPaid: true, description: "" });
    setSelected(null);
    setIsNew(true);
    setIsPanelOpen(true);
  };

  const openEdit = (type: LeaveType) => {
    setForm({
      name: type.name,
      daysPerYear: type.daysPerYear,
      color: type.color,
      isPaid: type.isPaid,
      description: type.description || "",
    });
    setSelected(type);
    setIsNew(false);
    setIsPanelOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        const created = await apiFetch<LeaveType>("/leave/types", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setLeaveTypes(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      } else if (selected) {
        const updated = await apiFetch<LeaveType>(`/leave/types/${selected.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        setLeaveTypes(prev => prev.map(t => t.id === updated.id ? updated : t));
        setSelected(updated);
      }
      if (isNew) { setIsPanelOpen(false); setIsNew(false); }
    } catch (err: any) {
      alert(err?.message || "Failed to save leave type");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 gap-2 h-full overflow-hidden">
      <main className={cn(
        "flex min-h-0 flex-col h-full w-full overflow-hidden bg-stone-50",
        isSubNavExpanded ? "rounded-r-xl" : "rounded-xl"
      )}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 h-16 px-5 border-b bg-stone-50">
          <div className="flex items-center gap-3">
            <SubNavToggle />
            <h1 className="text-lg font-semibold tracking-tight">Leave Policies</h1>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <TbPlus size={16} />
            Add Leave Type
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <TbLoader size={32} className="animate-spin" />
            </div>
          ) : leaveTypes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <TbTarget size={56} className="text-gray-200" />
              <div>
                <p className="font-semibold text-gray-700">No leave types yet</p>
                <p className="text-sm text-gray-400 mt-1">Add your first leave type to get started.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Leave Type</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Days / Year</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Paid / Unpaid</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Color</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leaveTypes.map(type => (
                    <tr
                      key={type.id}
                      onClick={() => openEdit(type)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-stone-50",
                        selected?.id === type.id && "bg-stone-50"
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">{type.name}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{type.daysPerYear}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          type.isPaid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        )}>
                          {type.isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="h-6 w-6 rounded-full border-2 border-white shadow"
                          style={{ backgroundColor: type.color }}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{type.description || "—"}</td>
                      <td className="px-4 py-3">
                        <TbChevronRight size={16} className="text-gray-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Aside Panel */}
      <aside className={cn(
        "flex min-h-0 h-full flex-col bg-white rounded-xl overflow-hidden transition-all duration-200 ease-in-out",
        isPanelOpen ? "w-[42%]" : "w-0"
      )}>
        <div className="flex h-full flex-col">
          <div className="sticky top-0 w-full flex items-center justify-between h-16 px-5 border-b bg-white z-10">
            <div className="flex items-center gap-4 self-stretch">
              <p className="flex self-stretch items-center text-md font-medium tracking-tight border-b-2 border-blue-600 text-black -mb-px">
                {isNew ? "New Leave Type" : "Edit Leave Type"}
              </p>
            </div>
            <button onClick={() => setIsPanelOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
              <TbLayoutSidebarRightFilled size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-auto p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Sick Leave"
                className="w-full px-4 py-2 text-sm rounded-xl border border-gray-100 bg-stone-50 focus:ring-2 focus:ring-stone-900 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Days per Year</label>
              <input
                type="number"
                value={form.daysPerYear}
                onChange={e => setForm(f => ({ ...f, daysPerYear: parseInt(e.target.value) || 0 }))}
                min={1}
                className="w-full px-4 py-2 text-sm rounded-xl border border-gray-100 bg-stone-50 focus:ring-2 focus:ring-stone-900 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      form.color === c ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="h-8 w-8 rounded-lg border border-gray-100 cursor-pointer"
                />
                <span className="text-xs text-gray-400">Custom: {form.color}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Type</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isPaid: true }))}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-semibold border transition-all",
                    form.isPaid ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isPaid: false }))}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-semibold border transition-all",
                    !form.isPaid ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  Unpaid
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this leave type..."
                className="w-full px-4 py-2 text-sm rounded-xl border border-gray-100 bg-stone-50 focus:ring-2 focus:ring-stone-900 outline-none h-20 resize-none"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-800 transition-all shadow-lg active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <TbLoader size={16} className="animate-spin" />}
                {isNew ? "Create Leave Type" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </div>
  );
}
