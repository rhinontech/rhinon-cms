import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isCollapsible?: boolean;
  isActive?: boolean;
  isExpanded?: boolean;
  children?: React.ReactNode;
  href?: string;
  externalLink?: boolean;
}

export const SidebarItem = ({
  icon,
  label,
  isCollapsible = false,
  isActive = false,
  isExpanded = false,
  children,
  href,
  externalLink = false,
}: SidebarItemProps) => {
  const [isOpen, setIsOpen] = useState(isExpanded);

  // Ensure collapsible items stay open if a child is active
  useEffect(() => {
    if (isExpanded) {
      setIsOpen(true);
    }
  }, [isExpanded]);

  if (isCollapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full flex justify-between items-center py-2 h-auto font-normal text-sm cursor-pointer transition-all",
              isOpen ? "" : "hover:bg-gray-50"
            )}
          >
            <div className="flex items-center">
              {icon}
              <span className="ml-2">{label}</span>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pl-5 py-1">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full flex justify-between items-center font-normal text-sm transition-all",
        isActive ? "bg-stone-200" : "hover:bg-stone-200/50"
      )}
      size="sm"
      asChild={!!href}
    >
      {href ? (
        externalLink ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center">
              {icon}
              <span className="ml-2">{label}</span>
            </div>
            <ExternalLink className=" w-4" />
          </a>
        ) : (
          <Link href={href} className="flex w-full items-center justify-between">
            <div className="flex items-center">
              {icon}
              <span className="ml-2">{label}</span>
            </div>
          </Link>
        )
      ) : (
        <div className="flex w-full items-center">
          {icon}
          <span className="ml-2">{label}</span>
        </div>
      )}
    </Button>
  );
};
