"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, PenTool, Code2, Rocket, CreditCard, CalendarClock, Repeat } from "lucide-react";
import { SectionHeading, scrollVariant } from "./SectionHeading";
import { ACCENTS, CARD_BASE } from "./palette";

const phases = [
  {
    accent: ACCENTS.blue,
    icon: <Search className="w-5 h-5" />,
    step: "01",
    title: "Discovery",
    body: "Understand the startup and define the MVP.",
  },
  {
    accent: ACCENTS.pink,
    icon: <PenTool className="w-5 h-5" />,
    step: "02",
    title: "Product Design",
    body: "User flows, wireframes and UI.",
  },
  {
    accent: ACCENTS.violet,
    icon: <Code2 className="w-5 h-5" />,
    step: "03",
    title: "MVP Development",
    body: "Frontend, backend, database and integrations.",
  },
  {
    accent: ACCENTS.emerald,
    icon: <Rocket className="w-5 h-5" />,
    step: "04",
    title: "Launch",
    body: "Deployment and production setup.",
  },
];

const paymentModes = [
  { icon: <CreditCard className="w-4 h-4" />, label: "One-time development" },
  { icon: <CalendarClock className="w-4 h-4" />, label: "Milestone-based payments" },
  { icon: <Repeat className="w-4 h-4" />, label: "Monthly development plan" },
];

export function Engagement() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <SectionHeading
          badgeClass="border-blue-400/30 bg-blue-500/10 text-blue-200"
          badge="Engagement"
          title="Build Your MVP"
          accent="in Stages"
          subtitle="You don't have to commit to the entire product on day one. Each stage stands on its own."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {phases.map((p, i) => (
            <motion.div
              key={p.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={scrollVariant}
              transition={{ delay: i * 0.06 }}
              className={`p-8 flex flex-col gap-4 ${CARD_BASE} ${p.accent.card}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${p.accent.tile} ${p.accent.icon}`}
                >
                  {p.icon}
                </div>
                <span className="text-xs font-bold tracking-[0.2em] text-white/25">{p.step}</span>
              </div>
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="text-sm opacity-60 leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={scrollVariant}
          className="mt-10 p-8 md:p-10 rounded-[16px] border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-blue-500/[0.06] to-transparent flex flex-col lg:flex-row lg:items-center gap-8 justify-between"
        >
          <div className="flex flex-col gap-2 max-w-md">
            <h3 className="text-xl font-semibold">Choose the pace that works for your startup.</h3>
            <p className="text-sm opacity-60 leading-relaxed">
              Pricing depends on what you decide to build. After the first conversation we share a clear
              scope, timeline and estimate — before anything starts.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {paymentModes.map((m) => (
              <div key={m.label} className="flex items-center gap-3 text-sm text-white/80">
                <div className="w-9 h-9 rounded-lg bg-violet-500/12 ring-1 ring-violet-400/25 flex items-center justify-center text-violet-300">
                  {m.icon}
                </div>
                {m.label}
              </div>
            ))}
            <p className="text-xs opacity-45 mt-1">Flexible payment plans available for eligible projects.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
