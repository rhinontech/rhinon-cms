'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CASE_STUDIES,
  CaseStudy,
  PRESS_COVERAGE,
  SECURITY_PILLARS,
  TestimonialItem,
} from '../data/rhinonData';

interface ModalWrapperProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function ModalWrapper({ open, onClose, title, subtitle, children }: ModalWrapperProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl bg-white border border-gray-200/80 shadow-2xl p-6 sm:p-8 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border-subtle">
          <div>
            {subtitle && (
              <span className="font-label text-label-md uppercase text-light-primary block mb-1">
                {subtitle}
              </span>
            )}
            <h3 className="font-headline text-headline-sm md:text-headline-md text-ink-primary">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-9 h-9 rounded-full border border-border-subtle flex items-center justify-center text-ink-primary hover:bg-off-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface EstimatorModalProps {
  open: boolean;
  onClose: () => void;
  onApplyEstimate: (topic: string, summary: string) => void;
}

export function EstimatorModal({ open, onClose, onApplyEstimate }: EstimatorModalProps) {
  const [buildType, setBuildType] = useState<
    'AI or AI agents' | 'New product or MVP' | 'Mobile app' | 'Web app or platform'
  >('AI or AI agents');
  const [scope, setScope] = useState<
    'Focused MVP (4–6 weeks)' | 'Production Platform (8–12 weeks)' | 'Enterprise Scale (12+ weeks)'
  >('Focused MVP (4–6 weeks)');
  const [compliance, setCompliance] = useState<
    'Standard SOC 2 Controls' | 'HIPAA / Clinical BAA' | 'PCI-DSS / Financial'
  >('Standard SOC 2 Controls');

  const estimateMap = {
    'Focused MVP (4–6 weeks)': {
      price: '$18,000 – $32,000',
      pod: '1 Senior Architect + 2 Senior Engineers',
      commit: 'Day 5',
    },
    'Production Platform (8–12 weeks)': {
      price: '$38,000 – $65,000',
      pod: '1 Senior Architect + 3 Senior Engineers + QA',
      commit: 'Day 5',
    },
    'Enterprise Scale (12+ weeks)': {
      price: '$75,000+',
      pod: 'Dedicated AI Velocity Pod (4–6 Seniors)',
      commit: 'Day 5',
    },
  };
  const activeEst = estimateMap[scope];

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      subtitle="AI Velocity Pods"
      title="2-Minute Outcome & Fixed-Price Estimator"
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className="font-body text-label-lg text-ink-primary mb-2">1. What are you building?</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              ['AI or AI agents', 'New product or MVP', 'Mobile app', 'Web app or platform'] as const
            ).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setBuildType(opt)}
                className={`p-3 rounded-lg border text-left font-body text-body-sm transition-colors cursor-pointer ${
                  buildType === opt
                    ? 'bg-ink-primary text-light-on-primary border-ink-primary'
                    : 'bg-off-white text-ink-primary border-border-subtle hover:border-light-primary'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-body text-label-lg text-ink-primary mb-2">2. Target milestone</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                'Focused MVP (4–6 weeks)',
                'Production Platform (8–12 weeks)',
                'Enterprise Scale (12+ weeks)',
              ] as const
            ).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setScope(opt)}
                className={`p-3 rounded-lg border text-left font-body text-body-sm transition-colors cursor-pointer ${
                  scope === opt
                    ? 'bg-ink-primary text-light-on-primary border-ink-primary'
                    : 'bg-off-white text-ink-primary border-border-subtle hover:border-light-primary'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-body text-label-lg text-ink-primary mb-2">
            3. Security &amp; compliance baseline
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                'Standard SOC 2 Controls',
                'HIPAA / Clinical BAA',
                'PCI-DSS / Financial',
              ] as const
            ).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setCompliance(opt)}
                className={`p-3 rounded-lg border text-left font-body text-body-sm transition-colors cursor-pointer ${
                  compliance === opt
                    ? 'bg-ink-primary text-light-on-primary border-ink-primary'
                    : 'bg-off-white text-ink-primary border-border-subtle hover:border-light-primary'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-off-white border border-border-subtle grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="font-label text-label-sm uppercase text-light-outline">
              Indicative Fixed Price
            </span>
            <p className="font-headline text-title-lg text-light-primary tabular-nums mt-0.5">
              {activeEst.price}
            </p>
          </div>
          <div>
            <span className="font-label text-label-sm uppercase text-light-outline">
              Pod Composition
            </span>
            <p className="font-body text-body-sm text-ink-primary mt-0.5">{activeEst.pod}</p>
          </div>
          <div>
            <span className="font-label text-label-sm uppercase text-light-outline">
              First Production Commit
            </span>
            <p className="font-headline text-title-lg text-ink-primary tabular-nums mt-0.5">
              {activeEst.commit}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <span className="font-body text-body-sm text-ink-secondary">
            100% IP ownership · Named senior architect · Agentic QA on every commit
          </span>
          <button
            type="button"
            onClick={() => {
              onApplyEstimate(
                buildType,
                `Velocity Pod Estimate: ${buildType} · ${scope} · ${compliance} (Indicative range: ${activeEst.price}).`
              );
              onClose();
            }}
            className="px-6 py-3 rounded-full bg-[#121314] text-white font-body text-label-lg hover:bg-[#2A2D30] transition-colors cursor-pointer whitespace-nowrap"
          >
            Lock Scope on a 30-Min Call →
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

interface CaseStudyModalProps {
  selectedCase: CaseStudy | null;
  showAll: boolean;
  onClose: () => void;
  onSelectCase: (cs: CaseStudy) => void;
  onNavigateContact: (topic?: string, request?: string) => void;
}

export function CaseStudyModal({
  selectedCase,
  showAll,
  onClose,
  onSelectCase,
  onNavigateContact,
}: CaseStudyModalProps) {
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const sectors = ['All', 'AI', 'Healthcare', 'Fintech', 'Ecommerce', 'Logistics', 'EdTech'];

  const filtered =
    sectorFilter === 'All'
      ? CASE_STUDIES
      : CASE_STUDIES.filter((c) => c.sector === sectorFilter);

  if (selectedCase) {
    return (
      <ModalWrapper
        open={true}
        onClose={onClose}
        subtitle={selectedCase.cat}
        title={selectedCase.name}
      >
        <div className="flex flex-col gap-5">
          <p className="font-body text-body-lg text-ink-secondary">{selectedCase.desc}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-off-white border border-border-subtle">
              <span className="font-label text-label-sm uppercase text-light-outline">
                Reported Impact
              </span>
              <p className="font-headline text-title-lg text-ink-primary mt-1 tabular-nums">
                {selectedCase.m1}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-off-white border border-border-subtle">
              <span className="font-label text-label-sm uppercase text-light-outline">
                Scale &amp; Reach
              </span>
              <p className="font-headline text-title-lg text-ink-primary mt-1 tabular-nums">
                {selectedCase.m2}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <h4 className="font-headline text-title-md text-ink-primary">The Problem</h4>
              <p className="font-body text-body-md text-ink-secondary mt-1">
                {selectedCase.problem}
              </p>
            </div>
            <div>
              <h4 className="font-headline text-title-md text-ink-primary">
                What RhinonLabs Built
              </h4>
              <p className="font-body text-body-md text-ink-secondary mt-1">
                {selectedCase.built}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border-subtle">
            <span className="font-label text-label-sm text-light-outline">{selectedCase.tags}</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateContact(
                  'New product or MVP',
                  `Building a platform similar to ${selectedCase.name} (${selectedCase.cat}).`
                );
              }}
              className="px-6 py-2.5 rounded-full bg-[#121314] text-white font-body text-label-lg hover:bg-[#2A2D30] transition-colors cursor-pointer"
            >
              Build Something Similar →
            </button>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper
      open={showAll}
      onClose={onClose}
      subtitle="Portfolio · 13 Shipped Products"
      title="All Case Studies"
    >
      <div className="flex flex-wrap gap-2">
        {sectors.map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => setSectorFilter(sec)}
            className={`px-3.5 py-1.5 rounded-full font-body text-label-sm transition-colors cursor-pointer ${
              sectorFilter === sec
                ? 'bg-ink-primary text-light-on-primary'
                : 'bg-off-white text-ink-secondary border border-border-subtle hover:text-ink-primary'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => onSelectCase(c)}
            className="text-left p-4 rounded-lg bg-off-white border border-border-subtle hover:border-brand-violet transition-colors flex flex-col justify-between gap-3 cursor-pointer"
          >
            <div>
              <span className="font-label text-label-sm uppercase text-light-primary">{c.cat}</span>
              <h4 className="font-headline text-title-md text-ink-primary mt-0.5">{c.name}</h4>
              <p className="font-body text-body-sm text-ink-secondary mt-1">{c.desc}</p>
            </div>
            <div className="pt-2 border-t border-border-subtle font-body text-body-sm text-ink-primary tabular-nums flex flex-col gap-0.5">
              <span>{c.m1}</span>
              <span>{c.m2}</span>
            </div>
          </button>
        ))}
      </div>
    </ModalWrapper>
  );
}

interface TestimonialModalProps {
  testimonial: TestimonialItem | null;
  onClose: () => void;
  onNavigateContact: (topic?: string, request?: string) => void;
}

export function TestimonialModal({
  testimonial,
  onClose,
  onNavigateContact,
}: TestimonialModalProps) {
  if (!testimonial) return null;

  return (
    <ModalWrapper
      open={true}
      onClose={onClose}
      subtitle="Client Reference"
      title={testimonial.author}
    >
      <div className="flex flex-col gap-4">
        <p className="font-body text-body-sm text-light-outline">{testimonial.role}</p>
        <blockquote className="p-5 rounded-lg bg-off-white border border-border-subtle font-body text-body-lg text-ink-primary">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>
        <div>
          <h4 className="font-headline text-title-md text-ink-primary">Engagement Context</h4>
          <p className="font-body text-body-md text-ink-secondary mt-1">{testimonial.fullStory}</p>
        </div>
        <div className="p-4 rounded-lg bg-light-surface-container border border-border-subtle">
          <span className="font-label text-label-sm uppercase text-light-primary">
            Verified Outcome
          </span>
          <p className="font-body text-body-md text-ink-primary mt-0.5">{testimonial.outcome}</p>
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateContact('New product or MVP', `Inspired by ${testimonial.role} engagement.`);
            }}
            className="px-6 py-2.5 rounded-full bg-[#121314] text-white font-body text-label-lg hover:bg-[#2A2D30] transition-colors cursor-pointer"
          >
            Book A 30-Minute Call →
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

interface SecurityPressModalProps {
  open: boolean;
  onClose: () => void;
  onNavigateContact: (topic?: string, request?: string) => void;
}

export function SecurityPressModal({
  open,
  onClose,
  onNavigateContact,
}: SecurityPressModalProps) {
  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      subtitle="Security, Compliance & Recognition"
      title="Enterprise Governance & Press"
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECURITY_PILLARS.map((p) => (
            <div key={p.num} className="p-4 rounded-lg bg-off-white border border-border-subtle">
              <span className="font-label text-label-sm text-light-primary tabular-nums">
                {p.num}
              </span>
              <h4 className="font-headline text-title-md text-ink-primary mt-0.5">{p.title}</h4>
              <p className="font-body text-body-sm text-ink-secondary mt-1">{p.detail}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border-subtle">
          <h4 className="font-headline text-title-md text-ink-primary mb-3">
            Press &amp; Certifications
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESS_COVERAGE.map((item) => (
              <div
                key={item.outlet}
                className="p-3 rounded-lg bg-off-white border border-border-subtle"
              >
                <p className="font-headline text-label-lg text-ink-primary">{item.outlet}</p>
                <p className="font-body text-body-sm text-ink-secondary">{item.headline}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateContact(
                'AI or AI agents',
                'Requesting ISO 27001 / HIPAA security packet and NDA.'
              );
            }}
            className="px-6 py-2.5 rounded-full bg-[#121314] text-white font-body text-label-lg hover:bg-[#2A2D30] transition-colors cursor-pointer"
          >
            Request Security &amp; NDA Packet →
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
