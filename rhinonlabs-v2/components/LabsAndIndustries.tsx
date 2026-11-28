'use client';

import { ArrowRight, Check, Sparkles, Terminal } from 'lucide-react';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import { useRef, useState } from 'react';
import {
  CASE_STUDIES,
  CaseStudy,
  INDUSTRIES,
  LABS_PRODUCTS,
  STITCH_IMAGES,
  TESTIMONIALS,
  TestimonialItem,
} from '../data/rhinonData';
import { ResilientImage } from './ResilientImage';

interface LabsAndIndustriesProps {
  onNavigateContact: (presetTopic?: string, presetRequest?: string) => void;
  onSelectCase: (cs: CaseStudy) => void;
  onSelectTestimonial: (item: TestimonialItem) => void;
}

export function LabsAndIndustries({
  onNavigateContact,
  onSelectCase,
  onSelectTestimonial,
}: LabsAndIndustriesProps) {
  const [activeLabId, setActiveLabId] = useState('rhinonos');
  const [activeIndustryId, setActiveIndustryId] = useState('healthcare');
  const [showAllVoices, setShowAllVoices] = useState(false);

  const labsStageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: labsStageRef,
    offset: ['start end', 'center center'],
  });
  const labsScale = useTransform(scrollYProgress, [0, 1], [0.97, 1]);
  const labsY = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const badgeTopY = useTransform(scrollYProgress, [0, 1], [12, -6]);
  const badgeBottomY = useTransform(scrollYProgress, [0, 1], [-10, 6]);

  const activeLab = LABS_PRODUCTS.find((p) => p.id === activeLabId) ?? LABS_PRODUCTS[0];
  const activeIndustry = INDUSTRIES.find((i) => i.id === activeIndustryId) ?? INDUSTRIES[0];
  const visibleVoices = showAllVoices ? TESTIMONIALS : TESTIMONIALS.slice(0, 3);

  const handleOpenIndustryCase = () => {
    const found = CASE_STUDIES.find((c) => c.name === activeIndustry.linkedCaseName);
    if (found) {
      onSelectCase(found);
    } else {
      document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* RhinonLabs Labs — Dark Contrast Rounded Container */}
      <section id="labs" className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="rounded-[2rem] bg-[#121314] text-white p-6 sm:p-12 lg:p-14 overflow-hidden">
          <div className="max-w-2xl space-y-4 mb-8">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#FF6B35]">
              RhinonLabs Labs
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.08]">
              We ship our own AI products, not just yours
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Five production AI systems we built and operate ourselves—autonomous teammates you can
              @mention, delegate work to, and govern with the same senior team we bring to client
              builds.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="RhinonLabs Labs Products"
            className="flex flex-wrap gap-2 mb-8"
          >
            {LABS_PRODUCTS.map((lab) => {
              const isSelected = lab.id === activeLab.id;
              return (
                <button
                  key={lab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveLabId(lab.id)}
                  className={`relative px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'text-[#121314]'
                      : 'bg-[#1A1C1F] text-gray-300 border border-white/10 hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="labsTabPill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-white"
                    />
                  )}
                  <span className="relative z-10">{lab.label}</span>
                </button>
              );
            })}
          </div>

          <motion.div
            ref={labsStageRef}
            style={{ scale: labsScale, y: labsY }}
            className="p-6 sm:p-8 rounded-3xl bg-[#1A1C1F] border border-white/10"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-6 flex flex-col gap-5">
                  <div className="flex items-center gap-2 font-label text-xs uppercase">
                    <span className="text-[#FF6B35] font-semibold">{activeLab.badge1}</span>
                    <span aria-hidden="true" className="text-gray-500">
                      ·
                    </span>
                    <span className="text-[#9B87F5] font-semibold">{activeLab.badge2}</span>
                  </div>

                  <div>
                    <h3 className="font-display text-3xl font-bold text-white">{activeLab.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{activeLab.subtitle}</p>
                  </div>

                  <p className="text-base text-gray-300 leading-relaxed">{activeLab.desc}</p>

                  <div className="p-3.5 rounded-2xl bg-[#121314] border border-white/10 flex items-start gap-3">
                    <Terminal className="w-4 h-4 text-[#FF6B35] shrink-0 mt-1" aria-hidden="true" />
                    <code className="font-label text-xs sm:text-sm text-gray-200 leading-relaxed">
                      {activeLab.agentExample}
                    </code>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-300">
                    {activeLab.capabilities.map((cap) => (
                      <span key={cap} className="inline-flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-[#9B87F5] shrink-0" aria-hidden="true" />
                        <span>{cap}</span>
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="font-display text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                        {activeLab.s1}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{activeLab.l1}</p>
                    </div>
                    <div>
                      <p className="font-display text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                        {activeLab.s2}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{activeLab.l2}</p>
                    </div>
                    <div>
                      <p className="font-display text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                        {activeLab.s3}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{activeLab.l3}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateContact(
                          'AI or AI agents',
                          `Interested in exploring ${activeLab.title} for our organization.`
                        )
                      }
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#121314] hover:bg-gray-100 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>Explore {activeLab.title}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateContact(
                          'AI or AI agents',
                          `Requesting a live demo of ${activeLab.title}.`
                        )
                      }
                      className="px-6 py-3 rounded-full border border-white/15 text-white hover:bg-white/10 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Book a demo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextIdx =
                          (LABS_PRODUCTS.findIndex((p) => p.id === activeLab.id) + 1) %
                          LABS_PRODUCTS.length;
                        setActiveLabId(LABS_PRODUCTS[nextIdx].id);
                      }}
                      className="text-sm font-semibold text-[#9B87F5] hover:underline cursor-pointer whitespace-nowrap"
                    >
                      See next Labs product →
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6 relative">
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121314]">
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ResilientImage
                        src={activeLab.image}
                        alt={`${activeLab.title} sculptural 3D product art`}
                        className="w-full h-64 sm:h-80 lg:h-[400px] object-cover transition-transform duration-700 hover:scale-[1.03]"
                        fallbackTitle={activeLab.title}
                        fallbackSubtitle={activeLab.desc}
                        darkFallback
                      />
                    </motion.div>

                    <motion.div
                      aria-hidden="true"
                      animate={{ x: ['-100%', '220%'] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                      className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"
                    />

                    <div className="absolute top-3.5 right-3.5 px-3 py-1.5 rounded-full bg-[#121314]/80 backdrop-blur-md border border-white/15 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" aria-hidden="true" />
                      <img
                        src={STITCH_IMAGES.logoLight}
                        alt="RhinonLabs"
                        referrerPolicy="no-referrer"
                        className="h-3.5 w-auto object-contain opacity-95"
                      />
                    </div>
                  </div>

                  <motion.div
                    style={{ y: badgeTopY }}
                    className="hidden sm:flex absolute -top-3.5 left-3 px-4 py-2 rounded-full bg-[#121314] border border-white/20 shadow-2xl items-center gap-2.5"
                  >
                    <img
                      src={STITCH_IMAGES.logoLight}
                      alt="RhinonLabs Logo"
                      referrerPolicy="no-referrer"
                      className="h-4 w-auto object-contain shrink-0"
                    />
                    <span className="h-3.5 w-px bg-white/20" aria-hidden="true" />
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" aria-hidden="true" />
                    <span className="font-label text-[11px] uppercase tracking-wider text-white">
                      DELEGATE ANY TASK
                    </span>
                  </motion.div>

                  <motion.div
                    style={{ y: badgeBottomY }}
                    className="hidden sm:flex absolute -bottom-3.5 right-3 px-4 py-2 rounded-full bg-[#121314] border border-white/20 shadow-2xl items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#9B87F5] animate-pulse" aria-hidden="true" />
                    <span className="font-label text-[11px] uppercase tracking-wider text-[#9B87F5]">
                      INFINITE MEMORY
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-3xl space-y-3">
              <span className="font-label text-xs uppercase tracking-[0.14em] text-[#FF6A2B]">
                Industries
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.08] text-[#121314]">
                Proven in the sectors where precision matters
              </h2>
              <p className="text-lg text-[#535A61]">
                From patient records to high-throughput payments, we engineer platforms where
                security, scale, and compliance cannot slip.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onNavigateContact(
                  'New product or MVP',
                  'Inquiry across regulated industry product engineering.'
                )
              }
              className="self-start md:self-auto text-sm font-semibold text-[#121314] hover:text-[#FF6A2B] cursor-pointer whitespace-nowrap"
            >
              All industries →
            </button>
          </div>

          <div role="tablist" aria-label="Industries" className="flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => {
              const isSelected = ind.id === activeIndustry.id;
              return (
                <button
                  key={ind.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveIndustryId(ind.id)}
                  className={`relative px-5 py-2.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'text-white'
                      : 'bg-[#F4F5F7] text-[#535A61] hover:text-[#121314]'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="industryTabPill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-[#121314]"
                    />
                  )}
                  <span className="relative z-10">{ind.label}</span>
                </button>
              );
            })}
          </div>

          <div className="metamask-card-glow p-7 sm:p-10 rounded-3xl border border-gray-200/80">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndustry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <h3 className="font-display text-3xl font-bold text-[#121314]">
                    {activeIndustry.title}
                  </h3>
                  <p className="text-base sm:text-lg text-[#535A61] leading-relaxed">
                    {activeIndustry.desc}
                  </p>
                  <p className="text-sm sm:text-base text-[#121314] font-semibold">
                    {activeIndustry.cs}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateContact(
                          'New product or MVP',
                          `Exploring a ${activeIndustry.title} build.`
                        )
                      }
                      className="px-6 py-3 rounded-full bg-[#121314] hover:bg-[#2A2D30] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Explore {activeIndustry.title}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenIndustryCase}
                      className="text-sm font-semibold text-[#121314] hover:text-[#FF6A2B] cursor-pointer"
                    >
                      Read the {activeIndustry.linkedCaseName ?? activeIndustry.title} case study →
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className="p-6 rounded-2xl bg-white border border-gray-200/80">
                    <p className="font-display text-3xl font-extrabold text-[#121314] tabular-nums">
                      {activeIndustry.m1}
                    </p>
                    <p className="text-sm text-[#535A61] mt-1">{activeIndustry.l1}</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white border border-gray-200/80">
                    <p className="font-display text-3xl font-extrabold text-[#FF6A2B] tabular-nums">
                      {activeIndustry.m2}
                    </p>
                    <p className="text-sm text-[#535A61] mt-1">{activeIndustry.l2}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Client Voices */}
      <section id="voices" className="bg-[#F4F5F7] py-14 sm:py-20 border-y border-gray-200/70">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col gap-10">
          <div className="max-w-3xl space-y-2">
            <span className="font-label text-xs uppercase tracking-[0.14em] text-[#FF6A2B]">
              Client voices
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.08] text-[#121314]">
              What clients say after the build
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {visibleVoices.map((voice, idx) => (
              <motion.article
                key={voice.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: (idx % 3) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="p-7 rounded-3xl bg-white border border-gray-200/80 flex flex-col justify-between gap-5"
              >
                <p className="text-sm sm:text-base text-[#535A61] leading-relaxed">
                  &ldquo;{voice.quote}&rdquo;
                </p>
                <footer className="pt-4 border-t border-gray-100 flex flex-col gap-1">
                  <span className="font-display text-base font-bold text-[#121314]">
                    {voice.author}
                  </span>
                  <span className="text-xs text-[#6B7280]">{voice.role}</span>
                  <div className="flex flex-wrap items-center gap-4 pt-2 font-label text-xs text-[#121314]">
                    {voice.links.map((lnk) => (
                      <button
                        key={lnk.label}
                        type="button"
                        onClick={() => {
                          if (lnk.action === 'case' && lnk.target) {
                            const found = CASE_STUDIES.find((c) => c.name === lnk.target);
                            if (found) {
                              onSelectCase(found);
                              return;
                            }
                          }
                          onSelectTestimonial(voice);
                        }}
                        className="hover:text-[#FF6A2B] font-semibold cursor-pointer"
                      >
                        {lnk.label}
                      </button>
                    ))}
                  </div>
                </footer>
              </motion.article>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              id="toggle-voices-btn"
              type="button"
              onClick={() => setShowAllVoices((prev) => !prev)}
              className="px-7 py-3 rounded-full border border-gray-200 bg-white text-[#121314] text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {showAllVoices ? 'Show Less' : 'Show More Client Stories'}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
