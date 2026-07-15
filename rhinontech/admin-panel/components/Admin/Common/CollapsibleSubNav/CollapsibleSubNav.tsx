"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSideNav } from "@/context/SideNavContext";
import { TbX } from "react-icons/tb";
import { SidebarItem } from "@/components/Admin/Common/SidebarItem/SidebarItem";
import { TbLayoutSidebarFilled, TbLayoutSidebarRightFilled } from "react-icons/tb";

export interface SubNavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  exact?: boolean;
  isCollapsible?: boolean;
  /** Only meaningful when isCollapsible — forces the group open (e.g. when a child route is active). */
  isExpanded?: boolean;
  children?: SubNavItem[];
}

interface CollapsibleSubNavProps {
  title: string;
  items: SubNavItem[];
}

export function CollapsibleSubNav({ title, items }: CollapsibleSubNavProps) {
  const { isExpanded, toggleSideNav } = useSideNav();
  const pathname = usePathname();
  // Full-screen detail pages take over the whole module area — the sub-nav hides itself there.
  const lastSegment = pathname.split("/").pop();
  const isFullScreenDetail =
    (pathname.includes("/outreach/campaigns/") && lastSegment !== "campaigns") ||
    (pathname.includes("/content/blogs/") && lastSegment !== "blogs");
  const showNav = isExpanded && !isFullScreenDetail;

  // Phone: picking a sub-nav item closes the overlay (desktop keeps it pinned).
  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      if (isExpanded && window.matchMedia("(max-width: 1023px)").matches) toggleSideNav();
    }
  }, [pathname, isExpanded, toggleSideNav]);

  return (
    <>
      {/* Phone backdrop */}
      {showNav && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={toggleSideNav} />
      )}
    <aside
      className={`flex-col glass-sidenav transition-all duration-200 ease-in-out overflow-hidden
        ${showNav
          ? "fixed inset-y-0 left-0 z-50 flex w-64 max-lg:bg-white! shadow-xl lg:static lg:z-auto lg:h-full lg:w-[15%] lg:min-w-[180px] lg:rounded-l-xl lg:bg-transparent lg:shadow-none lg:border-r lg:border-black/5"
          : "hidden lg:flex lg:h-full lg:w-0"}`}
    >
      {showNav && (
        <div className="flex flex-col w-full flex-1">
          <div className="flex items-center justify-between w-full h-16 px-5 py-4 text-xl font-semibold tracking-tight border-b border-black/5">
            {title}
            <button onClick={toggleSideNav} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 lg:hidden" aria-label="Close menu">
              <TbX size={18} />
            </button>
          </div>
          <div className="flex flex-col px-3 py-3 space-y-0.5">
            {items.map((item, index) => (
              <SidebarItem
                key={index}
                icon={item.icon}
                label={item.label}
                isCollapsible={item.isCollapsible}
                isExpanded={item.isExpanded}
                isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
                href={item.isCollapsible ? undefined : item.href}
              >
                {item.children?.map((child, childIndex) => (
                  <SidebarItem
                    key={childIndex}
                    icon={child.icon}
                    label={child.label}
                    href={child.href}
                    isActive={pathname === child.href}
                  />
                ))}
              </SidebarItem>
            ))}
          </div>
        </div>
      )}
    </aside>
    </>
  );
}

// Drop this button into any page header to toggle the aside
export function SubNavToggle() {
  const { isExpanded, toggleSideNav } = useSideNav();
  return (
    <button
      onClick={toggleSideNav}
      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
    >
      {isExpanded ? (
        <TbLayoutSidebarFilled size={20} />
      ) : (
        <TbLayoutSidebarRightFilled size={20} />
      )}
    </button>
  );
}
