"use client";

import { useState } from "react";
import { TbEye, TbEyeOff } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/** Password field with a show/hide toggle. Same props as <Input>, minus `type`. */
export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-10", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {visible ? <TbEyeOff size={18} /> : <TbEye size={18} />}
      </button>
    </div>
  );
}
