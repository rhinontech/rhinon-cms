"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight, BarChart3, BookOpen, Calendar, CheckCircle2, ClipboardList, Clock, Code2, Cog, Database,
  FileText, Globe, Layers, LayoutDashboard, Mail, MousePointerClick, Plug, Rocket, Shield, Smartphone,
  Sparkles, Target, UserPlus, Users, Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import SchedulerModal from "@/components/Common/CTA/SchedulerModal";
import { ElevateCTA } from "@/components/Common/CTA/ElevateCTA";
import { FAQ } from "@/components/Common/FAQ/FAQ";
import { CaseStudies } from "@/components/Pages/Home/CaseStudy/CaseStudies";
import type { Service } from "@/lib/services";
import { services } from "@/lib/services";
import type { Blog } from "@/lib/api";

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  globe: Globe, smartphone: Smartphone, sparkles: Sparkles, mouse: MousePointerClick, mail: Mail, target: Target,
  file: FileText, cog: Cog, plug: Plug, userplus: UserPlus, clock: Clock, chart: BarChart3, layout: LayoutDashboard,
  users: Users, shield: Shield, database: Database, rocket: Rocket, code: Code2, calendar: Calendar,
  clipboard: ClipboardList, layers: Layers,
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};
const inView = { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-100px" }, variants: fadeUp } as const;

function SectionHeader({ badge, lead, accent, sub }: { badge: string; lead: string; accent: string; sub?: string }) {
  return (
    <motion.div {...inView} className="flex flex-col items-center text-center mb-16">
      <div className="mb-6 inline-flex items-center px-4 py-2 rounded-full border border-white/5 bg-white/5 backdrop-blur-md">
        <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans">{badge}</span>
      </div>
      <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-white/60 pb-1">
        {lead} <span className="font-serif italic text-transparent bg-clip-text">{accent}</span>
      </h2>
      {sub && <p className="mt-4 opacity-60 text-sm md:text-base max-w-2xl">{sub}</p>}
    </motion.div>
  );
}

function SectionGlow() {
  return (
    <>
      <div
        className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[1200px] h-1 pointer-events-none"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(216, 231, 242, 0.07) 0%, rgba(216, 231, 242, 0) 100%)" }}
      />
      <div
        className="absolute -bottom-[249px] left-0 right-0 mx-auto w-[793px] h-[499px] opacity-10 pointer-events-none -rotate-13 rounded-[10px]"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(213, 219, 230, 0.7) 0%, rgba(213, 219, 230, 0) 100%)", zIndex: 1 }}
      />
    </>
  );
}

function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-t-2 border-white/10 bg-[#10131c] p-3.5 group-hover:scale-110 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
      {children}
    </div>
  );
}

export default function ServiceDetail({ service, blogs }: { service: Service; blogs: Blog[] }) {
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const others = services.filter((s) => s.slug !== service.slug);

  return (
    <div className="relative flex flex-col gap-10 selection:bg-[#1c2bff]/50 overflow-x-clip">
      {/* ── Hero — same composition as the homepage hero ─────────────────── */}
      <section className="overflow-hidden relative min-h-[88vh] flex flex-col justify-center">
        <motion.div
          className="absolute inset-0 top-48 -z-10"
          initial={{ opacity: 0.35 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <div className="mask-[linear-gradient(to_bottom,transparent,white_30%,white_60%,transparent)] relative w-full h-full">
            <Image src="/images/background/background.jpg" fill className="object-cover" alt="" priority sizes="100vw" />
          </div>
        </motion.div>

        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#A3B8CC" />
        <div className="pt-36 max-sm:pt-28 px-5 pb-16 flex flex-col gap-8 max-w-5xl mx-auto w-full">
          <motion.nav initial="hidden" animate="visible" variants={fadeUp} aria-label="Breadcrumb" className="flex justify-center items-center gap-2 text-xs text-white/50">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/services" className="hover:text-white transition-colors">Services</Link>
            <span>/</span>
            <span className="text-white/80">{service.name}</span>
          </motion.nav>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-col items-center">
            <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium tracking-widest text-[#A3B8CC] uppercase font-sans">{service.eyebrow}</span>
            </div>
            <h1 className="text-[38px] text-center sm:text-5xl md:text-[64px] font-sans font-normal leading-[1.1] tracking-[-0.02em] max-w-5xl mx-auto text-balance py-2 text-transparent bg-clip-text bg-linear-to-b from-white/90 to-white/50 mb-6">
              {service.headline} <br className="hidden sm:block" />
              <span className="font-serif italic text-transparent bg-clip-text">{service.headlineAccent}</span>
            </h1>
            <p className="text-white/70 text-center sm:text-lg max-w-2xl mx-auto mb-10">{service.intro}</p>

            <div className="flex items-center justify-center flex-col md:flex-row gap-5">
              <Button
                className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg font-semibold rounded-none border-3 border-black/30 transition-all"
                onClick={() => setIsSchedulerOpen(true)}
              >
                Book a Free Discovery Call
              </Button>
              <Link href="/case-studies" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors">
                See our work <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          <motion.p
            className="text-center text-sm text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Fast Delivery • Affordable Pricing • AI-Powered Development
          </motion.p>
        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <SectionHeader badge="Sound Familiar?" lead="This is for you" accent="if…" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {service.forYouIf.map((item) => (
              <motion.div key={item} {...inView}>
                <SpotlightCard className="group h-full">
                  <div className="flex items-center gap-5 p-6 md:p-8 h-full">
                    <IconTile><CheckCircle2 className="w-5 h-5 text-[#e4fe00]" /></IconTile>
                    <p className="text-[16px] leading-relaxed text-white/80">{item}</p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
        <SectionGlow />
      </section>

      {/* ── What we build — Examples-style cards ─────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <SectionHeader badge="What We Build" lead={`${service.name},`} accent="built around you" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {service.builds.map((b) => {
              const Icon = SERVICE_ICONS[b.icon] ?? Workflow;
              return (
                <motion.div key={b.title} {...inView}>
                <SpotlightCard className="group h-full"><div className="p-5 flex flex-col gap-5">
                  <div className="relative overflow-hidden flex justify-center items-center p-10 rounded-lg shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)]">
                    <div className="relative z-10"><IconTile><Icon className="w-6 h-6 text-white/80" /></IconTile></div>
                    <div
                      className="absolute top-0 right-0 pointer-events-none"
                      style={{ width: 437, height: 306, background: "radial-gradient(circle, rgba(184, 199, 217, 0.5) 0%, rgba(184, 199, 217, 0) 100%)", opacity: 0.1, transform: "translate(50%, -50%)" }}
                    />
                  </div>
                  <div className="text-center px-2 pb-2">
                    <h3 className="text-white text-lg font-semibold mb-1.5 tracking-tight">{b.title}</h3>
                    <p className="text-white/45 text-[15px] leading-relaxed">{b.description}</p>
                  </div>
                </div></SpotlightCard>
                </motion.div>
              );
            })}
          </div>
        </div>
        <SectionGlow />
      </section>

      {/* ── Process ──────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <SectionHeader badge="Our Process" lead="How we" accent="work" sub="A clear scope and timeline before we start — then visible progress every week." />
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* connector line behind the step nodes */}
            <div className="hidden md:block absolute top-[52px] left-[12%] right-[12%] h-px bg-linear-to-r from-transparent via-[#e4fe00]/40 to-transparent" />
            {service.process.map((p, i) => (
              <motion.div key={p.step} {...inView}>
              <SpotlightCard className="h-full" color="rgba(228, 254, 0, 0.08)"><div className="p-7 flex flex-col">
                <div className="mb-6 flex items-center justify-between">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#1c2bff] px-2 text-xs font-semibold text-white">
                    0{i + 1}
                  </span>
                  <span className="h-10 w-10 rounded-lg border border-white/10 bg-[#10131c] flex items-center justify-center shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)]">
                    <span className="h-3 w-3 rounded-full bg-[#e4fe00] shadow-[0_0_12px_rgba(228,254,0,0.6)]" />
                  </span>
                </div>
                <h3 className="text-[20px] font-semibold text-white mb-2 tracking-tight">{p.step}</h3>
                <p className="text-[15px] leading-relaxed text-white/55">{p.description}</p>
              </div></SpotlightCard>
              </motion.div>
            ))}
          </div>
          <motion.div {...inView} className="mt-12 flex justify-center">
            <button
              onClick={() => setIsSchedulerOpen(true)}
              className="px-6 py-3 rounded-xl bg-[#1c2bff] text-white text-sm font-medium hover:bg-[#1c2bff]/90 transition-colors"
            >
              Book a free discovery call
            </button>
          </motion.div>
        </div>
        <SectionGlow />
      </section>

      {/* ── Outcomes — Results-style pills ───────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-full mx-auto px-6 relative z-10">
          <SectionHeader badge="Measurable Impact" lead="What you" accent="walk away with" />
          <div className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto">
            {service.outcomes.map((o) => (
              <div key={o} className="flex hover:scale-105 transition-all duration-300 ease-in-out items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.7)]">
                <CheckCircle2 className="w-4 h-4 text-[#111]" />
                <span className="text-[15px] max-sm:text-[13px] font-medium text-[#333] tracking-tight">{o}</span>
              </div>
            ))}
          </div>
        </div>
        <SectionGlow />
      </section>

      {/* ── Related work — the homepage case-study grid, filtered ────────── */}
      {service.relatedCaseStudies.length > 0 && <CaseStudies slugs={service.relatedCaseStudies} />}

      <ElevateCTA />

      {/* ── Further reading — blog-index cards ───────────────────────────── */}
      {blogs.length > 0 && (
        <section className="py-24 relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-6 relative z-10">
            <SectionHeader badge="From The Blog" lead="Go" accent="deeper" />
            {/* flex + fixed widths so 1–2 posts sit centred instead of hugging the left */}
            <div className="flex flex-wrap justify-center gap-6">
              {blogs.map((blog) => (
                <Link
                  key={blog.slug}
                  href={`/blogs/${blog.slug}`}
                  className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] group flex flex-col rounded-2xl border border-border/7 bg-background/30 overflow-hidden shadow-[inset_0_2px_1px_rgba(207,231,255,0.1)] hover:border-white/20 transition-all duration-300"
                >
                  <div className="aspect-16/10 overflow-hidden relative bg-white/5">
                    {blog.coverImage ? (
                      <img loading="lazy" decoding="async" src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-white/30" /></div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-background/90 via-transparent to-transparent opacity-80" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    {blog.category && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-2">{blog.category}</span>
                    )}
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white/80 transition-colors leading-tight">{blog.title}</h3>
                    <p className="text-sm text-white/50 line-clamp-2 mb-4 leading-relaxed">{blog.excerpt}</p>
                    {blog.publishedAt && (
                      <span className="mt-auto pt-4 border-t border-white/5 text-[10px] text-white/45">
                        {format(new Date(blog.publishedAt), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <SectionGlow />
        </section>
      )}

      <FAQ items={service.faqs} />

      {/* ── Other services — internal links ──────────────────────────────── */}
      <section className="pb-24 relative">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <p className="mb-6 text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase">Explore other services</p>
          <div className="flex flex-wrap justify-center gap-3">
            {others.map((s) => (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SchedulerModal isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
    </div>
  );
}
