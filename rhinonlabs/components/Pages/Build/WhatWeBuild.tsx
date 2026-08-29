"use client";

import React from "react";
import { motion } from "framer-motion";
import { Globe, LayoutDashboard, Smartphone, MonitorSmartphone, Bot, Server, CloudUpload } from "lucide-react";
import { SectionHeading, scrollVariant } from "./SectionHeading";
import { ACCENTS, CARD_BASE } from "./palette";

const capabilities = [
  {
    accent: ACCENTS.blue,
    icon: <Globe className="w-6 h-6" />,
    title: "Website & Landing Pages",
    body: "Startup websites, marketing pages, waitlists, lead-generation websites and product landing pages.",
  },
  {
    accent: ACCENTS.cyan,
    icon: <MonitorSmartphone className="w-6 h-6" />,
    title: "Web Applications",
    body: "Customer-facing SaaS products, marketplaces, booking systems, management platforms and other web apps.",
  },
  {
    accent: ACCENTS.pink,
    icon: <Smartphone className="w-6 h-6" />,
    title: "Mobile Applications",
    body: "iOS and Android applications for consumer and business startups.",
  },
  {
    accent: ACCENTS.emerald,
    icon: <LayoutDashboard className="w-6 h-6" />,
    title: "Admin Dashboards",
    body: "Manage users, orders, subscriptions, content, analytics, operations and more from one place.",
  },
  {
    accent: ACCENTS.violet,
    icon: <Bot className="w-6 h-6" />,
    title: "AI-Powered Features",
    body: "AI assistants, chatbots, document processing, recommendations, automation and intelligent workflows.",
  },
  {
    accent: ACCENTS.orange,
    icon: <Server className="w-6 h-6" />,
    title: "Backend & APIs",
    body: "Authentication, databases, APIs, payments, notifications, integrations and infrastructure.",
  },
  {
    accent: ACCENTS.amber,
    icon: <CloudUpload className="w-6 h-6" />,
    title: "Deployment & Launch",
    body: "Cloud deployment, domain setup, production environments, monitoring and launch support.",
  },
];

export function WhatWeBuild() {
  return (
    <section id="what-we-build" className="py-24 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <SectionHeading
          badgeClass="border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
          badge="What We Build"
          title="Everything You Need to Build"
          accent="Your First Version"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={scrollVariant}
              transition={{ delay: (i % 3) * 0.06 }}
              className={`p-8 flex flex-col gap-4 ${CARD_BASE} ${c.accent.card}`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.accent.tile} ${c.accent.icon}`}
              >
                {c.icon}
              </div>
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <p className="text-sm opacity-60 leading-relaxed">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
