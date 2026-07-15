"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TbGripVertical, TbMail, TbBuilding } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";

type LeadStatus = "New" | "Enriched" | "Enrolled" | "Emailed" | "Replied" | "Bounced" | "Unsubscribed" | "Interested";

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  status: LeadStatus;
  source: string;
}

const COLUMNS: { status: LeadStatus; label: string; accent: string }[] = [
  { status: "New", label: "New", accent: "border-t-blue-400" },
  { status: "Enriched", label: "Enriched", accent: "border-t-purple-400" },
  { status: "Enrolled", label: "Enrolled", accent: "border-t-indigo-400" },
  { status: "Emailed", label: "Emailed", accent: "border-t-yellow-400" },
  { status: "Interested", label: "Interested", accent: "border-t-green-400" },
  { status: "Replied", label: "Replied", accent: "border-t-emerald-400" },
  { status: "Bounced", label: "Bounced", accent: "border-t-red-400" },
  { status: "Unsubscribed", label: "Unsubscribed", accent: "border-t-stone-400" },
];

export function PipelinePage() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [moving, setMoving] = useState<Set<string>>(new Set());

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const fetchLeads = useCallback(async () => {
    try {
      const data = await apiFetch<Lead[]>("/leads");
      setLeads(data);
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const columns = useMemo(() => {
    const grouped = {} as Record<LeadStatus, Lead[]>;
    for (const c of COLUMNS) grouped[c.status] = [];
    for (const lead of leads) grouped[lead.status]?.push(lead);
    return grouped;
  }, [leads]);

  const activeLead = leads.find((l) => l.id === activeId) || null;

  const moveLead = async (id: string, status: LeadStatus) => {
    const prev = leads;
    setLeads((current) => current.map((l) => (l.id === id ? { ...l, status } : l)));
    setMoving((s) => new Set(s).add(id));
    try {
      await apiFetch(`/leads/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
    } catch {
      setLeads(prev); // revert on failure
      alert("Failed to update lead status");
    } finally {
      setMoving((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const targetStatus = over.id as LeadStatus;
    const lead = leads.find((l) => l.id === active.id);
    if (lead && lead.status !== targetStatus) moveLead(lead.id, targetStatus);
  };

  return (
    <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden glass-panel", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <SubNavToggle />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-gray-900">Pipeline</h1>
            <p className="text-xs text-gray-500">Drag a lead to change its stage.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        {loading ? (
          <div className="flex gap-3">
            {COLUMNS.map((c) => (
              <div key={c.status} className="h-full w-64 shrink-0 animate-pulse rounded-xl bg-stone-100" />
            ))}
          </div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-3">
              {COLUMNS.map((col) => (
                <PipelineColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  accent={col.accent}
                  leads={columns[col.status] || []}
                  movingIds={moving}
                  onMove={moveLead}
                />
              ))}
            </div>
            <DragOverlay>
              {activeLead ? <LeadCard lead={activeLead} dragging /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </main>
  );
}

function PipelineColumn({
  status,
  label,
  accent,
  leads,
  movingIds,
  onMove,
}: {
  status: LeadStatus;
  label: string;
  accent: string;
  leads: Lead[];
  movingIds: Set<string>;
  onMove: (id: string, status: LeadStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-64 shrink-0 flex-col rounded-xl border-t-4 bg-stone-50/80 transition-colors",
        accent,
        isOver && "bg-stone-100 ring-2 ring-stone-300"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-600">{label}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-stone-400">{leads.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} isMoving={movingIds.has(lead.id)} onMove={onMove} />
        ))}
        {leads.length === 0 && (
          <div className="rounded-lg border border-dashed border-stone-200 py-6 text-center text-[11px] text-stone-300">Empty</div>
        )}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  dragging,
  isMoving,
  onMove,
}: {
  lead: Lead;
  dragging?: boolean;
  isMoving?: boolean;
  onMove?: (id: string, status: LeadStatus) => void;
}) {
  // The overlay copy (rendered inside <DragOverlay>) is a plain static card — it
  // must not register its own draggable, or dnd-kit warns about duplicate ids.
  if (dragging) {
    return (
      <div className="rotate-2 rounded-lg border border-stone-200 bg-white p-2.5 shadow-lg">
        <LeadCardBody lead={lead} />
      </div>
    );
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "group cursor-grab touch-none rounded-lg border border-stone-200 bg-white p-2.5 shadow-sm active:cursor-grabbing",
        isDragging && "opacity-30",
        isMoving && "opacity-50"
      )}
    >
      <LeadCardBody lead={lead} />
      {onMove && (
        <select
          value={lead.status}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onMove(lead.id, e.target.value as LeadStatus)}
          className="mt-1.5 w-full rounded border border-stone-200 bg-white px-1 py-1 text-[10px] text-stone-500 outline-none sm:hidden"
          title="Move to (mobile fallback)"
        >
          {COLUMNS_FALLBACK.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function LeadCardBody({ lead }: { lead: Lead }) {
  return (
    <>
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="truncate text-sm font-semibold text-stone-900">{lead.name}</p>
        <TbGripVertical size={14} className="mt-0.5 shrink-0 text-stone-300" />
      </div>
      <p className="flex items-center gap-1 truncate text-xs text-stone-500">
        <TbBuilding size={12} className="shrink-0" /> {lead.company}
      </p>
      <p className="flex items-center gap-1 truncate text-xs text-stone-400">
        <TbMail size={12} className="shrink-0" /> {lead.email}
      </p>
      <span className="mt-1.5 block truncate text-[10px] font-medium uppercase tracking-wide text-stone-300">{lead.source}</span>
    </>
  );
}

const COLUMNS_FALLBACK: LeadStatus[] = [
  "New", "Enriched", "Enrolled", "Emailed", "Interested", "Replied", "Bounced", "Unsubscribed",
];
