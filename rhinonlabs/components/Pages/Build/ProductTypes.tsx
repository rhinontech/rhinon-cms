"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Smartphone,
  Bot,
  Store,
  UserCircle,
  ShieldCheck,
  CalendarCheck,
  Building2,
} from "lucide-react";
import { SectionHeading, scrollVariant } from "./SectionHeading";
import { ACCENTS, CARD_BASE } from "./palette";

const productTypes = [
  { icon: LayoutDashboard, label: "SaaS Dashboard", accent: ACCENTS.blue },
  { icon: Smartphone, label: "Mobile App", accent: ACCENTS.pink },
  { icon: Bot, label: "AI Product", accent: ACCENTS.violet },
  { icon: Store, label: "Marketplace", accent: ACCENTS.amber },
  { icon: UserCircle, label: "Customer Portal", accent: ACCENTS.cyan },
  { icon: ShieldCheck, label: "Admin Panel", accent: ACCENTS.emerald },
  { icon: CalendarCheck, label: "Booking Platform", accent: ACCENTS.orange },
  { icon: Building2, label: "Internal Platform", accent: ACCENTS.blue },
];

export function ProductTypes() {
  return (
    <section id="product-types" className="py-24 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <SectionHeading
          badgeClass="border-pink-400/30 bg-pink-500/10 text-pink-200"
          badge="What It Could Be"
          title="Your Startup Could"
          accent="Look Like This"
          subtitle="Whatever shape your idea takes, it usually ends up as one of these — or a combination of them."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {productTypes.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={scrollVariant}
                transition={{ delay: (i % 4) * 0.05 }}
                className={`aspect-4/3 flex flex-col items-center justify-center gap-3 px-4 text-center ${CARD_BASE} ${p.accent.card}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${p.accent.tile} ${p.accent.icon}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-white/80">{p.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
