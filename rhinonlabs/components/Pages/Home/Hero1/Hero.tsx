"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import HeroShowcase from "./HeroShowcase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { trackClickPhone, trackClickWhatsApp } from "@/lib/analytics-events";

// Code-split SchedulerModal so dialog JS doesn't block initial page load
const SchedulerModal = dynamic(() => import("@/components/Common/CTA/SchedulerModal"));

const Hero1 = () => {
  const router = useRouter();
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  return (
    <div id="hero" className="overflow-hidden relative flex flex-col">
      <div className="absolute inset-0 top-64 max-sm:top-52 -z-10">
        <div
          className="mask-[linear-gradient(to_bottom,transparent,white_30%,white_60%,transparent)]
                mask-mode:luminance relative w-full h-full"
        >
          <div
            aria-hidden="true"
            // Decorative only: a CSS background, not an <img>, so search engines
            // never pick it as the page's thumbnail (they did, in Google results).
            className="site-bg absolute inset-0 bg-cover bg-center"
          />
        </div>
      </div>
      <div className="pt-32 max-sm:pt-24 px-5 pb-10 flex flex-col gap-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-5 items-center">
          {/* Badge */}
          <div className="mb-8 text-center inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium tracking-widest text-[#A3B8CC] uppercase font-sans">
              Your Go-To Operations Scaling Partner
            </span>
          </div>

          {/* Main Heading */}
          <h1
            className="text-[36px] text-center sm:text-5xl md:text-[76px] font-sans font-normal leading-[1.12] tracking-[-0.02em] max-w-5xl mx-auto py-2 text-transparent bg-clip-text bg-linear-to-b from-white to-white/80 mb-6"
          >
            AI Automation Agency <br />
            <span className="font-serif italic text-transparent bg-clip-text bg-linear-to-r from-[#c7d4ff] via-[#8fa6ff] to-[#5b7bff] pr-2">
              for Startups & SMBs.
            </span>
          </h1>
          {/* Subtitle */}
          <p className="text-white/70 text-center sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 px-4 sm:px-0">
            We build custom AI agents, workflow automations, and internal tools in fixed-scope 2–4-week sprints so your team scales operations without adding headcount.
          </p>
        </div>
        {/* CTA Section */}
        <div
          className="flex items-center justify-center flex-col md:flex-row gap-5 md:gap-10"
        >
          <div className="z-20">
            <Button
              className="bg-white text-black hover:bg-gray-200 px-8 py-6 text-lg font-semibold rounded-none border-3 border-black/30 transition-all"
              onClick={() => setIsSchedulerOpen(true)}
            >
              Book a Free Discovery Call
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-4">
            {/* Avatar Stack */}
            <div className="flex -space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center overflow-hidden">
                <Image src="/assets/avatars/1.webp" alt="Startup founder - Rhinon Labs client" width={48} height={48} className="w-full h-full object-cover" />
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center overflow-hidden">
                <Image src="/assets/avatars/2.webp" alt="Product lead - Rhinon Labs client" width={48} height={48} className="w-full h-full object-cover" />
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center overflow-hidden">
                <Image src="/assets/avatars/3.webp" alt="Business owner - Rhinon Labs client" width={48} height={48} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Rating & Trust Text */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-white text-white" />
                ))}
              </div>
              <span className="text-white/70 text-sm">Trusted by startups and SMBs across India.</span>
            </div>
          </div>
        </div>

        {/* Direct Contact Option */}
        <div
          className="text-center text-white/80"
        >
          <p className="text-sm">
            Prefer to talk directly?{" "}
            <a
              href="tel:+918249291789"
              onClick={() => trackClickPhone("hero_section")}
              className="font-semibold text-white hover:underline transition-all"
            >
              Call us: +91 8249 291 789
            </a>
            {" "}or{" "}
            <a
              href="https://wa.me/918249291789"
              onClick={() => trackClickWhatsApp("hero_section")}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="font-semibold text-white hover:underline transition-all"
            >
              WhatsApp
            </a>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-12 pb-10">
        <div
          className="flex flex-col md:flex-row justify-center px-5 gap-5 md:gap-10 max-w-4xl mx-auto text-xs md:text-sm uppercase tracking-[0.18em] text-center text-white/55"
        >
          <span>Fast Delivery • Fixed Scope, No Hourly Billing • AI-Powered</span>
        </div>

        <HeroShowcase />
      </div>
      <SchedulerModal isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
    </div>
  );
};

export default Hero1;
