"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import type { BlogFaq as BlogFaqItem } from "@/lib/api";

export function BlogFaq({ faqs }: { faqs: BlogFaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs.length) return null;

  return (
    <section className="mt-24">
      <div className="mb-10 space-y-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">FAQ</span>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
          Frequently asked questions
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-2xl border backdrop-blur-md transition-colors ${
                isOpen ? "border-cyan-500/30 bg-secondary/30" : "border-white/5 bg-secondary/20 hover:border-white/10"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
              >
                <span className="text-base md:text-lg font-bold text-foreground">{faq.question}</span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${
                    isOpen
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                      : "border-white/10 text-muted-foreground"
                  }`}
                >
                  {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                </span>
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
