"use client";

import { Collapsible } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: React.JSX.Element;
    isActive?: boolean;
    isExternal?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                {item.isExternal ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.icon}
                  </a>
                ) : (
                  <Link href={item.url}>{item.icon}</Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
