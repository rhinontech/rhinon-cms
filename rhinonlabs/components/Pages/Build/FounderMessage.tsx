"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrollVariant } from "./SectionHeading";
import { CTA_GRADIENT } from "./palette";
import { scrollToSection } from "./scroll";

export function FounderMessage() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-[900px] mx-auto px-6 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={scrollVariant}
          className="p-10 md:p-16 rounded-[20px] border border-blue-400/20 bg-gradient-to-br from-blue-600/15 via-violet-600/10 to-cyan-500/[0.07] backdrop-blur-sm relative overflow-hidden text-center flex flex-col items-center gap-6"
        >
          <h2 className="text-3xl md:text-[42px] font-medium tracking-tight leading-[1.2] text-transparent bg-clip-text bg-linear-to-b from-white/90 to-white/50 max-w-2xl py-1">
            You Focus on the Business.{" "}
            <span className="font-serif italic bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              We&apos;ll Handle the Technology.
            </span>
          </h2>

          <div className="flex flex-col gap-4 max-w-xl">
            <p className="opacity-70 leading-relaxed">
              As a founder, you already have enough to figure out — customers, pricing, marketing,
              partnerships and growth.
            </p>
            <p className="opacity-70 leading-relaxed">
              You shouldn&apos;t have to spend months learning how servers, databases, APIs and deployments
              work just to launch your first product.
            </p>
            <p className="text-white/90 leading-relaxed font-medium">
              Rhinon Labs gives you the technology team you need to turn your idea into something real.
            </p>
          </div>

          <Button
            className={`${CTA_GRADIENT} px-8 py-6 text-base font-semibold rounded-[10px] border-0 mt-2 transition-all`}
            onClick={() => scrollToSection("idea-form")}
          >
            Discuss My Startup Idea
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: "700px",
              height: "400px",
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,0.8) 0%, rgba(99,102,241,0) 100%)",
              opacity: 0.35,
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}
