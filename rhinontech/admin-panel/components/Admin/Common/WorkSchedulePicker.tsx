"use client";

import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof DAYS)[number];

const DEFAULT_DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_START = "11:00";
const DEFAULT_END = "20:00";

function parseTime12(str: string): string {
  const m = str.trim().match(/^(\d+)\s*(AM|PM)$/i);
  if (!m) return DEFAULT_START;
  let h = parseInt(m[1]);
  const isPM = m[2].toUpperCase() === "PM";
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:00`;
}

function toTime12(hhmm: string): string {
  const [hStr] = hhmm.split(":");
  const h = parseInt(hStr);
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function parseSchedule(schedule: string): { days: Day[]; start: string; end: string } {
  const dayMatch = schedule.match(/\(([^)]+)\)/);
  const timePart = schedule.replace(/\([^)]*\)/, "").trim();

  let days: Day[] = [...DEFAULT_DAYS];
  if (dayMatch) {
    const dayStr = dayMatch[1];
    if (dayStr.includes("–")) {
      const parts = dayStr.split("–").map((d) => d.trim());
      const si = DAYS.indexOf(parts[0] as Day);
      const ei = DAYS.indexOf(parts[1] as Day);
      if (si !== -1 && ei !== -1) days = [...DAYS].slice(si, ei + 1) as Day[];
    } else {
      const parsed = dayStr.split(",").map((d) => d.trim()).filter((d) => (DAYS as readonly string[]).includes(d)) as Day[];
      if (parsed.length) days = parsed;
    }
  }

  let start = DEFAULT_START;
  let end = DEFAULT_END;
  const timeMatch = timePart.match(/^(.+?)\s*[–-]\s*(.+)$/);
  if (timeMatch) {
    start = parseTime12(timeMatch[1]);
    end = parseTime12(timeMatch[2]);
  }

  return { days, start, end };
}

function generateSchedule(days: Day[], start: string, end: string): string {
  if (days.length === 0) return "No working days";
  const indices = days.map((d) => DAYS.indexOf(d)).sort((a, b) => a - b);
  const isConsecutive = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);
  const dayStr =
    isConsecutive && days.length > 1
      ? `${DAYS[indices[0]]}–${DAYS[indices[indices.length - 1]]}`
      : days.join(", ");
  return `${toTime12(start)} – ${toTime12(end)} (${dayStr})`;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function WorkSchedulePicker({ value, onChange }: Props) {
  const parsed = parseSchedule(value);
  const [selectedDays, setSelectedDays] = useState<Day[]>(parsed.days);
  const [startTime, setStartTime] = useState(parsed.start);
  const [endTime, setEndTime] = useState(parsed.end);

  function update(days: Day[], start: string, end: string) {
    onChange(generateSchedule(days, start, end));
  }

  function toggleDay(day: Day) {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
    setSelectedDays(next);
    update(next, startTime, endTime);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-1.5 flex-wrap">
        {DAYS.map((day) => {
          const active = selectedDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`h-8 w-10 rounded-lg text-xs font-semibold border transition-colors ${
                active
                  ? "bg-stone-900 border-blue-600 text-white"
                  : "bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={startTime}
          onChange={(e) => {
            setStartTime(e.target.value);
            update(selectedDays, e.target.value, endTime);
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="time"
          value={endTime}
          onChange={(e) => {
            setEndTime(e.target.value);
            update(selectedDays, startTime, e.target.value);
          }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
