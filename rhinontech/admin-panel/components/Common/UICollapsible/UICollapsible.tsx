"use client";

import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Custom animation styles
const animationStyles = {
  enter: "transition-all duration-300 ease-out",
  enterFrom: "opacity-0 scale-95",
  enterTo: "opacity-100 scale-100",
  leave: "transition-all duration-300 ease-in",
  leaveFrom: "opacity-100 scale-100",
  leaveTo: "opacity-0 scale-95",
};

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export function UICollapsible({
  title,
  children,
  defaultOpen = false,
  className,
  triggerClassName,
  contentClassName,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(`w-full rounded-lg border overflow-hidden hover:shadow ${isOpen && "shadow"}`, className)}
    >
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between px-4 py-5 font-medium transition-all",
          triggerClassName
        )}
      >
        <span>{title}</span>
        <span className="transition-transform duration-300">
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          "p-4 transition-all duration-300 ease-in-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
          contentClassName
        )}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
