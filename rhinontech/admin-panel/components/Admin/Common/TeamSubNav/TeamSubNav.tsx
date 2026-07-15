"use client";

import { usePathname } from "next/navigation";
import {
  TbUserCircle,
  TbCalendarTime, TbCalendarStats, TbUsers, TbTarget,
  TbCalendarOff, TbCalendarEvent, TbCheck,
  TbChartBar, TbStar, TbRefresh,
  TbFiles, TbFolders, TbFileAlert,
} from "react-icons/tb";
import { CollapsibleSubNav, type SubNavItem } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { usePermissions } from "@/context/PermissionsContext";

/**
 * Shared sub-nav for the Team main item, which absorbs Attendance, Leave,
 * Performance and Documents as collapsible groups. Rendered by each of those
 * modules' layout.tsx so URLs stay unchanged while the module context reads "Team".
 */
export function TeamSubNav() {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const { has } = usePermissions();

  const attendanceBase = `/${roleSlug}/attendance`;
  const leaveBase = `/${roleSlug}/leave`;
  const performanceBase = `/${roleSlug}/performance`;
  const documentsBase = `/${roleSlug}/documents`;

  const isLeaveAdmin = has("leave:write");
  const isPerformanceAdmin = has("performance:write");
  const isDocumentsAdmin = has("documents:write");

  const items: SubNavItem[] = [
    { label: "Directory", href: `/${roleSlug}/employees`, icon: <TbUserCircle size={18} />, exact: true },
    ...(has("attendance:read")
      ? [
          {
            label: "Attendance",
            href: attendanceBase,
            icon: <TbCalendarTime size={18} />,
            isCollapsible: true,
            isExpanded: pathname.startsWith(attendanceBase),
            children: [
              { label: "Overview", href: attendanceBase, icon: <TbCalendarTime size={16} /> },
              ...(has("attendance:write", "employees:read")
                ? [
                    { label: "Logs", href: `${attendanceBase}/logs`, icon: <TbCalendarStats size={16} /> },
                    { label: "Approvals", href: `${attendanceBase}/approvals`, icon: <TbUsers size={16} /> },
                  ]
                : []),
              { label: "Attendance Rules", href: `${attendanceBase}/governance`, icon: <TbTarget size={16} /> },
            ],
          } satisfies SubNavItem,
        ]
      : []),
    ...(has("leave:read")
      ? [
          {
            label: "Leave",
            href: leaveBase,
            icon: <TbCalendarOff size={18} />,
            isCollapsible: true,
            isExpanded: pathname.startsWith(leaveBase),
            children: isLeaveAdmin
              ? [
                  { label: "Overview", href: leaveBase, icon: <TbCalendarOff size={16} /> },
                  { label: "All Requests", href: `${leaveBase}/requests`, icon: <TbCalendarEvent size={16} /> },
                  { label: "Team Calendar", href: `${leaveBase}/calendar`, icon: <TbCalendarStats size={16} /> },
                  { label: "Approvals", href: `${leaveBase}/approvals`, icon: <TbCheck size={16} /> },
                  { label: "Policies", href: `${leaveBase}/policies`, icon: <TbTarget size={16} /> },
                ]
              : [
                  { label: "Overview", href: leaveBase, icon: <TbCalendarOff size={16} /> },
                  { label: "My Leaves", href: `${leaveBase}/requests`, icon: <TbCalendarEvent size={16} /> },
                ],
          } satisfies SubNavItem,
        ]
      : []),
    ...(has("performance:read")
      ? [
          {
            label: "Performance",
            href: performanceBase,
            icon: <TbChartBar size={18} />,
            isCollapsible: true,
            isExpanded: pathname.startsWith(performanceBase),
            children: [
              { label: "Overview", href: performanceBase, icon: <TbChartBar size={16} /> },
              { label: "My Goals", href: `${performanceBase}/goals`, icon: <TbTarget size={16} /> },
              { label: "My Reviews", href: `${performanceBase}/reviews`, icon: <TbStar size={16} /> },
              ...(isPerformanceAdmin
                ? [
                    { label: "Team", href: `${performanceBase}/team`, icon: <TbUsers size={16} /> },
                    { label: "Cycles", href: `${performanceBase}/cycles`, icon: <TbRefresh size={16} /> },
                  ]
                : []),
            ],
          } satisfies SubNavItem,
        ]
      : []),
    ...(has("documents:read")
      ? [
          {
            label: "Documents",
            href: documentsBase,
            icon: <TbFiles size={18} />,
            isCollapsible: true,
            isExpanded: pathname.startsWith(documentsBase),
            children: [
              { label: "Mine", href: documentsBase, icon: <TbFiles size={16} /> },
              ...(isDocumentsAdmin
                ? [
                    { label: "All", href: `${documentsBase}/all`, icon: <TbFolders size={16} /> },
                    { label: "Requests", href: `${documentsBase}/requests`, icon: <TbFileAlert size={16} /> },
                  ]
                : []),
            ],
          } satisfies SubNavItem,
        ]
      : []),
  ];

  return <CollapsibleSubNav title="Team" items={items} />;
}
