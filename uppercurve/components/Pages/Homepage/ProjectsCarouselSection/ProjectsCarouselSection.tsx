"use client";

import { AnimateWrapper, TextAnimation } from "@/components/Animations";
import React, { useState } from "react";

interface ProjectSlide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
}

export function ProjectsCarouselSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides: ProjectSlide[] = [
    {
      id: 1,
      title: "AI & Automation",
      subtitle: "Build with modern AI tooling on real use cases — from prototype to working product.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 2,
      title: "Software & Engineering",
      subtitle: "Ship production-grade software with modern stacks, code reviews, and real deadlines.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 3,
      title: "Product & Business",
      subtitle: "Take an idea from problem statement to launch plan, with real users in mind.",
      image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 4,
      title: "Industry Briefs",
      subtitle: "Solve real-world briefs in small teams and present your work at demo days.",
      image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: 5,
      title: "Career Accelerator",
      subtitle: "Sharpen your portfolio, interviews, and positioning for your next role.",
      image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === slides.length - 1;

  const nextSlide = () => {
    if (!isLastSlide) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (!isFirstSlide) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <section className="py-24 max-sm:py-14 text-gray-900 font-sans overflow-hidden">

      {/* Header Badge & Title */}
      <div className="max-w-[1400px] mx-auto flex flex-col items-center text-center mb-16">
        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md mb-6 hover:scale-105 transition-transform cursor-pointer">
          <span className="text-lg">🛠️</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
          <TextAnimation>What you’ll</TextAnimation> <br />{" "}
          <TextAnimation>work on</TextAnimation>
        </h2>
      </div>

      {/* Carousel Container with Absolute Gradient Fade Overlays */}
      <AnimateWrapper className="relative max-w-[1400px] mx-auto h-[360px] sm:h-[440px] md:h-[500px] flex items-center justify-center">

        {/* Navigation Arrow Left (Desktop) */}
        <button
          onClick={prevSlide}
          disabled={isFirstSlide}
          aria-label="Previous Slide"
          className={`hidden sm:flex absolute left-2 sm:left-6 z-50 w-15 h-11 rounded-full bg-[#f8f8f8] border border-gray-200 text-gray-800 items-center justify-center font-bold text-base shadow-xl transition-all ${isFirstSlide
            ? "opacity-30 cursor-not-allowed pointer-events-none"
            : "hover:bg-[#f8f8f8] hover:scale-110 active:scale-95 cursor-pointer"
            }`}
        >
          ←
        </button>

        {/* Navigation Arrow Right (Desktop) */}
        <button
          onClick={nextSlide}
          disabled={isLastSlide}
          aria-label="Next Slide"
          className={`hidden sm:flex absolute right-2 sm:right-6 z-50 w-15 h-11 rounded-full bg-[#f8f8f8] text-gray-800 items-center justify-center font-bold text-base shadow-xl transition-all ${isLastSlide
            ? "opacity-30 cursor-not-allowed pointer-events-none"
            : "hover:bg-[#f8f8f8] hover:scale-110 active:scale-95 cursor-pointer"
            }`}
        >
          →
        </button>

        {/* ABSOLUTE LEFT GRADIENT FADE OVERLAY */}
        <div className="absolute top-0 left-0 bottom-0 w-14 sm:w-14 md:w-30 bg-gradient-to-r from-white via-white/90 max-sm:via-white/50 to-transparent z-40 pointer-events-none" />

        {/* ABSOLUTE RIGHT GRADIENT FADE OVERLAY */}
        <div className="absolute top-0 right-0 bottom-0 w-14 sm:w-314 md:w-30 bg-gradient-to-l from-white via-white/90 max-sm:via-white/50 to-transparent z-40 pointer-events-none" />

        {/* Slides Track */}
        <div className="relative w-full h-full">
          {slides.map((slide, index) => {
            // Linear non-circular distance offset
            const offset = index - currentIndex;

            const isCurrent = offset === 0;

            let leftPos = "50%";
            let scaleVal = "scale(1)";
            let opacityVal = 0;
            let zIndexVal = 0;

            if (isCurrent) {
              leftPos = "50%";
              scaleVal = "scale(1)";
              opacityVal = 1;
              zIndexVal = 30;
            } else if (offset === 1) {
              leftPos = "74%";
              scaleVal = "scale(0.86)";
              opacityVal = 0.65;
              zIndexVal = 20;
            } else if (offset === -1) {
              leftPos = "26%";
              scaleVal = "scale(0.86)";
              opacityVal = 0.65;
              zIndexVal = 20;
            } else if (offset > 1) {
              leftPos = "95%";
              scaleVal = "scale(0.7)";
              opacityVal = 0;
              zIndexVal = 10;
            } else {
              leftPos = "5%";
              scaleVal = "scale(0.7)";
              opacityVal = 0;
              zIndexVal = 10;
            }

            return (
              <div
                key={slide.id}
                onClick={() => setCurrentIndex(index)}
                className="absolute top-1/2 w-[70%] sm:w-[56%] md:w-[60%] max-w-2xl h-[200px] sm:h-[370px] md:h-[400px] rounded-xl cursor-pointer transition-all duration-500 ease-out bg-white shadow-[0_20px_50px_rgba(0,0,0,0.25)] "
                style={{
                  left: leftPos,
                  transform: `translate(-50%, -50%) ${scaleVal}`,
                  zIndex: zIndexVal,
                  opacity: opacityVal,
                }}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            );
          })}
        </div>

      </AnimateWrapper>

      {/* Dynamic Text Section below Carousel */}
      {
        slides[currentIndex] && (
          <div className="max-w-md mx-auto text-center mt-8 max-sm:mt-0 space-y-2 px-4 transition-all duration-300">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {slides[currentIndex].title}
            </h3>
            <p className="text-sm font-normal text-gray-500 leading-relaxed">
              {slides[currentIndex].subtitle}
            </p>

            {/* Mobile Navigation Controls below Text */}
            <div className="flex sm:hidden items-center justify-center gap-4 pt-6">
              <button
                onClick={prevSlide}
                disabled={isFirstSlide}
                aria-label="Previous Slide"
                className={`w-18 h-14 rounded-full bg-[#f8f8f8] border border-gray-200/80 text-gray-900 flex items-center justify-center font-bold text-xl shadow-sm transition-all ${isFirstSlide
                  ? "opacity-30 cursor-not-allowed pointer-events-none"
                  : "hover:bg-[#f0f0f0] active:scale-95 cursor-pointer"
                  }`}
              >
                ←
              </button>

              <span className="px-4 py-2 rounded-full bg-[#f4f4f5] text-xs font-bold text-gray-700 tracking-wider border border-gray-200/60">
                {currentIndex + 1}/{slides.length}
              </span>

              <button
                onClick={nextSlide}
                disabled={isLastSlide}
                aria-label="Next Slide"
                className={`w-18 h-14 rounded-full bg-[#f8f8f8] border border-gray-200/80 text-gray-900 flex items-center justify-center font-bold text-xl shadow-sm transition-all ${isLastSlide
                  ? "opacity-30 cursor-not-allowed pointer-events-none"
                  : "hover:bg-[#f0f0f0] active:scale-95 cursor-pointer"
                  }`}
              >
                →
              </button>
            </div>
          </div>
        )
      }

    </section >
  );
}

export default ProjectsCarouselSection;
