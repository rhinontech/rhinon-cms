'use client';

import { MessageSquare } from 'lucide-react';
import { STITCH_IMAGES } from '../data/rhinonData';
import { ResilientImage } from './ResilientImage';

interface FooterProps {
  onNavigateContact: (presetTopic?: string) => void;
  onOpenSecurityModal: () => void;
}

export function Footer({ onNavigateContact, onOpenSecurityModal }: FooterProps) {
  return (
    <>
      <footer className="bg-[#121314] text-white pt-14 pb-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col gap-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
            <div className="md:col-span-4 flex flex-col gap-3">
              <ResilientImage
                src={STITCH_IMAGES.logoDark}
                alt="RhinonLabs Logo"
                className="h-8 sm:h-9 w-auto object-contain self-start"
                fallbackTitle="RhinonLabs"
                fallbackSubtitle=""
                darkFallback
              />
              <h3 className="font-display text-2xl font-bold text-white">Let&apos;s Connect!</h3>
              <div className="flex flex-col gap-1.5 text-sm text-gray-400">
                <a href="#contact" className="hover:text-white transition-colors">
                  Have an idea? Let&apos;s talk
                </a>
                <a href="#contact" className="hover:text-white transition-colors">
                  Validate your roadmap in a Discovery Workshop
                </a>
                <a
                  href="mailto:hello@rhinonlabs.com"
                  className="text-[#FF6B35] hover:underline font-medium"
                >
                  hello@rhinonlabs.com
                </a>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-1.5">
              <span className="font-label text-xs uppercase tracking-wider text-gray-500">
                North America &amp; Europe
              </span>
              <p className="text-sm text-gray-400">
                Dedicated Staff-Level Engineering Pods operating across US &amp; UK timezones
              </p>
              <p className="text-sm font-medium text-white">San Francisco · New York · London</p>
            </div>

            <div className="md:col-span-4 flex flex-col gap-1.5">
              <span className="font-label text-xs uppercase tracking-wider text-gray-500">
                Middle East &amp; APAC
              </span>
              <p className="text-sm text-gray-400">
                AI Architecture &amp; Delivery Centers serving Enterprise Clients in 22+ Countries
              </p>
              <p className="text-sm font-medium text-white">Dubai · Bengaluru · Singapore</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-sm text-gray-400">
            <div className="flex flex-col gap-2">
              <span className="font-display text-sm font-bold text-white mb-1">AI Services</span>
              <a href="#services" className="hover:text-white">
                AI Development
              </a>
              <a href="#services" className="hover:text-white">
                AI Agent Development
              </a>
              <a href="#services" className="hover:text-white">
                Generative AI
              </a>
              <a href="#services" className="hover:text-white">
                LLM &amp; RAG Systems
              </a>
              <a href="#services" className="hover:text-white">
                Private AI Deployment
              </a>
              <a href="#services" className="hover:text-white">
                Computer Vision
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-display text-sm font-bold text-white mb-1">Engineering</span>
              <a href="#services" className="hover:text-white">
                Mobile Apps
              </a>
              <a href="#services" className="hover:text-white">
                iOS &amp; Android Apps
              </a>
              <a href="#services" className="hover:text-white">
                Flutter Apps
              </a>
              <a href="#services" className="hover:text-white">
                Web Applications
              </a>
              <a href="#services" className="hover:text-white">
                MVP Development
              </a>
              <a href="#services" className="hover:text-white">
                Cloud and DevOps
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-display text-sm font-bold text-white mb-1">AI Solutions</span>
              <a href="#solutions" className="hover:text-white">
                Process Automation
              </a>
              <a href="#solutions" className="hover:text-white">
                Workflow Automation
              </a>
              <a href="#solutions" className="hover:text-white">
                Document Processing
              </a>
              <a href="#solutions" className="hover:text-white">
                AI Voice Agent
              </a>
              <a href="#solutions" className="hover:text-white">
                AI Clinical Scribe
              </a>
              <a href="#labs" className="hover:text-white">
                RhinonLabs Labs
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-display text-sm font-bold text-white mb-1">Industries</span>
              <a href="#industries" className="hover:text-white">
                Healthcare Software
              </a>
              <a href="#industries" className="hover:text-white">
                Fintech &amp; Banking
              </a>
              <a href="#industries" className="hover:text-white">
                Retail and Ecommerce
              </a>
              <a href="#industries" className="hover:text-white">
                Logistics
              </a>
              <a href="#industries" className="hover:text-white">
                Real Estate
              </a>
              <a href="#industries" className="hover:text-white">
                eLearning
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-display text-sm font-bold text-white mb-1">Company</span>
              <a href="#why-us" className="hover:text-white">
                About RhinonLabs
              </a>
              <a href="#work" className="hover:text-white">
                Case Studies
              </a>
              <a href="#process" className="hover:text-white">
                AI Velocity Pods
              </a>
              <a href="#solutions" className="hover:text-white">
                Discovery Workshop
              </a>
              <a href="#services" className="hover:text-white">
                Hire Developers
              </a>
              <a href="#contact" className="hover:text-white">
                Contact Us
              </a>
              <a href="#faqs" className="hover:text-white">
                FAQs
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
            <span>© 2026 RhinonLabs. All rights reserved.</span>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onOpenSecurityModal}
                className="hover:text-white cursor-pointer"
              >
                Security and Compliance
              </button>
              <a href="#faqs" className="hover:text-white">
                FAQs
              </a>
              <a href="#contact" className="hover:text-white">
                Privacy Policy
              </a>
              <a href="#contact" className="hover:text-white">
                Terms and Conditions
              </a>
              <span>USA · UK · UAE · India</span>
            </div>
          </div>
        </div>
      </footer>

      <button
        type="button"
        onClick={() => onNavigateContact()}
        className="hidden md:inline-flex fixed bottom-6 right-6 z-40 items-center gap-2 px-5 py-3.5 rounded-full bg-[#121314] hover:bg-[#2A2D30] text-white border border-white/15 shadow-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
      >
        <MessageSquare className="w-4 h-4" aria-hidden="true" />
        <span>Talk to an expert</span>
      </button>
    </>
  );
}
