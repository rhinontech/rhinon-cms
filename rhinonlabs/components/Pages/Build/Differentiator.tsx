"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { SectionHeading, scrollVariant } from "./SectionHeading";

const rows: { freelancer: string; rhinon: string }[] = [
  { freelancer: "You provide exact requirements", rhinon: "We help shape the product" },
  { freelancer: "Task-based development", rhinon: "Product-focused execution" },
  { freelancer: "You manage multiple people", rhinon: "One team, one point of contact" },
  { freelancer: "Technical decisions are on you", rhinon: "We guide technical decisions" },
  { freelancer: "Build → handover", rhinon: "Build → launch → improve" },
  { freelancer: "Often focused on individual tasks", rhinon: "Focused on the complete MVP" },
];

export function Differentiator() {
  return (
    <section id="why-rhinon" className="py-24 relative overflow-hidden">
      <div className="max-w-[1100px] mx-auto px-6 relative z-10">
        <SectionHeading
          badgeClass="border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          badge="Why Rhinon Labs"
          title="Don't Just Hire Developers."
          accent="Build With a Technology Partner."
          subtitle="You don't have to become a technology expert just because you're building a technology startup."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={scrollVariant}
          className="rounded-[16px] border border-white/8 bg-[#0d1119]/60 backdrop-blur-sm overflow-hidden"
        >
          {/* Column headers */}
          <div className="grid grid-cols-2 border-b border-white/5">
            <div className="px-5 py-5 sm:px-8">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/40">
                Typical Freelancer
              </span>
            </div>
            <div className="px-5 py-5 sm:px-8 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-l border-emerald-400/20">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Rhinon Labs
              </span>
            </div>
          </div>

          {rows.map((row) => (
            <div key={row.rhinon} className="grid grid-cols-2 border-b border-white/5 last:border-b-0">
              <div className="px-5 py-5 sm:px-8 flex items-start gap-3">
                <Minus className="w-4 h-4 mt-0.5 shrink-0 text-white/25" />
                <span className="text-sm text-white/45">{row.freelancer}</span>
              </div>
              <div className="px-5 py-5 sm:px-8 flex items-start gap-3 bg-gradient-to-r from-emerald-500/[0.07] to-cyan-500/[0.07] border-l border-emerald-400/20">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                <span className="text-sm text-white/85">{row.rhinon}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
