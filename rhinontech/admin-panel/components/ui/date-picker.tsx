"use client";

import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { TbCalendar, TbX } from "react-icons/tb";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

/**
 * Date field built on shadcn's Popover + Calendar.
 *
 * Values stay as plain `yyyy-MM-dd` strings, the same shape the API already
 * exchanges — no Date objects cross this boundary, so nothing can drift a day
 * through a timezone conversion on the way in or out.
 */
export function DatePicker({
  value, onChange, placeholder = "—", variant = "field", className, disabled, ariaLabel,
}: {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** "cell" is the borderless table variant; "field" is the bordered form one. */
  variant?: "cell" | "field";
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const iso = value ? String(value).slice(0, 10) : "";
  const parsed = iso ? parseISO(iso) : null;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel ?? "Choose a date"}
          className={cn(
            "group flex w-full min-w-0 items-center gap-1.5 text-left text-sm outline-none transition disabled:opacity-50",
            variant === "cell"
              ? "rounded border border-transparent px-1.5 py-1 hover:border-stone-200 focus:border-blue-500 focus:bg-white"
              : "rounded-lg border border-stone-200 bg-white/80 px-2 py-1.5 focus:ring-2 focus:ring-blue-500",
            className
          )}
        >
          <TbCalendar size={13} className="shrink-0 text-stone-400" />
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-stone-400")}>
            {selected ? format(selected, "dd/MM/yyyy") : placeholder}
          </span>
          {selected && !disabled && (
            // A native date input can be emptied; keep that possible here.
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear date"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(null); }}
              className="shrink-0 rounded p-0.5 text-stone-300 opacity-0 hover:bg-stone-200 hover:text-stone-600 group-hover:opacity-100"
            >
              <TbX size={11} />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          autoFocus
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            // format() on the local Date keeps the day the user clicked;
            // toISOString() would shift it west of UTC.
            onChange(d ? format(d, "yyyy-MM-dd") : null);
            setOpen(false);
          }}
        />
        <div className="flex items-center justify-between border-t px-2 py-1.5">
          <button
            type="button"
            onClick={() => { onChange(format(new Date(), "yyyy-MM-dd")); setOpen(false); }}
            className="rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className="rounded px-2 py-1 text-xs text-stone-500 hover:bg-stone-100"
          >
            Clear
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
