"use client";

import type React from "react";
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DropdownOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  extraInfo?: string;
};

type CustomDropdownProps = {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  label: string;
  className?: string;
};

export default function CustomDropdown({
    options,
    selectedValue,
    onSelect,
    label,
    className,
  }: CustomDropdownProps) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-1 hover:bg-gray-200 text-gray-900 font-medium rounded-full px-3 py-1 text-sm truncate max-w-[150px]",
            className
          )}
        >
          <span className="truncate">{label}</span> <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto min-w-[200px] p-0 rounded-xl shadow-lg">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              className={cn(
                "flex items-center gap-3 py-3 px-4 cursor-pointer",
                selectedValue === option.value && "bg-gray-100"
              )}
              onClick={() => onSelect(option.value)}
            >
              {option.icon && (
                <span className="flex-shrink-0">{option.icon}</span>
              )}
              <span className="flex-grow font-medium truncate max-w-[120px]">
                {option.label}
              </span>
              {selectedValue === option.value && (
                <Check className="h-5 w-5 text-orange-500" />
              )}
              {option.extraInfo && (
                <span className="text-gray-500 text-sm truncate max-w-[60px]">
                  {option.extraInfo}
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }