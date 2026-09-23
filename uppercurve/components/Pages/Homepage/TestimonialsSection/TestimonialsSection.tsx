"use client";

import { AnimateWrapper, TextAnimation } from "@/components/Animations";
import React, { useState } from "react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  rating: number;
  photo: string;
}

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Dwayne Johnson",
      role: "Senior Product Designer @ Google",
      quote: "The hands-on projects and real-world examples gave me the confidence to tackle complex design challenges. UpperCurve made all the difference in my career pivot.",
      rating: 5,
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 2,
      name: "Sophia Martinez",
      role: "Lead UX Researcher @ Stripe",
      quote: "The curriculum is laser-focused on industry needs. Building 6 portfolio case studies with live critique gave me a massive head start over bootcamp grads.",
      rating: 5,
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 3,
      name: "Marcus Vance",
      role: "Product Designer @ Figma",
      quote: "UpperCurve transformed the way I think about design systems and auto-layout. I went from feeling stuck to landing my dream role in under 12 weeks.",
      rating: 5,
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 4,
      name: "Elena Rostova",
      role: "UI Designer @ Apple",
      quote: "The mentorship quality is unmatched. Having real working pros review my Figma files every week accelerated my skills by 10x.",
      rating: 5,
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 5,
      name: "David Kim",
      role: "Senior Designer @ Uber",
      quote: "Best investment I made in my career. The structured modules and community support kept me accountable from day one.",
      rating: 5,
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 6,
      name: "Amara Nwosu",
      role: "Product Designer @ Spotify",
      quote: "The 1:1 career coaching and portfolio reviews prepared me to ace technical interviews with total confidence.",
      rating: 5,
      photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const current = testimonials[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-24 max-sm:py-14 text-white font-sans">
      <div className=" mx-auto bg-[#0a0a0c] rounded-3xl p-8 sm:p-14 border border-gray-800/80 shadow-2xl flex flex-col items-center text-center">

        {/* Lime Pill Badge */}
        <span className="bg-lime-400 text-black text-[11px] font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
          Testimonials
        </span>

        {/* Section Headline */}
        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-14">
          <TextAnimation>Don’t take our</TextAnimation> <br className="hidden sm:inline" /> <TextAnimation>word</TextAnimation>
        </h2>

        {/* Testimonial Card Duo Stage */}
        <AnimateWrapper className="relative w-full max-w-4xl flex flex-col md:flex-row items-center justify-center mb-12 py-4">

          {/* Left Photo Card (Tilted Left, z-10) */}
          <div className="w-full max-sm:hidden max-w-[340px] sm:max-w-[400px] h-[360px] sm:h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-gray-800/80 transform md:-rotate-3 transition-transform duration-300 z-10 shrink-0">
            <img
              src={current.photo}
              alt={current.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Quote Card (Tilted Right, Overlapping z-20) */}
          <div className="w-full max-w-[340px] sm:max-w-[400px] h-[360px] sm:h-[420px] bg-[#e5e7eb] text-gray-900 rounded-3xl p-7 sm:p-9 shadow-2xl border border-white/60 text-left flex flex-col justify-between transform md:rotate-3 md:-ml-16 -mt-10 md:mt-0 transition-transform duration-300 z-20 shrink-0">

            {/* 5 Stars */}
            <div>
              <div className="flex items-center gap-1 text-orange-500 text-sm font-bold mb-5">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>

              {/* Quote Text */}
              <p className="text-lg sm:text-xl font-bold leading-snug tracking-tight text-gray-900">
                “{current.quote}”
              </p>
            </div>

            {/* Author Info */}
            <div>
              <div className="text-base font-extrabold text-gray-900">
                {current.name}
              </div>
              <div className="text-xs font-medium text-gray-500 mt-0.5">
                {current.role}
              </div>
            </div>

          </div>

        </AnimateWrapper>

        {/* Navigation Bar (←  1/6  →) */}
        < div className="flex items-center gap-4 bg-[#18181b] border border-gray-800 px-4 py-2 rounded-full shadow-lg" >
          <button
            onClick={handlePrev}
            aria-label="Previous Testimonial"
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center font-bold text-sm transition-colors active:scale-95"
          >
            ←
          </button>

          <span className="text-xs font-mono font-bold text-gray-400">
            {currentIndex + 1}/{testimonials.length}
          </span>

          <button
            onClick={handleNext}
            aria-label="Next Testimonial"
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center font-bold text-sm transition-colors active:scale-95"
          >
            →
          </button>
        </div >

      </div >
    </section >
  );
}

export default TestimonialsSection;
