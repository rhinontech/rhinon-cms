"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SectionHeading, scrollVariant } from "./SectionHeading";
import { ACCENTS, CARD_BASE } from "./palette";
import { scrollToSection } from "./scroll";

const stages = [
  {
    emoji: "💭",
    accent: ACCENTS.amber,
    title: "Just an Idea",
    body: "You haven't built anything yet.",
    help: ["Idea", "MVP scope", "Product roadmap", "Prototype"],
  },
  {
    emoji: "📝",
    accent: ACCENTS.blue,
    title: "Business Plan / Pitch Deck",
    body: "You know what you're building but need a product.",
    help: ["UX", "Development", "MVP", "Investor demo"],
  },
  {
    emoji: "🎨",
    accent: ACCENTS.pink,
    title: "Prototype",
    body: "Your screens are ready.",
    help: ["Frontend", "Backend", "Integrations", "Deployment"],
  },
  {
    emoji: "🚀",
    accent: ACCENTS.emerald,
    title: "Early Startup",
    body: "You already have users and need to improve the product.",
    help: ["New features", "Scalability", "Automation", "Dashboards"],
  },
];

export function StartupStage() {
  return (
    <section id="your-stage" className="py-24 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <SectionHeading
          badgeClass="border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          badge="Your Stage"
          title="Where Are You"
          accent="Right Now?"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stages.map((stage, i) => (
            <motion.div
              key={stage.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={scrollVariant}
              transition={{ delay: (i % 2) * 0.08 }}
              className={`p-8 pt-9 relative overflow-hidden flex flex-col gap-4 ${CARD_BASE} ${stage.accent.card}`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 ${stage.accent.bar}`} />
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none">{stage.emoji}</span>
                <h3 className="text-xl font-semibold">{stage.title}</h3>
              </div>
              <p className="text-sm opacity-60">{stage.body}</p>

              <div className="pt-2">
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/35 mb-3">
                  We can help with
                </p>
                <div className="flex flex-wrap gap-2">
                  {stage.help.map((h) => (
                    <span
                      key={h}
                      className={`px-3 py-1.5 rounded-full text-xs ${stage.accent.chip}`}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scrollVariant}
          className="flex justify-center mt-10"
        >
          <button
            onClick={() => scrollToSection("idea-form")}
            className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200 transition-colors underline underline-offset-4 decoration-cyan-400/30"
          >
            Tell us where you are and we&apos;ll take it from there
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
