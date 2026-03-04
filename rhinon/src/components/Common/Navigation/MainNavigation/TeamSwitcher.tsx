"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import Cookies from "js-cookie";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
// import { changeUserRole } from "@/services/authServices";
import { useEffect, useState } from "react";
import { useUserStore } from "@/utils/store";

interface Team {
  name: string;
  logo: React.ElementType;
  role: string;
}

interface TeamSwitcherProps {
  teams: Team[];
  orgName: string | null;
}

export function TeamSwitcher({ teams, orgName }: TeamSwitcherProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const currentRole = Cookies.get("currentRole");
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);

  //  Hydrate `activeTeam` from cookie on initial mount
  useEffect(() => {
    const savedRole = Cookies.get("currentRole");

    if (savedRole && teams.length > 0) {
      const matchedTeam = teams.find((team) => team.role === savedRole);
      if (matchedTeam) {
        setActiveTeam(matchedTeam);
        return;
      }
    }

    // fallback
    if (teams.length > 0) {
      setActiveTeam(teams[0]);
      // Cookies.set("currentRole", teams[0].href);
    }
  }, [teams]);

  if (!activeTeam) {
    return null;
  }

  const setToken = async (team: Team) => {
    if (Cookies.get("currentRole") === team.role) return;

    try {
      // await changeUserRole(team.role);
      Cookies.set("currentRole", team.role);
      setActiveTeam(team);
      router.push("/");
    } catch (error: any) {
      console.error("Error changing role", error);
    }
  };

  return (
    <SidebarMenu className="w-fit">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground px-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold capitalize">
                  {orgName}
                </span>
                <span className="truncate text-xs">{activeTeam.role}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Roles
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.role}
                onClick={() => setToken(team)}
                className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <team.logo className="size-4 shrink-0" />
                </div>
                {team.role}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => router.push(`/${currentRole}/teams?createrole`)}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add Role</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
