"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TbTarget,
  TbPlus,
  TbLayoutSidebarRightFilled,
  TbLoader,
  TbChevronRight,
  TbX,
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
  const [mobileDetail, setMobileDetail] = useState(false);
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
    setMobileDetail(true);
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
    setMobileDetail(true);
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
      setMobileDetail(false);
    } catch (err: any) {
      alert(err?.message || "Failed to save leave type");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 gap-2 h-full overflow-hidden">
      <main className={cn(
        "flex min-h-0 flex-col h-full w-full overflow-hidden glass-panel",
        isSubNavExpanded ? "rounded-r-xl max-sm:rounded-xl" : "rounded-xl"
      )}>
        <div className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2 sm:py-0 border-b border-border glass-header">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <SubNavToggle />
            <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate">Leave Policies</h1>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap shrink-0"
          >
            <TbPlus size={15} />
            <span>Add Leave Type</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <TbLoader size={32} className="animate-spin" />
            </div>
          ) : leaveTypes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <TbTarget size={56} className="text-muted-foreground/50" />
              <div>
                <p className="font-semibold text-foreground/85">No leave types yet</p>
                <p className="text-sm text-muted-foreground mt-1">Add your first leave type to get started.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl glass-card overflow-x-auto shadow-xs">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Leave Type</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Days / Year</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Paid / Unpaid</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Color</th>
                    <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaveTypes.map(type => (
                    <tr
                      key={type.id}
                      onClick={() => openEdit(type)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/40",
                        selected?.id === type.id && "bg-muted/40"
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground">{type.name}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{type.daysPerYear}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          type.isPaid ? "bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300" : "bg-muted text-foreground/70"
                        )}>
                          {type.isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="h-6 w-6 rounded-full border-2 border-white shadow shrink-0"
                          style={{ backgroundColor: type.color }}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{type.description || "—"}</td>
                      <td className="px-4 py-3">
                        <TbChevronRight size={16} className="text-muted-foreground/70" />
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
        "min-h-0 flex-col bg-card overflow-hidden transition-all duration-200 ease-in-out",
        mobileDetail ? "fixed inset-0 z-50 flex w-full max-w-full" : "hidden",
        "lg:static lg:z-auto lg:flex lg:h-full lg:rounded-xl",
        isPanelOpen ? "lg:w-[42%]" : "lg:w-0"
      )}>
        <div className="flex h-full flex-col">
          <div className="sticky top-0 w-full flex items-center justify-between min-h-16 px-4 sm:px-5 py-2 sm:py-0 border-b bg-card z-10 shrink-0">
            <div className="flex items-center gap-4 self-stretch">
              <p className="flex self-stretch items-center text-sm sm:text-md font-medium tracking-tight border-b-2 border-blue-600 text-foreground -mb-px">
                {isNew ? "New Leave Type" : "Edit Leave Type"}
              </p>
            </div>
            <button
              onClick={() => { setIsPanelOpen(false); setMobileDetail(false); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close"
            >
              <TbX size={18} className="lg:hidden" />
              <TbLayoutSidebarRightFilled size={18} className="hidden lg:block" />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-auto p-4 sm:p-5 space-y-3.5 sm:space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Sick Leave"
                className="w-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm rounded-xl border border-border bg-muted/40 focus:ring-2 focus:ring-ring outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Days per Year</label>
              <input
                type="number"
                value={form.daysPerYear}
                onChange={e => setForm(f => ({ ...f, daysPerYear: parseInt(e.target.value) || 0 }))}
                min={1}
                className="w-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm rounded-xl border border-border bg-muted/40 focus:ring-2 focus:ring-ring outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={cn(
                      "h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 transition-all shrink-0",
                      form.color === c ? "border-primary scale-110" : "border-transparent hover:scale-105"
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
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg border border-border cursor-pointer shrink-0"
                />
                <span className="text-xs text-muted-foreground">Custom: {form.color}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Type</label>
              <div className="flex gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isPaid: true }))}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all",
                    form.isPaid ? "bg-green-600 text-white border-green-600" : "bg-card text-foreground/70 border-border hover:bg-muted/40"
                  )}
                >
                  Paid
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isPaid: false }))}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all",
                    !form.isPaid ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground/70 border-border hover:bg-muted/40"
                  )}
                >
                  Unpaid
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this leave type..."
                className="w-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm rounded-xl border border-border bg-muted/40 focus:ring-2 focus:ring-ring outline-none h-20 resize-none"
              />
            </div>

            <div className="pt-3 sm:pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-xl font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all shadow-lg active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
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
