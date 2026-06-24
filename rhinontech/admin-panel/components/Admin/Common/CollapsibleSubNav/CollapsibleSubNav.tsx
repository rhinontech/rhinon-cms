"use client";

import { usePathname } from "next/navigation";
import { useSideNav } from "@/context/SideNavContext";
import { SidebarItem } from "@/components/Admin/Common/SidebarItem/SidebarItem";
import { TbLayoutSidebarFilled, TbLayoutSidebarRightFilled } from "react-icons/tb";

export interface SubNavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  exact?: boolean;
  isCollapsible?: boolean;
  children?: SubNavItem[];
}

interface CollapsibleSubNavProps {
  title: string;
  items: SubNavItem[];
}

export function CollapsibleSubNav({ title, items }: CollapsibleSubNavProps) {
  const { isExpanded } = useSideNav();
  const pathname = usePathname();
  const isCampaignDetailPage = pathname.includes("/outreach/campaigns/") && pathname.split("/").pop() !== "campaigns";
  const showNav = isExpanded && !isCampaignDetailPage;

  return (
    <aside
      className={`flex h-full flex-col bg-stone-100 rounded-l-xl transition-all duration-200 ease-in-out overflow-hidden ${showNav ? "w-[15%] min-w-[180px] border-r" : "w-0"
        }`}
    >
      {showNav && (
        <div className="flex flex-col w-full flex-1">
          <div className="flex items-center w-full h-16 px-5 py-4 text-xl font-semibold tracking-tight border-b">
            {title}
          </div>
          <div className="flex flex-col px-3 py-3 space-y-0.5">
            {items.map((item, index) => (
              <SidebarItem
                key={index}
                icon={item.icon}
                label={item.label}
                isCollapsible={item.isCollapsible}
                isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
                href={item.href}
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
