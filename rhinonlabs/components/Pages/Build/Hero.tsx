"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrollToSection } from "./scroll";
import { HeroDecor } from "./HeroDecor";
import { CTA_GRADIENT } from "./palette";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export function BuildHero() {
  return (
    <section id="build-hero" className="overflow-hidden relative min-h-screen flex flex-col justify-center">
      {/* Pure-CSS backdrop: a soft blue glow over a faint grid — no image, so the hero stays
          dark and loads instantly on a campaign page. */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Faint grid, faded out towards the edges */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 35%, black 20%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 35%, black 20%, transparent 75%)",
          }}
        />

        {/* Primary glow behind the headline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 30% 25%, rgba(37,99,235,0.28) 0%, transparent 65%), radial-gradient(ellipse 55% 45% at 72% 35%, rgba(147,51,234,0.24) 0%, transparent 65%), radial-gradient(ellipse 70% 40% at 50% 75%, rgba(6,182,212,0.14) 0%, transparent 70%)",
          }}
        />

        {/* Cool highlight along the top edge */}
        <div
          className="absolute inset-x-0 top-0 h-[420px]"
          style={{
            background:
              "radial-gradient(ellipse 55% 100% at 50% 0%, rgba(163,184,204,0.14) 0%, transparent 70%)",
          }}
        />

        {/* Stars and edge ornaments filling the empty margins either side of the copy */}
        <HeroDecor />

        {/* Vignette so the hero settles back into the page background */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-b from-transparent to-background" />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.12 }}
        className="pt-32 max-sm:pt-28 px-5 pb-16 flex flex-col gap-8 max-w-5xl mx-auto w-full"
      >
        <div className="flex flex-col gap-5 items-center">
          <motion.div
            variants={fadeUp}
            className="text-center inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-400/30 bg-gradient-to-r from-blue-500/15 to-violet-500/15 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 animate-pulse" />
            <span className="text-xs font-medium tracking-widest text-violet-100 uppercase font-sans">
              For First-Time Founders
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-[42px] text-center sm:text-5xl md:text-[76px] font-sans font-normal leading-[1.08] tracking-[-0.02em] max-w-4xl mx-auto py-2 text-transparent bg-clip-text bg-linear-to-b from-white/90 to-white/50"
          >
            Have an Idea for a Startup?{" "}
            <span className="font-serif italic bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Let&apos;s Build It.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-white/70 text-center sm:text-lg max-w-2xl mx-auto px-4 sm:px-0"
          >
            You bring the business idea. We help you turn it into a working product. Rhinon Labs works with
            aspiring founders to plan, design, build and launch startup MVPs — from websites and mobile apps
            to dashboards, AI features and backend systems.
          </motion.p>
        </div>

        <motion.div variants={fadeUp} className="flex items-center justify-center flex-col sm:flex-row gap-4">
          <Button
            className={`${CTA_GRADIENT} px-8 py-6 text-base font-semibold rounded-[10px] border-0 w-full sm:w-auto transition-all`}
            onClick={() => scrollToSection("idea-form")}
          >
            Book a Free Startup Consultation
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            className="px-8 py-6 text-base font-medium rounded-[10px] w-full sm:w-auto border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-cyan-400/40"
            onClick={() => scrollToSection("what-we-build")}
          >
            See What We Build
          </Button>
        </motion.div>

        <motion.p variants={fadeUp} className="text-center text-sm text-white/50 max-w-xl mx-auto">
          No commitment. Tell us your idea and we&apos;ll help you figure out what to build first.
        </motion.p>

        <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 pt-2">
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-white/60 text-sm text-center">
              Trusted by 20+ startups and SMBs worldwide.
            </span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
