"use client";

import React, { useEffect, useState, useRef } from "react";
import FeaturedOn from "../FeaturedOn/FeaturedOn";

function RadialStreaksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const colors = [
      "rgba(0, 102, 255,",
      "rgba(0, 180, 216,",
      "rgba(59, 130, 246,",
      "rgba(96, 165, 250,",
      "rgba(0, 150, 255,",
    ];

    const getOrigin = () => ({ x: width / 2, y: -20 });

    let streaks: Array<{
      angle: number;
      dist: number;
      speed: number;
      length: number;
      opacity: number;
      color: string;
      lineWidth: number;
    }> = [];

    let staticRays: number[] = [];

    const initLines = () => {
      const isMobile = width < 768;
      // Reduced line counts for mobile to prevent crowding
      const numStreaks = isMobile ? 32 : 80;
      const staticRaysCount = isMobile ? 20 : 45;

      streaks = [];
      for (let i = 0; i < numStreaks; i++) {
        const angle = (Math.PI * (18 + Math.random() * 144)) / 180;
        streaks.push({
          angle,
          dist: Math.random() * (Math.max(width, height) * 0.9),
          speed: 0.3 + Math.random() * 1.2,
          length: isMobile ? 20 + Math.random() * 45 : 25 + Math.random() * 65,
          opacity: 0.15 + Math.random() * 0.65,
          color: colors[Math.floor(Math.random() * colors.length)],
          lineWidth: isMobile ? 1 : 1 + Math.random() * 1.5,
        });
      }

      staticRays = [];
      for (let i = 0; i < staticRaysCount; i++) {
        staticRays.push((Math.PI * (16 + (148 / staticRaysCount) * i)) / 180);
      }
    };

    initLines();

    const handleResize = () => {
      if (!canvas) return;
      const prevIsMobile = width < 768;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      const newIsMobile = width < 768;
      if (prevIsMobile !== newIsMobile) {
        initLines();
      }
    };
    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const origin = getOrigin();
      const maxDist = Math.hypot(width, height);

      // 1. Draw subtle static radial rays
      ctx.lineWidth = 0.8;
      for (let i = 0; i < staticRays.length; i++) {
        const rad = staticRays[i];
        const endX = origin.x + Math.cos(rad) * maxDist;
        const endY = origin.y + Math.sin(rad) * maxDist;

        const rayGrad = ctx.createLinearGradient(origin.x, origin.y, endX, endY);
        rayGrad.addColorStop(0, "rgba(59, 130, 246, 0.02)");
        rayGrad.addColorStop(0.2, "rgba(59, 130, 246, 0.08)");
        rayGrad.addColorStop(0.7, "rgba(59, 130, 246, 0.03)");
        rayGrad.addColorStop(1, "rgba(59, 130, 246, 0)");

        ctx.strokeStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // 2. Draw animated moving streaks
      for (let i = 0; i < streaks.length; i++) {
        const s = streaks[i];
        s.dist += s.speed;

        const hx = origin.x + Math.cos(s.angle) * s.dist;
        const hy = origin.y + Math.sin(s.angle) * s.dist;

        const tx = origin.x + Math.cos(s.angle) * Math.max(0, s.dist - s.length);
        const ty = origin.y + Math.sin(s.angle) * Math.max(0, s.dist - s.length);

        if (s.dist - s.length > maxDist || hx < -50 || hx > width + 50 || hy > height + 50) {
          s.dist = Math.random() * 60 + 20;
          s.angle = (Math.PI * (18 + Math.random() * 144)) / 180;
          s.speed = 0.3 + Math.random() * 1.2;
          continue;
        }

        const grad = ctx.createLinearGradient(tx, ty, hx, hy);
        grad.addColorStop(0, `${s.color}0)`);
        grad.addColorStop(0.7, `${s.color}${s.opacity * 0.8})`);
        grad.addColorStop(1, `${s.color}${s.opacity})`);

        ctx.lineWidth = s.lineWidth;
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}

export function Hero() {
  const programs = [
    "Platform Engineering",
    "Modern Software and AI engineering",
    "Modern Data Science and ML with Specialisation in AI",
  ];

  return (
    <div className="relative w-full overflow-hidden bg-white text-[#0B1B3D] font-[family-name:var(--font-plus-jakarta)] selection:bg-blue-500 selection:text-white">
      {/* Soft Top Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[900px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(191,219,254,0.45),rgba(255,255,255,0)_70%)] pointer-events-none z-0" />

      {/* Animated Radial Streaks Background Canvas */}
      <RadialStreaksCanvas />

      {/* Main Hero Content */}
      <section className="relative z-10 pt-16 sm:pt-20 md:pt-14 pb-16 sm:pb-20 px-4 sm:px-6 mx-auto flex flex-col items-center text-center max-w-6xl">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-1.5 text-blue-600 text-xs sm:text-[13px] font-semibold tracking-[0.2em] uppercase mb-6 sm:mb-8 select-none">
          <span className="opacity-70">&lsaquo;</span>
          <span>THE MARKET HAS ALREADY CHANGED</span>
          <span className="opacity-70">&rsaquo;</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-extrabold text-[#0B1B3D] tracking-tight leading-[1.12] max-w-5xl mx-auto mb-7">
          Become the Professional <br />
          <span className="bg-[#EBF3FF] text-[#0B1B3D] px-3.5 sm:px-5 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl inline-block mr-2 sm:mr-3 align-middle font-extrabold shadow-sm">
            Built
          </span>
          for the{" "}
          <span className="bg-gradient-to-r from-[#0052FF] via-[#0077FF] to-[#00C2FF] bg-clip-text text-transparent font-extrabold">
            Next
          </span>{" "}
          <br />
          <span className="bg-gradient-to-r from-[#0052FF] via-[#0066FF] to-[#00B4D8] bg-clip-text text-transparent font-extrabold">
            Decade in AI.
          </span>
        </h1>

        {/* Subtitle */}
        <div className="max-w-2xl mx-auto text-center space-y-1 mb-9 text-[#334155] text-sm sm:text-base md:text-[17px] leading-relaxed">
          <p className="font-semibold text-[#1e293b]">
            The investment that compounds.
          </p>
          <p className="text-gray-500 font-normal">
            Strong technical foundations, AI integrated at every stage, and a curriculum that evolves as the market does
          </p>
        </div>

        {/* Programs Infinite Marquee Strip */}
        <div className="flex flex-col items-center mb-10 w-full max-w-4xl mx-auto">
          <span className="text-[11px] font-bold tracking-[0.25em] text-gray-400 uppercase mb-3">
            PROGRAMS
          </span>
          <div className="relative w-full overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
            <div className="flex w-max items-center gap-8 sm:gap-12 animate-marquee hover:[animation-play-state:paused] select-none">
              {[...Array(4)].flatMap(() => programs).map((program, index) => (
                <div
                  key={index}
                  className="flex items-center gap-8 sm:gap-12 whitespace-nowrap text-xs sm:text-sm md:text-[15px] font-medium text-gray-400 hover:text-[#0B1B3D] transition-colors cursor-pointer"
                >
                  <span className="hover:font-semibold transition-all">{program}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
          <a
            href="/placement-report"
            className="bg-[#0052FF] hover:bg-[#0043CC] text-white font-bold text-xs sm:text-sm tracking-wider uppercase px-8 py-3.5 rounded-[4px] shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 inline-flex items-center justify-center"
          >
            PLACEMENT REPORT
          </a>
          <a
            href="/#callback"
            className="bg-white hover:bg-gray-50 text-[#0B1B3D] border border-[#0B1B3D] font-bold text-xs sm:text-sm tracking-wider uppercase px-8 py-3.5 rounded-[4px] shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 inline-flex items-center justify-center"
          >
            REQUEST A CALLBACK
          </a>
        </div>
      </section>

      {/* Featured On Brands Strip */}
      {/* <div className="relative z-10 pb-12">
        <FeaturedOn />
      </div> */}
    </div>
  );
}

export default Hero;
