"use client";

import { useState } from "react";
import { PhoneCall } from "lucide-react";
import SchedulerModal from "./SchedulerModal";

export default function StickyCallButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-[#1c2bff] hover:bg-[#131ecc] text-white font-bold tracking-wider text-[10px] sm:text-[11px] uppercase px-2 py-5 rounded-l-xl shadow-[0_10px_30px_rgba(28,43,255,0.3)] transition-all duration-300 hover:-translate-x-1 group flex justify-center items-center gap-1.5 border-l border-y border-white/20 select-none cursor-pointer"
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
        }}
      >
        <span className="rotate-90 flex items-center justify-center group-hover:scale-110 transition-transform">
          <PhoneCall size={13} className="text-white" />
        </span>
        <span>Get a Callback</span>
      </button>

      <SchedulerModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
