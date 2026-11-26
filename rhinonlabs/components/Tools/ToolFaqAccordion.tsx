"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

export interface FAQItem {
  q: string;
  a: string;
}

export function ToolFaqAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-4">
      {items.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="border relative overflow-hidden border-border/7 bg-color-card shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-4 sm:p-5 rounded-[12px] transition-colors"
          >
            {/* Background Glow matching site theme */}
            <div
              className="absolute top-0 -left-100 pointer-events-none z-1"
              style={{
                width: "437px",
                height: "306px",
                background: "radial-gradient(circle, rgba(184, 199, 217, 0.5) 0%, rgba(184, 199, 217, 0) 100%)",
                opacity: 0.08,
                transform: "translate(50%, -50%)",
              }}
            />

            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full flex items-center justify-between text-left group cursor-pointer"
              aria-expanded={isOpen}
            >
              <span className="text-base sm:text-lg font-[450] tracking-tight transition-colors pr-6 text-gray-200 group-hover:text-white">
                {faq.q}
              </span>
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-colors ${
                  isOpen
                    ? "border-[#1c2bff]/40 bg-[#1c2bff]/20 text-white"
                    : "border-white/10 text-white/50 group-hover:bg-white/5 group-hover:text-white/80"
                }`}
              >
                {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
            </button>

            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="opacity-70 text-sm sm:text-[15px] leading-relaxed pr-6 border-t border-white/[0.06] pt-3 text-white/70">
                  {faq.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
