"use client";

import { usePathname } from "next/navigation";
import {
  TbUserCircle,
  TbCalendarTime, TbCalendarStats, TbUsers, TbTarget,
  TbCalendarOff, TbCalendarEvent, TbCheck,
  TbChartBar, TbStar, TbRefresh,
  TbFiles, TbFolders, TbFileAlert,
  TbBriefcase, TbMessages,
} from "react-icons/tb";
import { CollapsibleSubNav, type SubNavItem } from "@/components/Admin/Common/CollapsibleSubNav/CollapsibleSubNav";
import { usePermissions } from "@/context/PermissionsContext";

/**
 * The sub-nav for the People section — one component, three menus.
 *
 * These used to be a single "Team" menu of up to 28 items. Each sidebar item
 * now gets only its own pages, and every URL stays where it was:
 * - people:      HR & People — directory, hiring, documents
 * - time:        Attendance & Leave
 * - performance: Performance
 *
 * Shared mailboxes (hello@, support@) moved to Settings → Email addresses.
 */
export function TeamSubNav({ section }: { section: "people" | "time" | "performance" }) {
  const pathname = usePathname();
  const roleSlug = pathname.split("/")[1];
  const { has } = usePermissions();

  const attendanceBase = `/${roleSlug}/attendance`;
  const leaveBase = `/${roleSlug}/leave`;
  const performanceBase = `/${roleSlug}/performance`;
  const documentsBase = `/${roleSlug}/documents`;
  const hiringBase = `/${roleSlug}/employees/hiring`;

  const isLeaveAdmin = has("leave:write");
  const isPerformanceAdmin = has("performance:write");
  const isDocumentsAdmin = has("documents:write");

  if (section === "people") {
    const items: SubNavItem[] = [
      ...(has("people:read") ? [{ label: "Directory", href: `/${roleSlug}/employees`, icon: <TbUserCircle size={18} />, exact: true } satisfies SubNavItem] : []),
      // Everyone sees "My interviews" (they may be an interviewer); openings are admin-only
      {
        label: "Hiring",
        href: has("employees:write") ? hiringBase : `${hiringBase}/interviews`,
        icon: <TbBriefcase size={18} />,
        isCollapsible: true,
        isExpanded: pathname.startsWith(hiringBase),
        children: [
          ...(has("employees:write")
            ? [{ label: "Openings", href: hiringBase, icon: <TbBriefcase size={16} />, exact: true }]
            : []),
          { label: "My interviews", href: `${hiringBase}/interviews`, icon: <TbMessages size={16} /> },
        ],
      } satisfies SubNavItem,
      ...(has("documents:read")
        ? [
            {
              label: "Documents",
              href: documentsBase,
              icon: <TbFiles size={18} />,
              isCollapsible: true,
              isExpanded: pathname.startsWith(documentsBase),
              children: [
                { label: "My documents", href: documentsBase, icon: <TbFiles size={16} /> },
                ...(isDocumentsAdmin
                  ? [
                      { label: "All documents", href: `${documentsBase}/all`, icon: <TbFolders size={16} /> },
                      { label: "Document requests", href: `${documentsBase}/requests`, icon: <TbFileAlert size={16} /> },
                    ]
                  : []),
              ],
            } satisfies SubNavItem,
          ]
        : []),
    ];
    return <CollapsibleSubNav title="HR & People" items={items} />;
  }

  if (section === "time") {
    const items: SubNavItem[] = [
      ...(has("attendance:read")
        ? [
            {
              label: "Attendance",
              href: attendanceBase,
              icon: <TbCalendarTime size={18} />,
              isCollapsible: true,
              // A small menu: both groups start open, so every page is one click away.
              isExpanded: true,
              children: [
                { label: "Overview", href: attendanceBase, icon: <TbCalendarTime size={16} /> },
                ...(has("attendance:write", "employees:read")
                  ? [
                      { label: "Logs", href: `${attendanceBase}/logs`, icon: <TbCalendarStats size={16} /> },
                      { label: "Approvals", href: `${attendanceBase}/approvals`, icon: <TbUsers size={16} /> },
                    ]
                  : []),
                { label: "Attendance rules", href: `${attendanceBase}/governance`, icon: <TbTarget size={16} /> },
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
              isExpanded: true,
              children: isLeaveAdmin
                ? [
                    { label: "Overview", href: leaveBase, icon: <TbCalendarOff size={16} /> },
                    { label: "All requests", href: `${leaveBase}/requests`, icon: <TbCalendarEvent size={16} /> },
                    { label: "Team calendar", href: `${leaveBase}/calendar`, icon: <TbCalendarStats size={16} /> },
                    { label: "Approvals", href: `${leaveBase}/approvals`, icon: <TbCheck size={16} /> },
                    { label: "Policies", href: `${leaveBase}/policies`, icon: <TbTarget size={16} /> },
                  ]
                : [
                    { label: "Overview", href: leaveBase, icon: <TbCalendarOff size={16} /> },
                    { label: "My leave", href: `${leaveBase}/requests`, icon: <TbCalendarEvent size={16} /> },
                  ],
            } satisfies SubNavItem,
          ]
        : []),
    ];
    return <CollapsibleSubNav title="Attendance & Leave" items={items} />;
  }

  const items: SubNavItem[] = [
    { label: "Overview", href: performanceBase, icon: <TbChartBar size={18} />, exact: true },
    { label: "My goals", href: `${performanceBase}/goals`, icon: <TbTarget size={18} /> },
    { label: "My reviews", href: `${performanceBase}/reviews`, icon: <TbStar size={18} /> },
    ...(isPerformanceAdmin
      ? [
          { label: "Team", href: `${performanceBase}/team`, icon: <TbUsers size={18} /> },
          { label: "Cycles", href: `${performanceBase}/cycles`, icon: <TbRefresh size={18} /> },
        ]
      : []),
  ];
  return <CollapsibleSubNav title="Performance" items={items} />;
}
