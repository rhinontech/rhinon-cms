"use client";

import {
  AudioWaveform,
  CircleDollarSign,
  Command,
  GalleryVerticalEnd,
} from "lucide-react";
import { UserNav } from "./UserNav";
import { TeamSwitcher } from "./TeamSwitcher";
import { useUserStore } from "@/utils/store";
// import { NotificationBell } from "./NotificationBell";

import { useBannerStore } from "@/store/useBannerStore";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThemeCustomizer } from "../../providers/ThemeCustomizer";

export function SiteHeader() {
  const roles = useUserStore((state) => state.userData.assignedRoles);
  const { orgName } = useUserStore((state) => state.userData);

  const { isVisible, content, type, hideBanner } = useBannerStore();

  const dynamicTeams = roles.map((role: string) => {
    return {
      name: "RhinonTech",
      logo: GalleryVerticalEnd,
      role: role,
    };
  });

  return (
    <header className="bg-sidebar sticky top-0 z-50 flex flex-col w-full">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "3rem", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn(
              " flex items-center justify-between px-4 text-sm font-medium m-1 rounded-md shadow-sm",
              type === "info" && "bg-primary text-primary-foreground",
              type === "warning" && "bg-yellow-500 text-black",
              type === "error" && "bg-red-600 text-white",
              type === "success" && "bg-green-600 text-white"
            )}>
            <div className="flex-1 text-center">{content}</div>
            <button
              onClick={hideBanner}
              className="p-1 hover:bg-black/10 rounded-full">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-[3.5rem] w-full justify-between items-center gap-2 px-2">
        <TeamSwitcher teams={dynamicTeams} orgName={orgName} />
        {/* <SearchForm className="w-full md:w-[300px]" /> */}
        <div className="flex items-center gap-2">
          <ThemeCustomizer />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
