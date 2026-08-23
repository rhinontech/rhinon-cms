"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, addMonths, format, getDay, isSameDay, isToday, startOfMonth, subMonths } from "date-fns";
import {
  TbCalendarEvent,
  TbChevronLeft,
  TbChevronRight,
  TbExternalLink,
  TbPlus,
  TbRefresh,
  TbTrash,
  TbVideo,
} from "react-icons/tb";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { usePermissions } from "@/context/PermissionsContext";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/Admin/Common/ConfirmDialog";
import { MeetingFormDialog } from "./MeetingFormDialog";
import { dayKey, formatTimeRange, type MeetingEvent } from "./types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MeetingsPage() {
  const { has } = usePermissions();
  const confirm = useConfirm();
  const canWrite = has("meetings:write");

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<MeetingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notConnected, setNotConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MeetingEvent | null>(null);

  // The grid always renders 6 weeks, so fetch that whole window — otherwise events in the
  // leading/trailing days of adjacent months would render as empty cells.
  const gridStart = useMemo(() => addDays(startOfMonth(month), -getDay(startOfMonth(month))), [month]);
  const gridDays = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const from = gridStart.toISOString();
      const to = addDays(gridStart, 42).toISOString();
      const data = await apiFetch<MeetingEvent[]>(`/meetings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      setEvents(data);
      setNotConnected(false);
    } catch (err: any) {
      if (err.message?.includes("not connected")) {
        setNotConnected(true);
        setEvents([]);
      } else {
        toast.error(err.message || "Couldn't load meetings");
      }
    } finally {
      setLoading(false);
    }
  }, [gridStart]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    apiFetch<{ connected: boolean; connectedEmail: string | null }>("/meetings/status")
      .then((s) => {
        setConnectedEmail(s.connectedEmail);
        if (!s.connected) setNotConnected(true);
      })
      .catch(() => {});
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, MeetingEvent[]>();
    for (const e of events) {
      if (!e.start) continue;
      const key = dayKey(new Date(e.start));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  const selectedEvents = eventsByDay.get(dayKey(selectedDay)) || [];

  const handleDelete = async (event: MeetingEvent) => {
    const ok = await confirm({
      title: "Delete this meeting?",
      description: `"${event.summary}" will be removed from the calendar and attendees will be notified.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiFetch(`/meetings/${event.id}`, { method: "DELETE" });
      toast.success("Meeting deleted");
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || "Couldn't delete the meeting");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (event: MeetingEvent) => {
    setEditing(event);
    setFormOpen(true);
  };

  return (
    <div className="h-full overflow-auto rounded-xl bg-muted/30">
      <div className="mx-auto max-w-[1280px] space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
            <p className="text-sm text-muted-foreground">
              {connectedEmail ? `Shared calendar · ${connectedEmail}` : "Shared company calendar"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchEvents} title="Refresh">
              <TbRefresh size={16} className={loading ? "animate-spin" : ""} />
            </Button>
            {canWrite && !notConnected && (
              <Button onClick={openCreate} className="gap-1.5">
                <TbPlus size={16} /> New meeting
              </Button>
            )}
          </div>
        </div>

        {notConnected ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center">
            <TbCalendarEvent size={28} className="mx-auto mb-2 text-amber-500" />
            <p className="text-sm font-semibold text-amber-900">The shared calendar isn&apos;t connected yet</p>
            <p className="mt-1 text-xs text-amber-700">
              An admin needs to connect support@rhinon.tech under Settings → Google Calendar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Month grid */}
            <div className="rounded-xl border bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold">{format(month, "MMMM yyyy")}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setMonth(subMonths(month, 1))} className="rounded-md border p-1.5 hover:bg-stone-100">
                    <TbChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => {
                      const now = new Date();
                      setMonth(startOfMonth(now));
                      setSelectedDay(now);
                    }}
                    className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-stone-100"
                  >
                    Today
                  </button>
                  <button onClick={() => setMonth(addMonths(month, 1))} className="rounded-md border p-1.5 hover:bg-stone-100">
                    <TbChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {WEEKDAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {gridDays.map((day) => {
                  const dayEvents = eventsByDay.get(dayKey(day)) || [];
                  const inMonth = day.getMonth() === month.getMonth();
                  const selected = isSameDay(day, selectedDay);
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "flex min-h-[68px] flex-col items-start gap-1 rounded-lg border p-1.5 text-left transition-colors",
                        selected ? "border-blue-400 bg-blue-50" : "border-stone-100 hover:bg-stone-50",
                        !inMonth && "opacity-40"
                      )}
                    >
                      <span className={cn("text-xs font-semibold", isToday(day) && "text-blue-600")}>{format(day, "d")}</span>
                      <div className="w-full space-y-0.5">
                        {dayEvents.slice(0, 2).map((e) => (
                          <span key={e.id} className="block truncate rounded bg-blue-600/10 px-1 text-[10px] text-blue-800">
                            {e.summary}
                          </span>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="block text-[10px] text-stone-500">+{dayEvents.length - 2} more</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected-day agenda */}
            <div className="rounded-xl border bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold">{format(selectedDay, "EEEE, d MMMM")}</h2>

              {loading ? (
                <p className="py-8 text-center text-xs text-muted-foreground">Loading…</p>
              ) : selectedEvents.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-muted-foreground">Nothing scheduled.</p>
                  {canWrite && (
                    <button onClick={openCreate} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">
                      Add a meeting
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border border-stone-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{event.summary}</p>
                          <p className="text-xs text-muted-foreground">{formatTimeRange(event)}</p>
                        </div>
                        {event.meetLink && (
                          <a
                            href={event.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            title="Join Google Meet"
                            className="shrink-0 text-emerald-600 hover:text-emerald-700"
                          >
                            <TbVideo size={16} />
                          </a>
                        )}
                      </div>

                      {event.attendees.length > 0 && (
                        <p className="mt-1.5 truncate text-[11px] text-stone-500">
                          {event.attendees.map((a) => a.email).join(", ")}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-3 text-[11px]">
                        {canWrite && (
                          <>
                            <button onClick={() => openEdit(event)} className="font-semibold text-blue-600 hover:underline">
                              Edit / reschedule
                            </button>
                            <button
                              onClick={() => handleDelete(event)}
                              className="flex items-center gap-1 font-semibold text-stone-400 hover:text-red-600"
                            >
                              <TbTrash size={12} /> Delete
                            </button>
                          </>
                        )}
                        {event.htmlLink && (
                          <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-auto flex items-center gap-1 text-stone-400 hover:text-stone-700"
                          >
                            Google <TbExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {formOpen && (
        <MeetingFormDialog
          event={editing}
          defaultDate={editing ? null : selectedDay}
          onClose={() => setFormOpen(false)}
          onSaved={fetchEvents}
        />
      )}
    </div>
  );
}
