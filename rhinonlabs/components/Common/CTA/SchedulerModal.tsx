"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
      {/* Backdrop click to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative w-full max-w-6xl my-auto">
        {/* Floating Close Button - Always visible regardless of inner card scroll/height */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close scheduler"
          className="absolute -top-3 -right-2 sm:-top-4 sm:-right-4 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1A2234] hover:bg-[#242F48] border border-white/20 flex items-center justify-center transition-all text-white shadow-2xl active:scale-95 cursor-pointer"
        >
          <X size={18} />
        </button>

        <SchedulerCore onClose={onClose} />
      </div>
    </div>
  );
}
