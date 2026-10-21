"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { motion, Variants } from "framer-motion";
import { ArrowRight, BookOpen, CheckCircle2, Rocket, ShieldCheck, TrendingUp } from "lucide-react";
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

/** Colour + icon per outcome card, by position (every service has three). */
const OUTCOME_TONES = [
  { Icon: Rocket, tile: "from-[#5b7bff] to-[#8b5cf6]", glow: "from-[#5b7bff] to-[#8b5cf6]" },
  { Icon: ShieldCheck, tile: "from-[#14b8a6] to-[#2dd4bf]", glow: "from-[#14b8a6] to-[#2dd4bf]" },
  { Icon: TrendingUp, tile: "from-[#f59e0b] to-[#f97316]", glow: "from-[#f59e0b] to-[#f97316]" },
];

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
      <section className="overflow-hidden relative flex flex-col justify-center">
        <motion.div
          className="absolute inset-0 top-48 -z-10"
          initial={{ opacity: 0.35 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <div className="mask-[linear-gradient(to_bottom,transparent,white_30%,white_60%,transparent)] relative w-full h-full">
            <div
            aria-hidden="true"
            // Decorative only: a CSS background, not an <img>, so search engines
            // never pick it as the page's thumbnail (they did, in Google results).
            className="site-bg absolute inset-0 bg-cover bg-center"
          />
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
            <h1 className="text-[38px] text-center sm:text-5xl md:text-[64px] font-sans font-normal leading-[1.1] tracking-[-0.02em] max-w-5xl mx-auto text-balance py-2 text-transparent bg-clip-text bg-linear-to-b from-white to-white/80 mb-6">
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
            {service.builds.map((b, i) => {
              return (
                <motion.div key={b.title} {...inView}>
                <SpotlightCard className="group h-full"><div className="p-5 flex flex-col gap-5">
                  {/* Gemini-generated illustration per build, public/assets/services/builds/<slug>-<n>.webp */}
                  <div className="relative overflow-hidden aspect-[4/3] rounded-lg shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)]">
                    <Image
                      src={`/assets/services/builds/${service.slug}-${i + 1}.webp`}
                      alt={`${b.title} illustration`}
                      fill
                      sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    />
                  </div>
                  <div className="text-center px-2 pb-2">
                    <h3 className="text-white text-lg font-semibold mb-1.5 tracking-tight">{b.title}</h3>
                    <p className="text-white/60 text-[15px] leading-relaxed">{b.description}</p>
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
          {/* One connected timeline: a glowing track links the steps so they read
              as a single journey. Horizontal from md up, vertical on phones. */}
          <motion.div
            {...inView}
            className="relative rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-10 md:px-10 md:py-14 shadow-[inset_0_2px_1px_rgba(207,231,255,0.15)] overflow-hidden"
          >
            <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[70%] -translate-x-1/2 rounded-full bg-[#4d6bff]/15 blur-3xl" />
            <ol className="relative grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-8">
              {/* track */}
              <div className="hidden md:block absolute left-[12.5%] right-[12.5%] top-6 h-[2px] rounded-full bg-linear-to-r from-[#5b7bff] via-[#a26bff] to-[#2dd4bf] opacity-70" />
              <div className="md:hidden absolute left-6 top-2 bottom-2 w-[2px] rounded-full bg-linear-to-b from-[#5b7bff] via-[#a26bff] to-[#2dd4bf] opacity-70" />
              {service.process.map((p, i) => (
                <li key={p.step} className="relative flex gap-5 md:flex-col md:items-center md:text-center md:gap-0">
                  <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0b0f1c] ring-2 ring-white/10 shadow-[0_0_30px_-4px_rgba(91,123,255,0.7)]">
                    <span className="bg-linear-to-br from-[#c7d4ff] to-[#5b7bff] bg-clip-text text-transparent text-base font-bold tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <div className="md:mt-7">
                    <h3 className="text-[20px] font-semibold text-white mb-2 tracking-tight">{p.step}</h3>
                    <p className="text-[15px] leading-relaxed text-white/60 md:max-w-[240px] md:mx-auto">{p.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="relative mt-12 flex justify-center">
              <button
                onClick={() => setIsSchedulerOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1c2bff] text-white text-sm font-medium hover:bg-[#1c2bff]/90 transition-colors shadow-[0_8px_30px_-8px_rgba(28,43,255,0.8)]"
              >
                Book a free discovery call <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
        <SectionGlow />
      </section>

      {/* ── Outcomes — Results-style pills ───────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-full mx-auto px-6 relative z-10">
          <SectionHeader badge="Measurable Impact" lead="What you" accent="walk away with" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 max-w-[1100px] mx-auto">
            {service.outcomes.map((o, i) => {
              const tone = OUTCOME_TONES[i % OUTCOME_TONES.length];
              return (
                <motion.div
                  key={o}
                  {...inView}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-7 shadow-[inset_0_2px_1px_rgba(207,231,255,0.15)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl opacity-25 bg-linear-to-br ${tone.glow}`} />
                  <span className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${tone.tile} shadow-lg`}>
                    <tone.Icon className="h-6 w-6 text-white" />
                  </span>
                  <p className="relative mt-6 text-[18px] leading-snug font-medium text-white tracking-tight">{o}</p>
                </motion.div>
              );
            })}
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
                      <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-white/60" /></div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-background/90 via-transparent to-transparent opacity-80" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    {blog.category && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">{blog.category}</span>
                    )}
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white/80 transition-colors leading-tight">{blog.title}</h3>
                    <p className="text-sm text-white/50 line-clamp-2 mb-4 leading-relaxed">{blog.excerpt}</p>
                    {blog.publishedAt && (
                      <span className="mt-auto pt-4 border-t border-white/5 text-[10px] text-white/60">
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
