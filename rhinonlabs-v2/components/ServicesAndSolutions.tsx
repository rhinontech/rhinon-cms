'use client';

import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Bot,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GitBranch,
  Globe,
  HeartPulse,
  KeyRound,
  Rocket,
  Scale,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  UserPlus,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react';
import { useRef, useState } from 'react';
import {
  AUTOMATION_SOLUTIONS,
  BENTO_SERVICES,
  SERVICES,
  WHY_PILLARS,
} from '../data/rhinonData';
import { ResilientImage } from './ResilientImage';

interface ServicesAndSolutionsProps {
  onNavigateContact: (presetTopic?: string, presetRequest?: string) => void;
}

function BentoIcon({ name }: { name: 'bot' | 'smartphone' | 'globe' | 'rocket' }) {
  switch (name) {
    case 'bot':
      return <Bot className="w-6 h-6 text-[#FF6B35]" aria-hidden="true" />;
    case 'smartphone':
      return <Smartphone className="w-6 h-6 text-[#9B87F5]" aria-hidden="true" />;
    case 'globe':
      return <Globe className="w-6 h-6 text-[#FF6B35]" aria-hidden="true" />;
    default:
      return <Rocket className="w-6 h-6 text-[#9B87F5]" aria-hidden="true" />;
  }
}

function ValueIcon({ name }: { name: 'bolt' | 'shield' | 'key' | 'users' }) {
  switch (name) {
    case 'bolt':
      return <Zap className="w-6 h-6 text-[#FF6B35]" aria-hidden="true" />;
    case 'shield':
      return <ShieldCheck className="w-6 h-6 text-[#9B87F5]" aria-hidden="true" />;
    case 'key':
      return <KeyRound className="w-6 h-6 text-[#FF6B35]" aria-hidden="true" />;
    default:
      return <Users className="w-6 h-6 text-[#9B87F5]" aria-hidden="true" />;
  }
}

function ServiceIcon({ name, className }: { name: string; className: string }) {
  switch (name) {
    case 'brain':
      return <Brain className={className} aria-hidden="true" />;
    case 'bot':
      return <Bot className={className} aria-hidden="true" />;
    case 'smartphone':
      return <Smartphone className={className} aria-hidden="true" />;
    case 'globe':
      return <Globe className={className} aria-hidden="true" />;
    case 'rocket':
      return <Rocket className={className} aria-hidden="true" />;
    default:
      return <UserPlus className={className} aria-hidden="true" />;
  }
}

function SolutionIcon({ name, className }: { name: string; className: string }) {
  switch (name) {
    case 'gitBranch':
      return <GitBranch className={className} aria-hidden="true" />;
    case 'workflow':
      return <Workflow className={className} aria-hidden="true" />;
    case 'fileText':
      return <FileText className={className} aria-hidden="true" />;
    case 'audioLines':
      return <AudioLines className={className} aria-hidden="true" />;
    case 'stethoscope':
      return <Stethoscope className={className} aria-hidden="true" />;
    case 'clipboardCheck':
      return <ClipboardCheck className={className} aria-hidden="true" />;
    case 'scale':
      return <Scale className={className} aria-hidden="true" />;
    default:
      return <HeartPulse className={className} aria-hidden="true" />;
  }
}

export function ServicesAndSolutions({ onNavigateContact }: ServicesAndSolutionsProps) {
  const [selectedSolId, setSelectedSolId] = useState(AUTOMATION_SOLUTIONS[0].id);
  const activeSol =
    AUTOMATION_SOLUTIONS.find((s) => s.id === selectedSolId) ?? AUTOMATION_SOLUTIONS[0];

  const solutionsStageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: solutionsStageRef,
    offset: ['start end', 'center center'],
  });
  const stageScale = useTransform(scrollYProgress, [0, 1], [0.97, 1]);

  return (
    <>
      {/* Core Capabilities — 2x2 Bento Grid matching MetaMask Section 2 */}
      <section id="services" className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-4"
        >
          <span className="font-label text-xs uppercase tracking-[0.14em] text-[#FF6A2B]">
            What we build
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.08] text-[#121314]">
            Your complete product <br />
            &amp; AI engineering partner
          </h2>
          <p className="text-lg text-[#535A61]">
            Senior-only engineering pods delivering autonomous AI agents, mobile apps, and scalable
            web platforms—with a fixed price and 100% IP ownership.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {BENTO_SERVICES.map((card, idx) => (
            <motion.button
              key={card.id}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: (idx % 2) * 0.08, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onNavigateContact(card.formOption, `Interested in ${card.title}: `)}
              className="text-left metamask-card-glow rounded-3xl p-8 sm:p-10 border border-gray-200/80 hover:border-[#FF6A2B]/50 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200/70 shadow-sm flex items-center justify-center">
                    <BentoIcon name={card.iconName} />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#121314] group-hover:text-[#FF6A2B] transition-colors">
                    <span>{card.ctaLabel}</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#121314] mb-3">
                  {card.title}
                </h3>
                <p className="text-[#535A61] text-base leading-relaxed mb-8">{card.desc}</p>
              </div>

              <div
                className={`relative rounded-2xl overflow-hidden border border-gray-200/70 ${card.imageBg}`}
              >
                <motion.div
                  animate={{ scale: [1, 1.025, 1] }}
                  transition={{ duration: 6 + idx, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ResilientImage
                    src={card.image}
                    alt={`${card.title} 3D illustration`}
                    className={`w-full h-56 sm:h-64 ${card.imageFit} transition-transform duration-500 group-hover:scale-[1.03]`}
                    fallbackTitle={card.title}
                  />
                </motion.div>
                <motion.div
                  aria-hidden="true"
                  animate={{ x: ['-120%', '220%'] }}
                  transition={{
                    duration: 3.8 + idx * 0.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    repeatDelay: 1.8,
                  }}
                  className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[-20deg]"
                />
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-sm flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full bg-[#FF6A2B] animate-pulse"
                    aria-hidden="true"
                  />
                  <span className="font-label text-[11px] uppercase tracking-wider text-[#121314] font-semibold">
                    {idx === 0
                      ? 'Agentic Pipeline'
                      : idx === 1
                        ? 'Native 60 FPS'
                        : idx === 2
                          ? 'Cloud Auto-Scale'
                          : 'Day-4 First PR'}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* All 6 Engineering Services Quick Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-8">
          {SERVICES.map((service) => (
            <button
              key={service.title}
              type="button"
              onClick={() =>
                onNavigateContact(service.formOption, `Interested in ${service.title}: `)
              }
              className="text-left p-6 rounded-3xl bg-white border border-gray-200/80 hover:border-[#121314] transition-colors flex flex-col justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center justify-between w-full">
                <ServiceIcon
                  name={service.iconName}
                  className="w-5 h-5 text-[#121314] group-hover:text-[#FF6A2B] transition-colors"
                />
                <ArrowUpRight className="w-4 h-4 text-[#535A61]" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#121314]">{service.title}</h3>
              <p className="text-sm text-[#535A61] leading-relaxed">{service.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Why RhinonLabs — 4-Column Pillar Strip */}
      <section id="why-us" className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="max-w-2xl mb-8 space-y-3">
          <span className="font-label text-xs uppercase tracking-[0.14em] text-[#FF6A2B]">
            Why RhinonLabs
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-[#121314]">
            Engineering that ships in weeks, not quarters
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHY_PILLARS.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-3xl p-7 bg-[#F4F5F7] border border-gray-200/60"
            >
              <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200/70 shadow-sm flex items-center justify-center mb-5">
                <ValueIcon name={item.iconName} />
              </div>
              <h3 className="font-display text-lg font-bold text-[#121314] mb-2">{item.title}</h3>
              <p className="text-[#535A61] text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Dark Contrast AI Agents Showcase Block (MetaMask rounded-[2rem] bg-[#121314]) */}
      <section id="solutions" className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="rounded-[2rem] bg-[#121314] text-white p-6 sm:p-12 lg:p-14 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl space-y-4">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#FF6B35]">
                AI solutions, ready to deploy
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.08]">
                Hand repetitive work to AI agents you can trust
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Custom AI automation built directly into your CRM, ERP, and clinical documents. A
                human approves every write, and you own the code, prompts, and data.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 font-label text-xs uppercase tracking-wider text-gray-400">
              <span>CRM</span>
              <span aria-hidden="true">·</span>
              <span>ERP</span>
              <span aria-hidden="true">·</span>
              <span>EHR</span>
              <span aria-hidden="true">·</span>
              <span>Documents</span>
            </div>
          </div>

          <motion.div
            ref={solutionsStageRef}
            style={{ scale: stageScale }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            <div
              role="tablist"
              aria-label="AI Automation Solutions"
              className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5"
            >
              {AUTOMATION_SOLUTIONS.map((sol) => {
                const isSelected = sol.id === activeSol.id;
                return (
                  <button
                    key={sol.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedSolId(sol.id)}
                    className={`text-left px-4 py-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E2024] border-[#FF6B35]/60 text-white'
                        : 'bg-[#1A1C1F] border-white/10 text-gray-300 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <SolutionIcon
                        name={sol.iconName}
                        className={`w-5 h-5 shrink-0 ${
                          isSelected ? 'text-[#FF6B35]' : 'text-[#9B87F5]'
                        }`}
                      />
                      <span className="text-sm font-semibold truncate">{sol.label}</span>
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-[#FF6B35] translate-x-0.5' : 'text-gray-500'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7 rounded-3xl bg-[#1A1C1F] border border-white/10 p-5 sm:p-7 flex flex-col justify-between gap-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSol.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-5"
                >
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#121314]">
                    <ResilientImage
                      src={activeSol.image}
                      alt={`${activeSol.label} 3D visual`}
                      className="w-full h-56 sm:h-68 object-cover"
                      fallbackTitle={activeSol.label}
                      fallbackSubtitle={activeSol.tagline}
                      darkFallback
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121314] via-[#121314]/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                      <div>
                        <span className="font-label text-xs uppercase tracking-wider text-[#FF6B35]">
                          Autonomous Agent Pipeline
                        </span>
                        <h3 className="font-display text-2xl font-bold text-white mt-0.5">
                          {activeSol.label}
                        </h3>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#9B87F5] tabular-nums leading-none">
                          {activeSol.outcomeStat}
                        </p>
                        <p className="text-xs text-gray-300 mt-1">{activeSol.outcomeLabel}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-base text-gray-300">{activeSol.tagline}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-[#121314] border border-white/10">
                      <span className="font-label text-[11px] uppercase tracking-wider text-gray-400">
                        01. Trigger
                      </span>
                      <p className="text-sm text-white mt-1">{activeSol.trigger}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#121314] border border-[#9B87F5]/40">
                      <span className="font-label text-[11px] uppercase tracking-wider text-[#9B87F5]">
                        02. Agent Action
                      </span>
                      <p className="text-sm text-white mt-1">{activeSol.agentAction}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#121314] border border-[#FF6B35]/40">
                      <span className="font-label text-[11px] uppercase tracking-wider text-[#FF6B35] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        03. Human Gate
                      </span>
                      <p className="text-sm text-white mt-1">{activeSol.humanGate}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                    <span className="text-sm text-gray-400">
                      Zero vendor lock-in · Deployed in your private cloud
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateContact(
                          'AI or AI agents',
                          `Looking to deploy ${activeSol.label} inside our workflows.`
                        )
                      }
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#121314] hover:bg-gray-100 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>Deploy {activeSol.label}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Discovery Callout Strip */}
          <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-[#1A1C1F] border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <span className="font-label text-xs uppercase tracking-wider text-[#9B87F5]">
                AI AUTOMATION DISCOVERY
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Not sure where to start? Find your best use cases in weeks.
              </h3>
              <p className="text-base text-gray-400">
                30 to 70% less time and cost on automated work in year one. That is the target we
                plan against.
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  onNavigateContact(
                    'AI or AI agents',
                    'Requesting an AI Automation Discovery Call to identify highest-ROI agent workflows.'
                  )
                }
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-white text-[#121314] hover:bg-gray-100 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Book A Discovery Call</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <p className="text-xs text-gray-400">
                Free 30-minute call first. NDA before you share anything.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
