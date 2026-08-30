"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SubNavToggle } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { TbCalendarOff, TbClockHour4, TbBook, TbChevronRight } from "react-icons/tb";

export function SettingsGovernance() {
  const roleSlug = usePathname().split("/")[1];

  const links = [
    {
      title: "Leave Policies",
      description: "Manage leave types, paid/unpaid status, and yearly allowances.",
      href: `/${roleSlug}/leave/policies`,
      icon: <TbCalendarOff size={20} />,
    },
    {
      title: "Attendance Governance",
      description: "Attendance, conduct, and welfare policies for the whole team.",
      href: `/${roleSlug}/attendance/governance`,
      icon: <TbClockHour4 size={20} />,
    },
    {
      title: "Docs Access",
      description: "Manage who can view the internal developer docs site.",
      href: `/${roleSlug}/docs-access`,
      icon: <TbBook size={20} />,
    },
  ];

  return (
    <div className="flex flex-col h-full glass-panel rounded-r-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center gap-4 h-16 px-5 border-b border-border glass-header">
        <SubNavToggle />
        <div>
          <h1 className="text-base font-semibold tracking-tight">Governance</h1>
          <p className="text-xs text-muted-foreground">Policies managed in their own modules</p>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 rounded-xl glass-card p-5 hover:border-border hover:bg-muted/40 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{link.title}</p>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </div>
              <TbChevronRight size={18} className="shrink-0 text-muted-foreground/70" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
