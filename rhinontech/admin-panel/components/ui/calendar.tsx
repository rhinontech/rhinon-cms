"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { TbChevronLeft, TbChevronRight } from "react-icons/tb";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/** shadcn's Calendar, styled to this app's stone/blue palette. */
export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-3",
        month_caption: "flex justify-center pt-1 relative items-center h-8",
        caption_label: "text-sm font-medium text-stone-800",
        nav: "flex items-center gap-1 absolute right-1 top-1 z-10",
        button_previous:
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-40",
        button_next:
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-40",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-stone-400 rounded-md w-8 font-normal text-[0.72rem]",
        week: "flex w-full mt-1",
        day: "h-8 w-8 p-0 text-center text-sm",
        day_button:
          "h-8 w-8 rounded-md font-normal text-stone-700 hover:bg-stone-100 aria-selected:bg-stone-900 aria-selected:text-white",
        selected: "[&>button]:bg-stone-900 [&>button]:text-white [&>button]:hover:bg-stone-800",
        today: "[&>button]:border [&>button]:border-blue-400 [&>button]:text-blue-700 [&>button]:font-semibold",
        outside: "[&>button]:text-stone-300",
        disabled: "[&>button]:text-stone-300 [&>button]:cursor-not-allowed",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...rest }) =>
          orientation === "left"
            ? <TbChevronLeft size={15} {...(rest as any)} />
            : <TbChevronRight size={15} {...(rest as any)} />,
      }}
      {...props}
    />
  );
}
