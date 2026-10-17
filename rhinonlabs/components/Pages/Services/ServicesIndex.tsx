"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { ArrowRight, Bot, Globe, LayoutDashboard, Rocket, Smartphone, Workflow } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { ElevateCTA } from "@/components/Common/CTA/ElevateCTA";
import { CaseStudies } from "@/components/Pages/Home/CaseStudy/CaseStudies";
import { FAQ } from "@/components/Common/FAQ/FAQ";
import { services } from "@/lib/services";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "mvp-development": Rocket,
  "ai-agents": Bot,
  "workflow-automation": Workflow,
  "internal-dashboards": LayoutDashboard,
  "web-development": Globe,
  "mobile-app-development": Smartphone,
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export default function ServicesIndex() {
  return (
    <div className="relative flex flex-col gap-10 selection:bg-[#1c2bff]/50 overflow-x-clip">
      <section className="overflow-hidden relative flex flex-col justify-center">
        <motion.div
          className="absolute inset-0 top-40 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeOut", delay: 0.4 }}
        >
          <div className="mask-[linear-gradient(to_bottom,transparent,white_30%,white_60%,transparent)] relative w-full h-full">
            <Image src="/images/background/background.jpg" fill className="object-cover" alt="" priority sizes="100vw" />
          </div>
        </motion.div>
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#A3B8CC" />

        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="pt-40 max-sm:pt-28 pb-10 px-5 max-w-5xl mx-auto w-full flex flex-col items-center">
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium tracking-widest text-[#A3B8CC] uppercase font-sans">Our Services</span>
          </div>
          <h1 className="text-[40px] text-center sm:text-5xl md:text-[72px] font-sans font-normal leading-[1.1] tracking-[-0.02em] max-w-4xl py-2 text-transparent bg-clip-text bg-linear-to-b from-white/90 to-white/50 mb-6">
            Everything you need to <br className="hidden sm:block" />
            <span className="font-serif italic text-transparent bg-clip-text">ship and scale</span>
          </h1>
          <p className="text-white/70 text-center sm:text-lg max-w-2xl">
            From a first MVP to the AI and internal systems that run your business — designed, built and launched end-to-end, usually within weeks.
          </p>
        </motion.div>
      </section>

      <section className="pb-24 relative">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => {
            const Icon = ICONS[s.slug] ?? Workflow;
            return (
              <motion.div
                key={s.slug}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/services/${s.slug}`} className="block h-full">
                  <SpotlightCard className="group h-full">
                    <div className="p-5 flex flex-col gap-5 h-full">
                      <div className="relative overflow-hidden flex justify-center items-center p-12 rounded-lg shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)]">
                        <div className="relative z-10 rounded-xl border-t-2 border-white/10 bg-[#10131c] p-4 group-hover:scale-110 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                          <Icon className="w-7 h-7 text-white/80" />
                        </div>
                        <div
                          className="absolute top-0 right-0 pointer-events-none"
                          style={{ width: 437, height: 306, background: "radial-gradient(circle, rgba(184, 199, 217, 0.5) 0%, rgba(184, 199, 217, 0) 100%)", opacity: 0.1, transform: "translate(50%, -50%)" }}
                        />
                      </div>
                      <div className="px-2 pb-2 flex flex-col flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-2">{s.eyebrow}</span>
                        <h2 className="text-[22px] font-semibold text-white mb-2 tracking-tight">{s.name}</h2>
                        <p className="text-white/50 text-[15px] leading-relaxed mb-6">{s.headline} {s.headlineAccent}.</p>
                        <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                          Learn more <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </SpotlightCard>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <CaseStudies />
      <ElevateCTA />
      <FAQ />
    </div>
  );
}
