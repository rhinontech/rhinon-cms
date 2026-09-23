"use client";

import React from "react";
import Link from "next/link";
import { TextAnimation } from "../Animations";
import { PrimaryButton, SecondaryButton } from "../Common";

export function Footer() {
  return (
    <footer className="bg-white text-gray-900 font-sans pt-20 pb-12 px-6 relative overflow-hidden">

      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_55%,#000_25%,transparent_95%)] opacity-35"
      />

      {/* Top CTA Banner Section */}
      {/* <div className="max-w-4xl mx-auto flex flex-col items-center text-center mb-14 relative"> */}

      {/* Left Floating Graphic 1 */}
      {/* <div className="absolute max-sm:hidden -left-16 sm:-left-36 md:-left-44 -top-6 sm:top-32 w-16 h-16 sm:w-22 sm:h-22 md:w-32 md:h-32 pointer-events-none z-10">
          <img
            src="/footer/image1.avif"
            alt="Footer Left Graphic"
            className="w-full h-full object-contain drop-shadow-xl"
          />
        </div> */}

      {/* Right Floating Graphic 2 (Blurred for Depth) */}
      {/* <div className="absolute max-sm:hidden -right-12 sm:-right-28 md:-right-36 -top-4 sm:top-32 w-16 h-16 sm:w-22 sm:h-22 md:w-32 md:h-32 pointer-events-none z-10">
          <img
            src="/footer/image3.avif"
            alt="Footer Right Graphic"
            className="w-full h-full object-contain drop-shadow-xl blur-[3px]"
          />
        </div> */}

      {/* Rocket Icon Badge */}
      {/* <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md mb-6 hover:scale-105 transition-transform cursor-pointer">
          <span className="text-lg">🚀</span>
        </div> */}

      {/* Banner Headline */}
      {/* <h2 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-4">
          <TextAnimation>Your Career Should</TextAnimation> <br /><TextAnimation> Keep Moving Upward</TextAnimation>
        </h2>

        <p className="text-xs sm:text-sm font-normal text-gray-500 max-w-sm mb-8 leading-relaxed">
          Programs, real projects, mentorship, events, and a community built for ambitious careers.
        </p> */}

      {/* Action Buttons */}
      {/* <div className="flex flex-wrap max-sm:flex-col items-center justify-center gap-4">
          <Link href="/#programs">
            <PrimaryButton>Explore programs</PrimaryButton>
          </Link>
          <Link href="/#community">
            <SecondaryButton>Join the community</SecondaryButton>
          </Link>
        </div> */}
      {/* </div > */}

      {/* Main Footer Links & Info Grid */}
      < div className="max-w-6xl mx-auto" >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start mb-16">

          {/* Brand Info Column */}
          <div className="md:col-span-4 text-left space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/uppercurve_logo_nav.png"
                alt="UpperCurve logo"
                className="h-7 w-auto"
              />
              <span className="text-xl tracking-tight font-extrabold [font-family:var(--font-montserrat)]">
                <span className="text-[#0B1B42]">UPPER</span>
                <span className="text-indigo-600">CURVE</span>
              </span>
            </Link>

            <p className="text-xs font-normal text-gray-500 max-w-xs leading-relaxed">
              A career growth ecosystem for ambitious students and early-career
              professionals. Learn. Build. Connect. Grow.
            </p>
          </div>

          {/* Site Map Column */}
          <div className="md:col-span-3 text-left space-y-3">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
              Site map
            </div>
            {[
              { name: "Courses", href: "/#courses" },
              { name: "Events", href: "/events" },
              { name: "Community", href: "/community" },
              { name: "Blogs", href: "/blog" },
              { name: "Jobs", href: "/#jobs" },
            ].map((link) => (
              <div key={link.name}>
                <Link href={link.href} className="text-sm font-bold text-gray-900 hover:text-black transition-colors">
                  {link.name}
                </Link>
              </div>
            ))}
          </div>

          {/* Legal Column */}
          <div className="md:col-span-2 text-left space-y-3">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
              Legal
            </div>
            {["Privacy Policy", "Terms", "404"].map((link, idx) => (
              <div key={idx}>
                <a href="#" className="text-sm font-bold text-gray-900 hover:text-black transition-colors">
                  {link}
                </a>
              </div>
            ))}
          </div>

          {/* Socials & Subscribe Column */}
          <div className="md:col-span-3 text-left md:text-right space-y-6">
            {/* Social Icons */}
            <div className="flex items-center md:justify-end gap-3">
              <a href="#" className="w-9 h-9 rounded-xl bg-gray-200/80 hover:bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-bold transition-all">
                in
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-gray-200/80 hover:bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-bold transition-all">
                𝕏
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-xl bg-gray-200/80 hover:bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-bold transition-all"
              >
                <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>

            {/* Student Avatars pill */}
            <div className="flex items-center md:justify-end gap-2 text-xs font-bold text-gray-700">
              <div className="flex -space-x-2">
                <img className="w-6 h-6 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80" alt="std" />
                <img className="w-6 h-6 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&q=80" alt="std" />
                <img className="w-6 h-6 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&q=80" alt="std" />
              </div>
              <span className="text-[11px] text-gray-500 font-normal">Join the <b className="text-gray-900">UpperCurve</b> community</span>
            </div>

            {/* Bottom Enroll CTA button */}
            <div>
              <Link href="/community" className="w-full px-5 bg-gray-200/80 hover:bg-gray-300/80 text-gray-900 font-bold text-sm py-3.5 rounded-full transition-all shadow-sm">
                Join the community
              </Link>
            </div>
          </div>

        </div>

        {/* Copyright & Credits Row */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 pt-8 border-t border-gray-200/40 gap-4 bg-white relative z-20">
          <div>©2026 UpperCurve. All Rights reserved</div>
          <div>
            made by{" "}
            <a
              href="https://rhinonlabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 font-black hover:underline underline-offset-2"
            >
              Rhinon Labs
            </a>
          </div>
        </div>
      </div >

    </footer >
  );
}

export default Footer;
