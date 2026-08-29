"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { SectionHeading, scrollVariant } from "./SectionHeading";

const faqs = [
  {
    question: "I don't have a technical background. Can you still help?",
    answer:
      "Yes. You don't need to know how to code. We help translate your business idea into a technical product plan and development roadmap.",
  },
  {
    question: "I only have an idea. Is that enough?",
    answer:
      "Yes. We can start from the problem, target users and business concept, and help define an MVP from there.",
  },
  {
    question: "Can you build both websites and apps?",
    answer:
      "Yes. Depending on the product, we can build websites, web applications, mobile applications, admin dashboards and backend systems.",
  },
  {
    question: "Can you help me decide what features to build?",
    answer:
      "Yes. MVP definition and technical planning are part of the initial process — before any development starts.",
  },
  {
    question: "Can I add features later?",
    answer:
      "Yes. The product can continue to evolve after the initial MVP, based on what real users actually do with it.",
  },
  {
    question: "How long does it take?",
    answer:
      "It depends on the product scope. After understanding the idea, we provide a project estimate and roadmap so you know the timeline up front.",
  },
  {
    question: "Do I need a technical co-founder?",
    answer:
      "Not necessarily. Rhinon Labs can act as your technology execution partner while you focus on the business side.",
  },
  {
    question: "What will it cost?",
    answer:
      "Pricing depends on what you decide to build. We scope the MVP first, then share a clear estimate — and you can build it in stages rather than all at once.",
  },
];

export function BuildFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faqs" className="py-24 relative overflow-hidden">
      <div className="max-w-[900px] mx-auto px-6 relative z-10">
        <SectionHeading
          badgeClass="border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
          badge="FAQ"
          title="Questions First-Time"
          accent="Founders Ask"
        />

        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={faq.question}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={scrollVariant}
                className={`rounded-[16px] border overflow-hidden transition-colors ${
                  isOpen
                    ? "border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.07] to-transparent"
                    : "border-white/8 bg-[#0d1119]/60"
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-6 px-6 py-5 text-left"
                >
                  <span className="text-base font-medium text-white/90">{faq.question}</span>
                  <span
                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isOpen ? "bg-cyan-500/15 ring-1 ring-cyan-400/30" : "bg-white/[0.04] ring-1 ring-white/10"
                    }`}
                  >
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-cyan-300" />
                    ) : (
                      <Plus className="w-4 h-4 text-white/60" />
                    )}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-sm opacity-60 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
