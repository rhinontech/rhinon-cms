// Create a new context file (e.g., src/context/SideNavContext.tsx)
"use client";

import { createContext, useContext, useState } from "react";

type SideNavContextType = {
  isExpanded: boolean;
  toggleSideNav: () => void;
};

const SideNavContext = createContext<SideNavContextType | undefined>(undefined);

export function SideNavProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleSideNav = () => setIsExpanded((prev) => !prev);

  return (
    <SideNavContext.Provider value={{ isExpanded, toggleSideNav }}>
      {children}
    </SideNavContext.Provider>
  );
}

export function useSideNav() {
  const context = useContext(SideNavContext);
  if (!context) {
    throw new Error("useSideNav must be used within a SideNavProvider");
  }
  return context;
}