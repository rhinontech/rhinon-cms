"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/Constants/SvgIcons";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { NavMain } from "./NavMain";
import { useUserStore } from "@/utils/store";
import { cn } from "@/lib/utils";

type NavItem = {
  id: string;
  title: string;
  path: string;
  icon: ({ isActive, ...props }: any) => React.ReactElement;
  isExternal?: boolean;
};
const allNavItems = {
  navMain: [
    {
      id: "access_dashboard",
      title: "Dashboard",
      path: "dashboard",
      icon: LayoutDashboardIcon,
      isExternal: false,
    },
    {
      id: "manage_users",
      title: "Users",
      path: "users",
      icon: UsersIcon,
      isExternal: false,
    },
  ],
  navFooter: [
    {
      id: "manage_settings",
      title: "Settings",
      path: "settings",
      icon: SettingsIcon,
      isExternal: false,
    },
  ],
};

export function RootSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const role = Cookies.get("currentRole") || "";
  const {
    isPlanValid,
    orgRolesAccess,
  } = useUserStore((state) => state.userData);

  const permissions =
    role === "superadmin" ? "ALL" : orgRolesAccess?.[role] ?? [];

  // If plan expired → restrict to only Dashboard, Billing, Settings
  const allowedWhenExpired = [
    "access_dashboard",
    "billing_access",
    // "manage_settings",
  ];

  const filterNavItems = (
    items: typeof allNavItems.navMain | typeof allNavItems.navFooter
  ) => {
    const filtered =
      permissions === "ALL"
        ? items
        : items.filter((item) => permissions.includes(item.id));

    // if plan expired, limit to allowed items
    const visibleItems =
      isPlanValid === false
        ? filtered.filter((item) => allowedWhenExpired.includes(item.id))
        : filtered;

    return visibleItems.map((item) => ({
      title: item.title,
      url: item.isExternal ? item.path : `/${role}/${item.path}`,
      icon: (
        <div className="relative flex items-center justify-center w-5 h-5">
          <item.icon
            isActive={
              !item.isExternal && pathname.includes(`/${role}/${item.path}`)
            }
          />
        </div>
      ),

      isActive: !item.isExternal && pathname.includes(`/${role}/${item.path}`),
      isExternal: item.isExternal,
    }));
  };

  const data = {
    navMain: filterNavItems(allNavItems.navMain),
    navFooter: filterNavItems(allNavItems.navFooter),
  };

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
      collapsible="icon"
      variant="inset">
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavMain items={data.navFooter} />
      </SidebarFooter>
    </Sidebar>
  );
}
