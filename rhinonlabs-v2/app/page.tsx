'use client';

import { MotionConfig } from 'motion/react';
import { useRef, useState } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { HeroShowcase } from '@/components/HeroShowcase';
import { LabsAndIndustries } from '@/components/LabsAndIndustries';
import {
  CaseStudyModal,
  EstimatorModal,
  SecurityPressModal,
  TestimonialModal,
} from '@/components/Modals';
import { ProcessAndCases } from '@/components/ProcessAndCases';
import { SecurityAndContact } from '@/components/SecurityAndContact';
import { ServicesAndSolutions } from '@/components/ServicesAndSolutions';
import { CaseStudy, TestimonialItem } from '@/data/rhinonData';

export default function HomePage() {
  const [presetTopic, setPresetTopic] = useState<string>('New product or MVP');
  const [presetRequest, setPresetRequest] = useState<string>('');
  const [estimatorOpen, setEstimatorOpen] = useState(false);
  const [allCasesOpen, setAllCasesOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);
  const [selectedTestimonial, setSelectedTestimonial] = useState<TestimonialItem | null>(null);
  const [securityOpen, setSecurityOpen] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleNavigateContact = (topic?: string, request?: string) => {
    if (topic) setPresetTopic(topic);
    if (request !== undefined) setPresetRequest(request);
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        nameInputRef.current?.focus({ preventScroll: true });
      }, 350);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div id="top" className="min-h-screen flex flex-col bg-white text-[#121314]">
        <Header
          onNavigateContact={handleNavigateContact}
          onOpenSecurityModal={() => setSecurityOpen(true)}
        />

        <main className="flex-1">
          <HeroShowcase onNavigateContact={handleNavigateContact} />

          <ServicesAndSolutions onNavigateContact={handleNavigateContact} />

          <ProcessAndCases
            onOpenEstimator={() => setEstimatorOpen(true)}
            onOpenAllCases={() => setAllCasesOpen(true)}
            onSelectCase={(cs) => setSelectedCase(cs)}
          />

          <LabsAndIndustries
            onNavigateContact={handleNavigateContact}
            onSelectCase={(cs) => setSelectedCase(cs)}
            onSelectTestimonial={(item) => setSelectedTestimonial(item)}
          />

          <SecurityAndContact
            presetTopic={presetTopic}
            presetRequest={presetRequest}
            onOpenSecurityModal={() => setSecurityOpen(true)}
            nameInputRef={nameInputRef}
          />
        </main>

        <Footer
          onNavigateContact={handleNavigateContact}
          onOpenSecurityModal={() => setSecurityOpen(true)}
        />

        <EstimatorModal
          open={estimatorOpen}
          onClose={() => setEstimatorOpen(false)}
          onApplyEstimate={(topic, summary) => handleNavigateContact(topic, summary)}
        />

        <CaseStudyModal
          selectedCase={selectedCase}
          showAll={allCasesOpen}
          onClose={() => {
            setSelectedCase(null);
            setAllCasesOpen(false);
          }}
          onSelectCase={(cs) => setSelectedCase(cs)}
          onNavigateContact={handleNavigateContact}
        />

        <TestimonialModal
          testimonial={selectedTestimonial}
          onClose={() => setSelectedTestimonial(null)}
          onNavigateContact={handleNavigateContact}
        />

        <SecurityPressModal
          open={securityOpen}
          onClose={() => setSecurityOpen(false)}
          onNavigateContact={handleNavigateContact}
        />
      </div>
    </MotionConfig>
  );
}
