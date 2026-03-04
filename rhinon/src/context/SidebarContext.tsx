"use client";
import React, { createContext, useContext, useState } from "react";

type SidebarContextType = {
  isAutomateOpen: boolean;
  toggleAutomateSidebar: () => void;
  isChatsOpen: boolean;
  toggleChatsSidebar: () => void;
  isSupportOpen: boolean;
  toggleSupportSidebar: () => void;
  setIsSupportOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBillingOpen: boolean;
  toggleBillingSidebar: () => void;
  isSettingOpen: boolean;
  toggleSettingSidebar: () => void;
  isKnowledgeBaseOpen: boolean;
  toggleKnowledgeBaseSidebar: () => void;
  isSpaceOpen: boolean;
  toggleSpaceSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isAutomateOpen, setIsAutomateOpen] = useState(true);
  const [isSupportOpen, setIsSupportOpen] = useState(true);
  const [isBillingOpen, setIsBillingOpen] = useState(true);
  const [isSettingOpen, setIsSettingOpen] = useState(true);
  const [isKnowledgeBaseOpen, setIsKnowledgeBaseOpen] = useState(true);
  const [isSpaceOpen, setIsSpaceOpen] = useState(true);
  const [isChatsOpen, setIsChatsOpen] = useState(true);

  const toggleAutomateSidebar = () => setIsAutomateOpen((prev) => !prev);
  const toggleSupportSidebar = () => setIsSupportOpen((prev) => !prev);
  const toggleBillingSidebar = () => setIsBillingOpen((prev) => !prev);
  const toggleSettingSidebar = () => setIsSettingOpen((prev) => !prev);
  const toggleKnowledgeBaseSidebar = () =>
    setIsKnowledgeBaseOpen((prev) => !prev);
  const toggleSpaceSidebar = () => setIsSpaceOpen((prev) => !prev);
  const toggleChatsSidebar = () => setIsChatsOpen((prev) => !prev);

  return (
    <SidebarContext.Provider
      value={{
        isAutomateOpen,
        toggleAutomateSidebar,
        isChatsOpen,
        toggleChatsSidebar,
        isSupportOpen,
        toggleSupportSidebar,
        setIsSupportOpen,
        isBillingOpen,
        toggleBillingSidebar,
        isSettingOpen,
        toggleSettingSidebar,
        isKnowledgeBaseOpen,
        toggleKnowledgeBaseSidebar,
        isSpaceOpen,
        toggleSpaceSidebar,
      }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};
