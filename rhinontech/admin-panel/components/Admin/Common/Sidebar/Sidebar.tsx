"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { MdDashboard, MdOutlineCloud } from "react-icons/md";
import { FaUserGroup } from "react-icons/fa6";
import { RiSettings3Fill } from "react-icons/ri";
import { HiInbox } from "react-icons/hi2";
import { TbBriefcase, TbCalendarTime, TbCash, TbSpeakerphone, TbCalendarOff, TbChartBar, TbFiles, TbNews, TbChartArcs, TbBook } from "react-icons/tb";
import { BsPinAngleFill, BsPinAngle } from "react-icons/bs";
import { cn } from "@/lib/utils";
import { useDashboard } from "../../../Common/DashboardProvider/DashboardProvider";
import adminImages from "@/constants/admin/images";
import { usePermissions } from "@/context/PermissionsContext";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarExpanded, setSidebarExpanded, isHovering, setIsHovering } = useDashboard();
  const { has, effectiveRoleSlug } = usePermissions();
  const roleSlug = effectiveRoleSlug;

  const expanded = sidebarExpanded || isHovering;

  const navItems = [
    { title: "Dashboard",   icon: <MdDashboard size={20} className="h-5 w-5 flex-shrink-0" />,   href: `/${roleSlug}/dashboard`,    permission: "dashboard:read" },
    { title: "Inbox",       icon: <HiInbox size={20} className="h-5 w-5 flex-shrink-0" />,        href: `/${roleSlug}/inbox`,        permission: "inbox:read" },
    { title: "Team",        icon: <FaUserGroup size={20} className="h-5 w-5 flex-shrink-0" />,    href: `/${roleSlug}/employees`,    permission: "people:read" },
    { title: "Payroll",     icon: <TbCash size={20} className="h-5 w-5 flex-shrink-0" />,         href: `/${roleSlug}/payroll`,      permission: "payslips:read" },
    { title: "Work",        icon: <TbBriefcase size={20} className="h-5 w-5 flex-shrink-0" />,    href: `/${roleSlug}/work`,         permission: "work:read" },
    { title: "Attendance",   icon: <TbCalendarTime size={20} className="h-5 w-5 flex-shrink-0" />, href: `/${roleSlug}/attendance`,   permission: "attendance:read" },
    { title: "Leave",        icon: <TbCalendarOff  size={20} className="h-5 w-5 flex-shrink-0" />, href: `/${roleSlug}/leave`,        permission: "leave:read" },
    { title: "Performance",  icon: <TbChartBar     size={20} className="h-5 w-5 flex-shrink-0" />, href: `/${roleSlug}/performance`,  permission: "performance:read" },
    { title: "Documents",    icon: <TbFiles        size={20} className="h-5 w-5 flex-shrink-0" />, href: `/${roleSlug}/documents`,    permission: "documents:read" },
    { title: "Outreach",     icon: <TbSpeakerphone size={20} className="h-5 w-5 flex-shrink-0" />, href: `/${roleSlug}/outreach`,     permission: "outreach:read" },
    { title: "Content",      icon: <TbNews size={20} className="h-5 w-5 flex-shrink-0" />,         href: `/${roleSlug}/content`,      permission: "content:read" },
    { title: "Analytics",    icon: <TbChartArcs size={20} className="h-5 w-5 flex-shrink-0" />,    href: `/${roleSlug}/analytics`,    permission: "analytics:read" },
    { title: "Docs Access",  icon: <TbBook size={20} className="h-5 w-5 flex-shrink-0" />,         href: `/${roleSlug}/docs-access`,  permission: "docsAccess:read" },
    { title: "Provisioning", icon: <MdOutlineCloud size={20} className="h-5 w-5 flex-shrink-0" />, href: `/${roleSlug}/provisioning`, permission: "provisioning:read" },
    { title: "Settings",     icon: <RiSettings3Fill size={20} className="h-5 w-5 flex-shrink-0" />,href: `/${roleSlug}/settings`,     permission: "settings:read" },
  ].filter((item) => has(item.permission));

  return (
    <aside
      className={cn(
        "flex h-full flex-col glass-sidenav transition-all duration-300 ease-in-out",
        expanded ? "w-56" : "w-14"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-center border-b border-black/5 w-full">
        {expanded ? (
          <div className="flex items-center justify-between w-full px-3">
            <Link href="/">
              <Image src={adminImages.Logo_Rhinon_Tech_Dark} alt="Rhinon Tech" priority className="h-10 w-full object-cover" />
            </Link>
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-1 rounded bg-white/50 hover:bg-white/70 transition-all shrink-0"
            >
              {sidebarExpanded ? <BsPinAngleFill size={14} /> : <BsPinAngle size={14} />}
            </button>
          </div>
        ) : (
          <Link href="/">
            <Image src={adminImages.blueLogo} alt="Rhinon Tech" priority className="h-8 w-8 object-cover" />
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col py-4">
        <div className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-white/70 text-gray-900"
                  : "text-gray-700 hover:bg-white/40 hover:text-gray-900"
              )}
            >
              {item.icon}
              {expanded && <span className="flex-1 truncate">{item.title}</span>}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
