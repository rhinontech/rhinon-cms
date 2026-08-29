"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

const examples = [
  {
    tab: "Food Startup",
    idea: "An online marketplace for home chefs.",
    features: [
      "User registration",
      "Chef profiles",
      "Menu management",
      "Ordering flow",
      "Payments",
      "Order dashboard",
      "Admin panel",
    ],
  },
  {
    tab: "Education Startup",
    idea: "A platform connecting students with tutors.",
    features: [
      "Student signup",
      "Tutor profiles",
      "Session booking",
      "Payments",
      "Student & tutor dashboards",
      "Notifications",
      "Admin panel",
    ],
  },
  {
    tab: "AI Startup",
    idea: "An AI tool for a specific professional workflow.",
    features: [
      "Authentication",
      "AI chat / assistant interface",
      "Document upload",
      "AI processing pipeline",
      "Results & history",
      "Subscriptions",
      "Admin dashboard",
    ],
  },
];

export function MvpExamples() {
  const [active, setActive] = useState(0);
  const current = examples[active];

  return (
    <section id="mvp-examples" className="py-24 relative overflow-hidden">
      <div className="max-w-[1000px] mx-auto px-6 relative z-10">
        <SectionHeading
          badgeClass="border-orange-400/30 bg-orange-500/10 text-orange-200"
          badge="MVP Examples"
          title="What Does an MVP"
          accent="Actually Mean?"
          subtitle="An MVP is the smallest version of your product that real users can actually use. Here's what that looks like in practice."
        />

        <div className="rounded-2xl border border-white/8 bg-[#0d1119]/60 backdrop-blur-sm overflow-hidden">
          <div className="flex px-4 pt-4 pb-4 gap-2 flex-wrap sm:flex-nowrap">
            {examples.map((ex, index) => (
              <button
                key={ex.tab}
                onClick={() => setActive(index)}
                className={`flex-1 min-w-[120px] py-4 rounded-[10px] text-xs font-bold tracking-[0.12em] uppercase transition-all duration-300 border ${
                  index === active
                    ? "bg-gradient-to-r from-blue-500/25 to-violet-500/25 border-violet-400/40 text-white"
                    : "bg-white/[0.03] border-white/5 text-white/45 hover:text-white/70 hover:bg-white/[0.06]"
                }`}
              >
                {ex.tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 md:p-12 flex flex-col gap-8"
            >
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/35">Idea</span>
                <p className="text-xl md:text-2xl font-medium bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  {current.idea}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/35">
                  What the MVP includes
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {current.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-3 px-4 py-3 rounded-[10px] bg-gradient-to-r from-emerald-500/[0.08] to-transparent border border-emerald-400/15"
                    >
                      <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span className="text-sm text-white/80">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
