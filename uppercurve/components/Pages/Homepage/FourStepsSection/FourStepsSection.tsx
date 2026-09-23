"use client";

import { TextAnimation } from "@/components/Animations";
import React, { useRef, useState, useEffect } from "react";

interface StepCard {
  step: string;
  title: string;
  desc: string;
  image: string;
  tilt: string;
}

export function FourStepsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const steps: StepCard[] = [
    {
      step: "01",
      title: "Learn",
      desc: "Practical, industry-relevant skills taught by people in the field.",
      tilt: "-rotate-3",
      image: "/fourSteps/image1.avif",
    },
    {
      step: "02",
      title: "Build",
      desc: "Real projects and hands-on experience you can point to.",
      tilt: "rotate-2",
      image: "/fourSteps/image2.avif",
    },
    {
      step: "03",
      title: "Connect",
      desc: "Mentors, peers, and industry exposure that open doors.",
      tilt: "-rotate-3",
      image: "/fourSteps/image3.avif",
    },
    {
      step: "04",
      title: "Grow",
      desc: "Career guidance and opportunities to reach your next level.",
      tilt: "rotate-2",
      image: "/fourSteps/image4.avif",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768) return;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const totalScroll = rect.height - windowHeight;
        if (totalScroll > 0) {
          const current = Math.max(0, Math.min(totalScroll, -rect.top));
          setScrollProgress(current / totalScroll);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* 1. MOBILE VERSION (Overflow-x-auto horizontal scroll row, no scroll animation) */}
      <section className="md:hidden py-14 bg-white text-gray-900 font-sans">
        <div className="flex flex-col items-center text-center mb-8 px-6">
          <span className="bg-cyan-100 border border-cyan-200 text-cyan-700 text-[11px] font-semibold px-3 py-1 rounded-full mb-4 shadow-2xs">
            How it works
          </span>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
            <TextAnimation>Learn. Build.</TextAnimation> <br /> <TextAnimation>Connect. Grow.</TextAnimation>
          </h2>
        </div>

        {/* Horizontal Scroll Cards Row */}
        <div className="w-full overflow-x-auto flex gap-4 px-6 pb-6 pt-2 scrollbar-none snap-x snap-mandatory">
          {steps.map((card, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden bg-[#f4f5f7] rounded-3xl p-6 flex flex-col justify-start items-center text-center shadow-lg border-2 border-white min-w-[270px] max-w-[290px] min-h-[360px] shrink-0 snap-center ${card.tilt}`}
            >
              <div className="z-10">
                <span className="bg-white border border-gray-200/80 text-gray-500 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block mb-4 shadow-2xs">
                  {card.step}
                </span>

                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  {card.title}
                </h3>

                <p className="text-xs font-normal text-gray-500 leading-relaxed px-2">
                  {card.desc}
                </p>
              </div>

              {/* 3D Image Docked Absolute */}
              <img
                src={card.image}
                alt={card.title}
                className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-48 h-auto object-contain drop-shadow-xl pointer-events-none"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 2. DESKTOP VERSION (Original exact sticky scroll animation) */}
      <section ref={containerRef} className="hidden md:block relative h-[240vh] bg-white text-gray-900 font-sans">
        {/* Sticky Viewport Stage */}
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center">

          {/* Header Pill & Title */}
          <div className="flex flex-col items-center text-center mb-12 z-10">
            <span className="bg-cyan-100 border border-cyan-200 text-cyan-700 text-[11px] font-semibold px-3 py-1 rounded-full mb-4 shadow-2xs">
              How it works
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
              <TextAnimation> Learn. Build.</TextAnimation> <br /> <TextAnimation>Connect. Grow.</TextAnimation>
            </h2>
          </div>

          {/* 4 Cards Row Container */}
          <div className="w-full grid grid-cols-4 px-2">
            {steps.map((card, idx) => {
              // Scroll trigger progress for each step card [01 -> 02 -> 03 -> 04]
              const stepStart = idx * 0.22;
              const stepEnd = stepStart + 0.22;

              const rawProgress = (scrollProgress - stepStart) / (stepEnd - stepStart);
              const cardProgress = Math.max(0, Math.min(1, rawProgress));

              // Direct translateY shift from +650px (off-screen bottom) to 0px (final position)
              const translateY = (1 - cardProgress) * 650;

              return (
                <div
                  key={idx}
                  className={`relative overflow-hidden bg-[#f4f5f7] rounded-3xl p-6 sm:p-7 flex flex-col justify-start items-center text-center shadow-xl border-2 border-white min-h-[360px] md:min-h-[400px] transition-transform duration-300 ease-out ${card.tilt}`}
                  style={{
                    transform: `translateY(${translateY}px)`,
                  }}
                >

                  <div className="z-10">
                    <span className="bg-white border border-gray-200/80 text-gray-500 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block mb-4 shadow-2xs">
                      {card.step}
                    </span>

                    <h3 className="text-2xl font-black text-gray-900 mb-2">
                      {card.title}
                    </h3>

                    <p className="text-xs font-normal text-gray-500 leading-relaxed px-2">
                      {card.desc}
                    </p>
                  </div>

                  {/* 3D Image Docked Absolute -Bottom-20 Centered on X Axis */}
                  <img
                    src={card.image}
                    alt={card.title}
                    className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-48 sm:w-56 h-auto object-contain drop-shadow-xl pointer-events-none"
                  />
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </>
  );
}

export default FourStepsSection;
