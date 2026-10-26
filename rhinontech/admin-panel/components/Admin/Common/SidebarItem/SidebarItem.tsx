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

// The same active treatment as the main sidebar: a raised card with the
// icon picked out in the brand colour.
const itemClass = (active: boolean) =>
  cn(
    "flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-[background-color,color,box-shadow] duration-150 [&_svg]:size-[17px] [&_svg]:shrink-0",
    active
      ? "bg-card font-medium text-foreground shadow-xs ring-1 ring-foreground/[0.06] dark:bg-white/[0.08] dark:shadow-none dark:ring-white/[0.06] [&>span>svg]:text-brand"
      : "text-foreground/70 hover:bg-card/60 hover:text-foreground dark:hover:bg-white/[0.05]"
  );

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
          <button type="button" className={cn(itemClass(false), "cursor-pointer justify-between")}>
            <span className="flex min-w-0 items-center gap-2.5">
              {icon}
              <span className="truncate">{label}</span>
            </span>
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-[19px] mt-0.5 space-y-0.5 border-l border-foreground/[0.08] py-0.5 pl-2">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  const content = (
    <>
      <span className="flex shrink-0 items-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </>
  );

  if (!href) {
    return <div className={itemClass(isActive)}>{content}</div>;
  }

  if (externalLink) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={itemClass(isActive)}>
        {content}
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </a>
    );
  }

  return (
    <Link href={href} className={itemClass(isActive)}>
      {content}
    </Link>
  );
};
