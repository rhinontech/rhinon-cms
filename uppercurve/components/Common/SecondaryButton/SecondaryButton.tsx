"use client";

import React from "react";

export interface SecondaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function SecondaryButton({
  children,
  className = "",
  size = "md",
  fullWidth = false,
  type = "button",
  ...restProps
}: SecondaryButtonProps) {
  const sizeClasses = {
    sm: "px-5 py-2.5 text-xs",
    md: "px-7 py-3.5 text-sm",
    lg: "px-9 py-4 text-base sm:text-lg",
  };

  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center font-bold text-gray-900 tracking-tight rounded-full
        bg-gray-200/60 hover:bg-gray-200/90 hover:scale-105 active:scale-95
        transition-all duration-200 cursor-pointer select-none
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `.trim()}
      {...restProps}
    >
      {children}
    </button>
  );
}

export default SecondaryButton;
