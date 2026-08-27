"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TbPlus, TbBuilding, TbCalendar, TbX, TbSettings, TbUsers, TbArrowRight } from "react-icons/tb";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { useSideNav } from "@/context/SideNavContext";
import type { BoardStage, Deal, UserRef, AccountRef, PipelineStage } from "./types";
import { DealDrawer } from "./DealDrawer";
import { StageSettingsDialog } from "./StageSettingsDialog";
import { Avatar, StageDot, TBtn, formatMoney, formatDate } from "./ui";

interface BoardResponse {
  stages: BoardStage[];
  unstaged: Deal[];
}

export function DealsBoard() {
  const { isExpanded: isSubNavExpanded } = useSideNav();
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [owners, setOwners] = useState<UserRef[]>([]);
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDealId, setOpenDealId] = useState<string | null>(null);
  const [showStages, setShowStages] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(async () => {
    try {
      const q = ownerFilter !== "All" ? `?ownerId=${ownerFilter}` : "";
      setBoard(await apiFetch<BoardResponse>(`/deals/board${q}`));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board");
    } finally {
      setLoading(false);
    }
  }, [ownerFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { apiFetch<UserRef[]>("/crm/users").then(setOwners).catch(() => {}); }, []);

  const allDeals = useMemo(
    () => (board ? board.stages.flatMap((s) => s.deals).concat(board.unstaged) : []),
    [board]
  );
  const activeDeal = allDeals.find((d) => d.id === activeId) || null;
  const stageList: PipelineStage[] = useMemo(
    () => (board?.stages || []).map(({ deals: _deals, dealCount: _c, totalValue: _t, weightedValue: _w, ...stage }) => stage),
    [board]
  );

  const pathname = usePathname();
  const leadsHref = `/${pathname.split("/")[1]}/crm`;
  const isEmpty = Boolean(board) && board!.stages.every((s) => s.dealCount === 0) && board!.unstaged.length === 0;

  const totals = useMemo(() => {
    if (!board) return { open: 0, weighted: 0, count: 0 };
    const open = board.stages.filter((s) => s.type === "Open");
    return {
      open: open.reduce((sum, s) => sum + s.totalValue, 0),
      weighted: open.reduce((sum, s) => sum + s.weightedValue, 0),
      count: open.reduce((sum, s) => sum + s.dealCount, 0),
    };
  }, [board]);

  const moveDeal = async (dealId: string, stageId: string) => {
    const snapshot = board;
    // Optimistic: lift the card out of its column and drop it in the target.
    setBoard((prev) => {
      if (!prev) return prev;
      let moving: Deal | undefined;
      const stripped = prev.stages.map((s) => {
        const keep = s.deals.filter((d) => {
          if (d.id === dealId) { moving = d; return false; }
          return true;
        });
        return { ...s, deals: keep };
      });
      if (!moving) return prev;
      const next = stripped.map((s) => {
        if (s.id !== stageId) return s;
        const deals = [{ ...moving!, stageId }, ...s.deals];
        return { ...s, deals };
      });
      return { ...prev, stages: recount(next), unstaged: prev.unstaged.filter((d) => d.id !== dealId) };
    });

    try {
      await apiFetch(`/deals/${dealId}`, { method: "PUT", body: JSON.stringify({ stageId }) });
      load(); // re-sync totals/status from the server, which owns those
    } catch (err) {
      setBoard(snapshot ?? null);
      setError(err instanceof Error ? err.message : "Failed to move deal");
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const deal = allDeals.find((d) => d.id === active.id);
    const targetStage = over.id as string;
    if (deal && deal.stageId !== targetStage) moveDeal(deal.id, targetStage);
  };

  return (
    <main className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden glass-panel", isSubNavExpanded ? "rounded-r-xl" : "rounded-xl")}>
      <div className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-stone-200/70 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <SubNavToggle />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-stone-900">Pipeline</h1>
            <p className="text-[11px] tabular-nums text-stone-500">
              {totals.count} open · {formatMoney(totals.open)} ·{" "}
              <span title="Value discounted by each stage's probability">
                {formatMoney(totals.weighted)} weighted
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="rounded-md border border-stone-200 bg-white/70 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="All">All owners</option>
            {owners.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
          </select>
          <TBtn onClick={() => setShowStages(true)} title="Manage pipeline stages"><TbSettings size={14} /> Stages</TBtn>
          <TBtn variant="solid" onClick={() => setShowNew(true)}><TbPlus size={14} /> New deal</TBtn>
        </div>
      </div>

      {error && (
        <p className="shrink-0 border-b border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] text-rose-700">{error}</p>
      )}

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-3">
        {loading ? (
          <div className="flex h-full gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-full w-[248px] shrink-0 animate-pulse rounded-lg bg-stone-100/70" />
            ))}
          </div>
        ) : (
          isEmpty ? (
          // Six empty columns explain nothing. A pipeline starts empty by
          // design — deals are the few things being actively worked, not the
          // whole lead list — so say that and point at the way in.
          <div className="flex h-full items-center justify-center p-6">
            <div className="max-w-md text-center">
              <p className="text-sm font-semibold text-stone-800">No deals yet</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-stone-500">
                The pipeline holds deals, not leads. A lead becomes a deal once it is
                qualified and has money attached — so this board stays small and
                workable while your lead list grows.
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-stone-400">
                Select the leads worth pursuing and use <span className="font-medium text-stone-600">Convert to deals</span>,
                or add one directly here.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Link
                  href={leadsHref}
                  className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white/70 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
                >
                  <TbUsers size={14} /> Go to leads <TbArrowRight size={13} />
                </Link>
                <TBtn variant="solid" onClick={() => setShowNew(true)}><TbPlus size={14} /> New deal</TBtn>
              </div>
            </div>
          </div>
          ) : (
          <DndContext
            sensors={sensors}
            onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
            onDragEnd={handleDragEnd}
          >
            <div className="flex h-full gap-2.5">
              {board?.stages.map((stage) => <StageColumn key={stage.id} stage={stage} onOpen={setOpenDealId} />)}
            </div>
            <DragOverlay>{activeDeal ? <DealCard deal={activeDeal} overlay /> : null}</DragOverlay>
          </DndContext>
          )
        )}
      </div>

      {showStages && (
        <StageSettingsDialog onClose={(changed) => { setShowStages(false); if (changed) load(); }} />
      )}

      {openDealId && (
        <DealDrawer
          dealId={openDealId}
          stages={stageList}
          owners={owners}
          onClose={() => setOpenDealId(null)}
          onChanged={load}
        />
      )}

      {showNew && (
        <NewDealDialog
          stages={board?.stages || []}
          owners={owners}
          onClose={(created) => { setShowNew(false); if (created) load(); }}
        />
      )}
    </main>
  );
}

/** Recompute per-column subtotals after an optimistic move. */
function recount(stages: BoardStage[]): BoardStage[] {
  return stages.map((s) => {
    const totalValue = s.deals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    return {
      ...s,
      dealCount: s.deals.length,
      totalValue,
      weightedValue: Math.round((totalValue * s.probability) / 100),
    };
  });
}

function StageColumn({ stage, onOpen }: { stage: BoardStage; onOpen: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-[248px] shrink-0 flex-col rounded-lg border border-stone-200/70 bg-white/45 transition-colors",
        isOver && "border-blue-300 bg-blue-50/60"
      )}
    >
      <div className="shrink-0 border-b border-stone-200/70 px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <StageDot color={stage.color} type={stage.type} />
            <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-stone-600">{stage.name}</span>
          </span>
          <span className="shrink-0 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-stone-500">
            {stage.dealCount}
          </span>
        </div>
        <p className="mt-1 text-[11px] font-medium tabular-nums text-stone-500">
          {formatMoney(stage.totalValue)}
          {stage.type === "Open" && stage.probability > 0 && (
            <span className="ml-1 text-stone-400">· {stage.probability}%</span>
          )}
        </p>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-1.5">
        {stage.deals.map((deal) => <DealCard key={deal.id} deal={deal} onOpen={onOpen} />)}
        {stage.deals.length === 0 && (
          <div className="rounded border border-dashed border-stone-200 py-5 text-center text-[10px] text-stone-300">
            Drop here
          </div>
        )}
        {Boolean(stage.hiddenCount) && (
          <p className="py-1.5 text-center text-[10px] text-stone-400">
            +{stage.hiddenCount} more — filter by owner to narrow
          </p>
        )}
      </div>
    </div>
  );
}

function DealCard({ deal, overlay, onOpen }: { deal: Deal; overlay?: boolean; onOpen?: (id: string) => void }) {
  // The DragOverlay copy must not register a second draggable with the same id.
  if (overlay) {
    return (
      <div className="w-[232px] rotate-2 rounded-md border border-stone-200 bg-white p-2 shadow-lg">
        <DealCardBody deal={deal} />
      </div>
    );
  }
  return <DraggableDealCard deal={deal} onOpen={onOpen} />;
}

function DraggableDealCard({ deal, onOpen }: { deal: Deal; onOpen?: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  // dnd-kit still emits a click after a drag settles, which would pop the
  // drawer open every time a card is moved. Compare pointer-down to pointer-up
  // and treat anything that travelled as a drag, not a click.
  const downAt = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onPointerDown={(e) => { downAt.current = { x: e.clientX, y: e.clientY }; }}
      onClick={(e) => {
        const start = downAt.current;
        downAt.current = null;
        if (!start) return;
        const travelled = Math.hypot(e.clientX - start.x, e.clientY - start.y);
        if (travelled < 5) onOpen?.(deal.id);
      }}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "cursor-grab touch-none rounded-md border border-stone-200 bg-white/90 p-2 shadow-sm transition-shadow hover:shadow active:cursor-grabbing",
        isDragging && "opacity-30"
      )}
    >
      <DealCardBody deal={deal} />
    </div>
  );
}

function DealCardBody({ deal }: { deal: Deal }) {
  const overdue =
    deal.status === "Open" &&
    deal.expectedCloseDate &&
    new Date(deal.expectedCloseDate) < new Date(new Date().toDateString());

  return (
    <>
      <p className="truncate text-[13px] font-medium leading-tight text-stone-900">{deal.title}</p>
      <p className="mt-1 text-[13px] font-semibold tabular-nums text-stone-800">
        {formatMoney(deal.value, deal.currency)}
      </p>
      {deal.account && (
        <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-stone-500">
          <TbBuilding size={11} className="shrink-0" /> {deal.account.name}
        </p>
      )}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        {deal.expectedCloseDate ? (
          <span className={cn("flex items-center gap-1 text-[10px] tabular-nums", overdue ? "text-rose-500" : "text-stone-400")}>
            <TbCalendar size={10} /> {formatDate(deal.expectedCloseDate)}
          </span>
        ) : <span />}
        <Avatar name={deal.owner?.fullName} size={18} />
      </div>
    </>
  );
}

function NewDealDialog({
  stages,
  owners,
  onClose,
}: {
  stages: BoardStage[];
  owners: UserRef[];
  onClose: (created: boolean) => void;
}) {
  const [form, setForm] = useState({
    title: "", value: "", currency: "INR",
    stageId: stages.find((s) => s.type === "Open")?.id || "",
    ownerId: "", expectedCloseDate: "", accountId: "", notes: "",
  });
  const [accounts, setAccounts] = useState<AccountRef[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ rows: AccountRef[] }>("/accounts?limit=200")
      .then((r) => setAccounts(r.rows))
      .catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/deals", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          value: form.value ? Number(form.value) : 0,
          currency: form.currency,
          stageId: form.stageId || undefined,
          ownerId: form.ownerId || undefined,
          accountId: form.accountId || undefined,
          expectedCloseDate: form.expectedCloseDate || undefined,
          notes: form.notes || undefined,
        }),
      });
      onClose(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deal");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay p-4" onClick={() => onClose(false)}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-xl glass-modal p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900">New deal</h2>
          <button type="button" onClick={() => onClose(false)} className="rounded p-1 text-stone-400 hover:bg-stone-100">
            <TbX size={16} />
          </button>
        </div>

        <div className="space-y-2.5">
          <Field label="Title">
            <input
              required autoFocus value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Acme — website revamp"
              className={INPUT}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Value">
              <input
                type="number" min={0} value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="500000"
                className={cn(INPUT, "tabular-nums")}
              />
            </Field>
            <Field label="Currency">
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={INPUT}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Stage">
              <select value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })} className={INPUT}>
                {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Expected close">
              <input
                type="date" value={form.expectedCloseDate}
                onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
                className={INPUT}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Account">
              <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} className={INPUT}>
                <option value="">—</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
            <Field label="Owner">
              <select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} className={INPUT}>
                <option value="">Me</option>
                {owners.map((o) => <option key={o.id} value={o.id}>{o.fullName}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {error && <p className="mt-2.5 rounded border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <TBtn onClick={() => onClose(false)}>Cancel</TBtn>
          <TBtn variant="solid" type="submit" disabled={saving || !form.title.trim()}>
            {saving ? "Creating…" : "Create deal"}
          </TBtn>
        </div>
      </form>
    </div>
  );
}

const INPUT =
  "w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-500/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</span>
      {children}
    </label>
  );
}
