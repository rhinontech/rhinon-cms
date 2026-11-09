import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { moduleTone } from "@/components/Admin/Common/navConfig";

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
// icon in the current module's colour (--tone), which every item here picks up.
const itemClass = (active: boolean) =>
  cn(
    "flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-[background-color,color,box-shadow] duration-150 [&_svg]:size-[17px] [&_svg]:shrink-0",
    active
      ? "bg-[color-mix(in_oklab,var(--tone)_12%,var(--card))] font-medium text-foreground shadow-xs ring-1 ring-[color-mix(in_oklab,var(--tone)_28%,transparent)] dark:bg-[color-mix(in_oklab,var(--tone)_16%,transparent)] dark:shadow-none [&_svg]:text-[var(--tone)]"
      : "text-foreground/70 hover:bg-card/60 hover:text-foreground dark:hover:bg-white/[0.05] [&_svg]:text-[color-mix(in_oklab,var(--tone)_85%,var(--foreground))]"
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
  // The module is the segment after the role: /admin/crm/... -> crm.
  const tone = { "--tone": moduleTone(usePathname().split("/")[2] ?? "") } as React.CSSProperties;

  // Ensure collapsible items stay open if a child is active
  useEffect(() => {
    if (isExpanded) {
      setIsOpen(true);
    }
  }, [isExpanded]);

  if (isCollapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full" style={tone}>
        <CollapsibleTrigger asChild>
          <button type="button" className={cn(itemClass(false), "cursor-pointer justify-between")} style={tone}>
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
    return <div className={itemClass(isActive)} style={tone}>{content}</div>;
  }

  if (externalLink) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={itemClass(isActive)} style={tone}>
        {content}
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </a>
    );
  }

  return (
    <Link href={href} className={itemClass(isActive)} style={tone}>
      {content}
    </Link>
  );
};
