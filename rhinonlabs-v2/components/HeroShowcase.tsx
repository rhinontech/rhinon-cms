'use client';

import { ArrowUpRight, Check, Cloud, CloudCog, Cpu } from 'lucide-react';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import { useRef, useState } from 'react';
import { GENERATED_IMAGES, IMPACT_TICKER, SHOWCASE_ITEMS } from '../data/rhinonData';
import { ResilientImage } from './ResilientImage';

interface HeroShowcaseProps {
  onNavigateContact: (presetTopic?: string) => void;
}

export function HeroShowcase({ onNavigateContact }: HeroShowcaseProps) {
  const [activeId, setActiveId] = useState<string>('rhinonos');
  const activeItem = SHOWCASE_ITEMS.find((item) => item.id === activeId) ?? SHOWCASE_ITEMS[0];

  const showcaseRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: showcaseRef,
    offset: ['start end', 'center center'],
  });
  const cardScale = useTransform(scrollYProgress, [0, 1], [0.97, 1]);
  const cardY = useTransform(scrollYProgress, [0, 1], [20, 0]);

  return (
    <>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-14">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="font-label text-xs uppercase tracking-[0.14em] text-[#535A61]"
            >
              Trusted by startups &amp; enterprises across 22+ countries
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-5xl sm:text-6xl xl:text-[4.25rem] font-extrabold tracking-[-0.035em] leading-[1.03] text-[#121314]"
            >
              AI-native engineering. <br />
              Ship in weeks.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg sm:text-xl text-[#535A61] max-w-xl leading-relaxed"
            >
              We design, build, and run autonomous AI agents, mobile apps, and web platforms across
              the USA, UK, UAE, and India. Fixed scope, fixed price, and 100% IP ownership.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-3.5 pt-2"
            >
              <button
                type="button"
                onClick={() => onNavigateContact()}
                className="bg-[#121314] hover:bg-[#2A2D30] text-white font-semibold px-7 py-4 rounded-full text-base transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Book A 30-Minute Call</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <a
                href="#work"
                className="bg-[#F4F5F7] hover:bg-gray-200/80 text-[#121314] font-semibold px-7 py-4 rounded-full text-base transition-colors"
              >
                Explore 13 Case Studies
              </a>
            </motion.div>

            <p className="text-sm text-[#6B7280]">
              Senior architect replies within 12 hours. NDA first if you prefer.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative"
          >
            <div className="metamask-gradient rounded-[2rem] p-3 sm:p-4 shadow-sm">
              <div className="overflow-hidden rounded-[1.5rem] bg-white">
                <ResilientImage
                  src={GENERATED_IMAGES.coralHero}
                  alt="RhinonLabs 3D AI-native engineering sculptural centerpiece"
                  className="w-full h-[300px] sm:h-[400px] lg:h-[440px] object-cover"
                  fallbackTitle="RhinonLabs AI Engineering"
                  fallbackSubtitle="Autonomous AI Agents · Mobile Apps · Web Platforms"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Live Horizontal Production Impact Ticker Strip */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            {IMPACT_TICKER.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 bg-[#F4F5F7] hover:bg-gray-200/70 transition-colors rounded-full pl-3 pr-5 py-2.5 shrink-0"
              >
                <div className="w-8 h-8 rounded-full metamask-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {item.name[0]}
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-[#121314]">{item.name}</span>
                  <span className="text-[#535A61] ml-1.5 text-xs">{item.tag}</span>
                </div>
                <div className="text-sm font-semibold ml-2 text-[#121314] tabular-nums">
                  {item.stat}{' '}
                  <span className="text-[#FF6A2B] ml-1 font-medium">{item.delta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Product & Client Showcase Frame */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-16">
        <div ref={showcaseRef} className="flex flex-col items-center gap-6">
          <div
            role="tablist"
            aria-label="Built by RhinonLabs showcase"
            className="flex flex-wrap justify-center gap-2"
          >
            {SHOWCASE_ITEMS.map((item) => {
              const isSelected = item.id === activeItem.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveId(item.id)}
                  className={`relative px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'text-white'
                      : 'bg-[#F4F5F7] text-[#535A61] hover:text-[#121314]'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="heroShowcasePill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-[#121314]"
                    />
                  )}
                  <span className="relative z-10">{item.pillLabel}</span>
                </button>
              );
            })}
          </div>

          <motion.div
            style={{ scale: cardScale, y: cardY }}
            className="w-full metamask-card-glow rounded-3xl border border-gray-200/80 p-6 sm:p-10"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left"
              >
                <div className="lg:col-span-5 flex flex-col justify-between gap-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-label">
                      <span className="uppercase text-[#FF6A2B] font-semibold">
                        {activeItem.tag}
                      </span>
                      <span aria-hidden="true" className="text-[#535A61]">
                        ·
                      </span>
                      <span className="text-[#535A61] uppercase">BUILT BY RHINONLABS</span>
                    </div>

                    <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.025em] text-[#121314]">
                      {activeItem.title}
                    </h2>

                    <p className="text-base text-[#535A61] leading-relaxed">{activeItem.desc}</p>

                    <ul className="flex flex-col gap-2 text-sm text-[#121314] pt-1">
                      {activeItem.highlights.map((hl) => (
                        <li key={hl} className="flex items-center gap-2.5">
                          <Check className="w-4 h-4 text-[#FF6A2B] shrink-0" aria-hidden="true" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-5 border-t border-gray-200/80">
                    <div>
                      <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#121314] tabular-nums">
                        {activeItem.s1}
                      </p>
                      <p className="text-sm text-[#535A61] mt-0.5">{activeItem.l1}</p>
                    </div>
                    <div>
                      <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#121314] tabular-nums">
                        {activeItem.s2}
                      </p>
                      <p className="text-sm text-[#535A61] mt-0.5">{activeItem.l2}</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 overflow-hidden rounded-2xl border border-gray-200/80 bg-white">
                  <ResilientImage
                    src={activeItem.image}
                    alt={`${activeItem.title} 3D architectural visualization`}
                    className="w-full h-64 sm:h-80 lg:h-[380px] object-cover transition-transform duration-500 hover:scale-[1.03]"
                    fallbackTitle={activeItem.title}
                    fallbackSubtitle={activeItem.desc}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div className="w-full pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm font-medium text-[#535A61]">
            <span className="font-label text-xs uppercase tracking-wider text-[#6B7280]">
              Cloud &amp; AI Partners
            </span>
            <div className="flex items-center gap-2 text-[#121314] font-semibold">
              <Cloud className="w-4 h-4 text-[#9B87F5]" aria-hidden="true" />
              <span>Microsoft Azure</span>
            </div>
            <div className="flex items-center gap-2 text-[#121314] font-semibold">
              <Cpu className="w-4 h-4 text-[#FF6A2B]" aria-hidden="true" />
              <span>AWS Partner Network</span>
            </div>
            <div className="flex items-center gap-2 text-[#121314] font-semibold">
              <CloudCog className="w-4 h-4 text-[#9B87F5]" aria-hidden="true" />
              <span>Google Cloud</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
