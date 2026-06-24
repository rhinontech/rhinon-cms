"use client";

import type React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type DashboardContextType = {
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  isHovering: boolean;
  setIsHovering: (hovering: boolean) => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);
const SIDEBAR_EXPANDED_STORAGE_KEY = "rhinon_sidebar_expanded";

const isDashboardRoute = (path: string) => /^\/[^/]+\/dashboard$/.test(path);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpandedState] = useState(isDashboardRoute(pathname));
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const savedState = window.localStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY);

    if (savedState !== null) {
      setSidebarExpandedState(savedState === "true");
    }
  }, []);

  const setSidebarExpanded = useCallback((expanded: boolean) => {
    window.localStorage.setItem(SIDEBAR_EXPANDED_STORAGE_KEY, String(expanded));
    setSidebarExpandedState(expanded);
  }, []);

  return (
    <DashboardContext.Provider
      value={{ sidebarExpanded, setSidebarExpanded, isHovering, setIsHovering }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
