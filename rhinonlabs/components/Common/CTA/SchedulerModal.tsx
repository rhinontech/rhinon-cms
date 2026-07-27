"use client";

import { useEffect } from "react";
import SchedulerCore from "./SchedulerCore";

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SchedulerModal({ isOpen, onClose }: SchedulerModalProps) {
  // Lock body scroll behind the modal while it's open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <SchedulerCore onClose={onClose} />
    </div>
  );
}
