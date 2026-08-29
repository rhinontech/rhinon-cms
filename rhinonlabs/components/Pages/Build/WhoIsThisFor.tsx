"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lightbulb, FileText, Palette, Rocket, Bot } from "lucide-react";
import { SectionHeading, scrollVariant } from "./SectionHeading";
import { ACCENTS, CARD_BASE } from "./palette";

const scenarios = [
  {
    accent: ACCENTS.amber,
    icon: <Lightbulb className="w-6 h-6" />,
    title: "I have a startup idea",
    body: "I know the problem I want to solve, but I don't know how to build the technology.",
  },
  {
    accent: ACCENTS.blue,
    icon: <FileText className="w-6 h-6" />,
    title: "I have a business plan",
    body: "I already have the business model or pitch deck and need a product to demonstrate it.",
  },
  {
    accent: ACCENTS.pink,
    icon: <Palette className="w-6 h-6" />,
    title: "I have a prototype",
    body: "I have Figma designs, a prototype or wireframes and need someone to turn them into a real product.",
  },
  {
    accent: ACCENTS.orange,
    icon: <Rocket className="w-6 h-6" />,
    title: "I want to build an MVP",
    body: "I want something functional that I can show to users, customers, partners or investors.",
  },
  {
    accent: ACCENTS.violet,
    icon: <Bot className="w-6 h-6" />,
    title: "I want AI in my startup",
    body: "I need AI features, automation, chatbots, recommendations or intelligent workflows.",
  },
];

export function WhoIsThisFor() {
  return (
    <section id="who-is-this-for" className="py-24 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <SectionHeading
          badgeClass="border-amber-400/30 bg-amber-500/10 text-amber-200"
          badge="Who This Is For"
          title="You Don't Need a Technical Background"
          accent="to Start Building."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((s, i) => (
            <motion.div
              key={s.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={scrollVariant}
              transition={{ delay: i * 0.06 }}
              className={`p-8 relative overflow-hidden flex flex-col gap-4 ${CARD_BASE} ${s.accent.card}`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.accent.tile} ${s.accent.icon}`}
              >
                {s.icon}
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="text-sm opacity-60 leading-relaxed">{s.body}</p>

            </motion.div>
          ))}

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={scrollVariant}
            transition={{ delay: 0.3 }}
            className="p-8 rounded-[16px] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-blue-500/[0.06] to-transparent flex flex-col justify-center gap-3"
          >
            <h3 className="text-lg font-semibold">Not sure which one you are?</h3>
            <p className="text-sm opacity-60 leading-relaxed">
              That&apos;s normal. Most founders we work with start with a rough idea and a lot of questions.
              The first conversation is about figuring out what&apos;s worth building.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
