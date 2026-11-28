'use client';

import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { CASE_STUDIES, CaseStudy, VELOCITY_STEPS } from '../data/rhinonData';

interface ProcessAndCasesProps {
  onOpenEstimator: () => void;
  onOpenAllCases: () => void;
  onSelectCase: (cs: CaseStudy) => void;
}

export function ProcessAndCases({
  onOpenEstimator,
  onOpenAllCases,
  onSelectCase,
}: ProcessAndCasesProps) {
  const [caseIdx, setCaseIdx] = useState(0);

  const visibleCases = [
    CASE_STUDIES[caseIdx % CASE_STUDIES.length],
    CASE_STUDIES[(caseIdx + 1) % CASE_STUDIES.length],
    CASE_STUDIES[(caseIdx + 2) % CASE_STUDIES.length],
  ];

  const handlePrev = () => {
    setCaseIdx((prev) => (prev - 1 + CASE_STUDIES.length) % CASE_STUDIES.length);
  };

  const handleNext = () => {
    setCaseIdx((prev) => (prev + 1) % CASE_STUDIES.length);
  };

  return (
    <>
      <section id="process" className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div className="flex flex-col gap-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl space-y-3"
          >
            <span className="font-label text-xs uppercase tracking-[0.14em] text-[#FF6A2B]">
              How we deliver
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.08] text-[#121314]">
              AI Velocity Pods: Pay for outcomes, not hours
            </h2>
            <p className="text-lg text-[#535A61] leading-relaxed">
              AI writes the first draft, senior engineers review and own every line, and tests run
              on every commit. You know the full price before we start.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {VELOCITY_STEPS.map((step, idx) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="p-7 rounded-3xl bg-[#F4F5F7] border border-gray-200/70 flex flex-col gap-3"
              >
                <span className="font-label text-xs uppercase tracking-wider text-[#FF6A2B] tabular-nums">
                  {step.step}
                </span>
                <h3 className="font-display text-xl font-bold text-[#121314]">{step.title}</h3>
                <p className="text-sm text-[#535A61] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onOpenEstimator}
              className="bg-[#121314] hover:bg-[#2A2D30] text-white font-semibold text-sm px-6 py-3 rounded-full transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <span>Estimate an AI build in two minutes</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onOpenEstimator}
              className="bg-[#F4F5F7] hover:bg-gray-200/80 text-[#121314] font-semibold text-sm px-6 py-3 rounded-full transition-colors cursor-pointer"
            >
              How AI Velocity Pods work
            </button>
          </div>
        </div>
      </section>

      <section id="work" className="bg-[#F4F5F7] py-14 sm:py-20 border-y border-gray-200/70">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <span className="font-label text-xs uppercase tracking-[0.14em] text-[#FF6A2B]">
                Our work
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] leading-[1.08] text-[#121314]">
                Products we built, launched and still support
              </h2>
              <p className="text-lg text-[#535A61]">
                Each case study shows the problem, what we built, and the results—with figures
                reported by each client.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span
                id="case-counter"
                className="font-label text-sm font-semibold text-[#121314] tabular-nums mr-1"
              >
                {caseIdx + 1} / {CASE_STUDIES.length}
              </span>
              <button
                id="case-prev"
                type="button"
                onClick={handlePrev}
                aria-label="Previous case studies"
                className="w-11 h-11 rounded-full border border-gray-200 bg-white text-[#121314] hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                id="case-next"
                type="button"
                onClick={handleNext}
                aria-label="Next case studies"
                className="w-11 h-11 rounded-full border border-gray-200 bg-white text-[#121314] hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors"
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onOpenAllCases}
                className="bg-[#121314] hover:bg-[#2A2D30] text-white text-sm font-semibold px-5 py-3 rounded-full ml-1 cursor-pointer whitespace-nowrap transition-colors"
              >
                All 13 case studies
              </button>
            </div>
          </div>

          <div
            id="case-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
          >
            {visibleCases.map((c, idx) => (
              <motion.article
                key={`${c.name}-${caseIdx}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => onSelectCase(c)}
                className={`h-full p-7 rounded-3xl bg-white border border-gray-200/80 hover:border-[#FF6A2B]/60 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between gap-5 cursor-pointer ${
                  idx === 2 ? 'hidden lg:flex' : ''
                }`}
              >
                <div className="space-y-2">
                  <span className="font-label text-xs uppercase tracking-wider text-[#FF6A2B]">
                    {c.cat}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-[#121314]">{c.name}</h3>
                  <p className="text-sm text-[#535A61] leading-relaxed">{c.desc}</p>
                </div>
                <div className="flex flex-col gap-1.5 pt-4 border-t border-gray-100 text-sm font-semibold text-[#121314] tabular-nums">
                  <span>{c.m1}</span>
                  <span>{c.m2}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-label text-[#6B7280]">{c.tags}</span>
                  <span className="font-semibold text-[#121314]">Read details →</span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
