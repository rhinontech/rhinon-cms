"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionHeading, scrollVariant } from "./SectionHeading";
import { ACCENTS, CARD_BASE } from "./palette";

const steps = [
  {
    id: "01",
    accent: ACCENTS.blue,
    title: "Tell Us Your Idea",
    body: "You explain the problem, target users and what you want to build. No technical documentation required.",
  },
  {
    id: "02",
    accent: ACCENTS.cyan,
    title: "Shape the MVP",
    body: "We help identify the features that actually need to be built for the first version — and the ones that can wait.",
  },
  {
    id: "03",
    accent: ACCENTS.pink,
    title: "Product & UI/UX",
    body: "We turn the concept into product flows, screens and a clear user experience.",
  },
  {
    id: "04",
    accent: ACCENTS.violet,
    title: "Development",
    body: "Our team builds the web app, mobile app, backend, dashboard and integrations.",
  },
  {
    id: "05",
    accent: ACCENTS.emerald,
    title: "Test & Launch",
    body: "We test the product, deploy it and help you get the first version live.",
  },
  {
    id: "06",
    accent: ACCENTS.amber,
    title: "Keep Building",
    body: "Once real users start using it, we can continue improving the product.",
  },
];

export function BuildProcess() {
  return (
    <section id="process" className="py-24 relative overflow-hidden">
      <div className="max-w-[1000px] mx-auto px-6 relative z-10">
        <SectionHeading
          badgeClass="border-violet-400/30 bg-violet-500/10 text-violet-200"
          badge="Our Process"
          title="Your Idea."
          accent="Our Process."
          subtitle="Most first-time founders have no idea what happens after they say “I have an idea.” Here's exactly what it looks like."
        />

        <div className="relative">
          {/* Spine connecting the steps on wider screens */}
          <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-blue-400/60 via-violet-400/40 to-amber-400/30 hidden sm:block" />

          <div className="flex flex-col gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={scrollVariant}
                transition={{ delay: i * 0.05 }}
                className={`flex gap-5 items-start p-6 ${CARD_BASE} ${step.accent.card}`}
              >
                <div
                  className={`shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-sm font-bold tracking-widest ${step.accent.tile} ${step.accent.icon}`}
                >
                  {step.id}
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm opacity-60 leading-relaxed">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
