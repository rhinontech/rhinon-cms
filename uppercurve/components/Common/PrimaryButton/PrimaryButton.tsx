"use client";

import React from "react";

export interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function PrimaryButton({
  children,
  className = "",
  size = "md",
  fullWidth = false,
  type = "button",
  ...restProps
}: PrimaryButtonProps) {
  const sizeClasses = {
    sm: "px-5 py-2.5 text-xs",
    md: "px-7 py-3.5 text-sm",
    lg: "px-9 py-4 text-base sm:text-lg",
  };

  return (
    <button
      type={type}
      className={`
        relative inline-flex items-center justify-center font-bold text-white tracking-tight rounded-full
        bg-gradient-to-b from-[#2d2d32] via-[#1c1c20] to-[#0f0f12]
        border border-black/40 border-t-white/30
        shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_10px_25px_-5px_rgba(0,0,0,0.5)]
        hover:brightness-115 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_12px_28px_-4px_rgba(0,0,0,0.6)]
        active:scale-[0.97] transition-all duration-200 cursor-pointer select-none
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `.trim()}
      {...restProps}
    >
      {/* Subtle top glossy highlight streak */}
      <span className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none rounded-full" />
      {children}
    </button>
  );
}

export default PrimaryButton;
