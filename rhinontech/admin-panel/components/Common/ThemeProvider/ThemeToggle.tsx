"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { TbSun, TbMoon, TbDeviceLaptop } from "react-icons/tb";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

const OPTIONS = [
  { value: "light", label: "Light", icon: TbSun },
  { value: "dark", label: "Dark", icon: TbMoon },
  { value: "system", label: "System", icon: TbDeviceLaptop },
] as const;

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // next-themes only knows the real theme after mount, so render the neutral
  // icon on the server/first paint to keep hydration from mismatching.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const Icon = !mounted
    ? TbSun
    : resolvedTheme === "dark"
      ? TbMoon
      : TbSun;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground/85 transition-colors"
          aria-label="Change theme"
        >
          <Icon size={18} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1.5">
        {OPTIONS.map(({ value, label, icon: OptionIcon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${
              mounted && theme === value
                ? "font-semibold text-foreground"
                : "text-foreground/85"
            }`}
          >
            <OptionIcon size={15} className="text-muted-foreground" />
            {label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
