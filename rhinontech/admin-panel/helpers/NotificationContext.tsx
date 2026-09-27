"use client";

import React, { createContext, useContext } from "react";
import { toast } from "sonner";

export interface NotificationContextType {
  showNotification: (
    type: "success" | "error" | "info" | "warning",
    title: string,
    message?: string
  ) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: (type, title, message) => {
    const text = message ? `${title}: ${message}` : title;
    if (type === "success") toast.success(text);
    else if (type === "error") toast.error(text);
    else if (type === "warning") toast.warning(text);
    else toast.info(text);
  },
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const showNotification = (
    type: "success" | "error" | "info" | "warning",
    title: string,
    message?: string
  ) => {
    const text = message ? `${title}: ${message}` : title;
    if (type === "success") toast.success(text);
    else if (type === "error") toast.error(text);
    else if (type === "warning") toast.warning(text);
    else toast.info(text);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
