"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import type { BlogFaq as BlogFaqItem } from "@/lib/api";

export function BlogFaq({ faqs }: { faqs: BlogFaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs.length) return null;

  return (
    <section className="mt-20 scroll-mt-32" id="faq">
      <h2 className="mb-8 text-2xl md:text-3xl font-[600] tracking-tight text-foreground">
        Frequently asked questions
      </h2>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-2xl border transition-colors ${
                isOpen ? "border-white/25 bg-white/[0.05]" : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
              >
                <span className="text-base md:text-lg font-[500] text-foreground">{faq.question}</span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${
                    isOpen ? "border-white/40 bg-white text-slate-950" : "border-white/15 text-muted-foreground"
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
