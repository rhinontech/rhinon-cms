"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PrimaryButton } from "../Common";

interface NavChildLink {
  name: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
}

interface NavLinkItem {
  name: string;
  href?: string;
  children?: NavChildLink[];
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isMobileResourcesOpen, setIsMobileResourcesOpen] = useState(false);
  const resourcesDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resourcesDropdownRef.current &&
        !resourcesDropdownRef.current.contains(event.target as Node)
      ) {
        setIsResourcesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setIsMobileResourcesOpen(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navLinks: NavLinkItem[] = [
    { name: "Courses", href: "/#courses" },
    { name: "Events", href: "/events" },
    { name: "Community", href: "/community" },
    {
      name: "Resources",
      children: [
        {
          name: "Blogs",
          href: "/blog",
          description: "Articles, insights & industry updates",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          ),
        },
        // {
        //   name: "Guide",
        //   href: "/guide",
        //   description: "Curated learning paths & career roadmaps",
        //   icon: (
        //     <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        //       <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        //     </svg>
        //   ),
        // },
      ],
    },
    { name: "Jobs", href: "/#jobs" },
  ];

  const secondaryLinks = [
    { name: "Privacy policy", href: "#privacy" },
    { name: "Terms", href: "#terms" },
    { name: "404", href: "#404" },
  ];

  return (
    <>
      {/* 1. Desktop Navbar (Original exact design, visible on md screens and up) */}
      <header className="hidden md:block sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer group">
            <img
              src="/uppercurve_logo_nav.png"
              alt="UpperCurve logo"
              className="h-8 w-auto group-hover:scale-105 transition-transform"
            />
            <span className="text-xl tracking-tight font-extrabold [font-family:var(--font-montserrat)]">
              <span className="text-[#0B1B42]">UPPER</span>
              <span className="text-indigo-600">CURVE</span>
            </span>
          </Link>

          <nav className="flex items-center gap-8 text-sm font-semibold text-gray-600">
            {navLinks.map((link) => {
              if (link.children) {
                return (
                  <div
                    key={link.name}
                    ref={resourcesDropdownRef}
                    className="relative"
                    onMouseEnter={() => setIsResourcesOpen(true)}
                    onMouseLeave={() => setIsResourcesOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setIsResourcesOpen((prev) => !prev)}
                      aria-expanded={isResourcesOpen}
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer py-2 ${isResourcesOpen ? "text-indigo-600" : "hover:text-black"
                        }`}
                    >
                      <span>{link.name}</span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isResourcesOpen ? "rotate-180 text-indigo-600" : "text-gray-400"
                          }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isResourcesOpen && (
                      <div className="absolute top-full left-0 pt-2 w-72 z-50">
                        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-2 flex flex-col gap-1 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                          {link.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              onClick={() => setIsResourcesOpen(false)}
                              className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                            >
                              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors mt-0.5 shrink-0">
                                {child.icon}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                  {child.name}
                                </div>
                                {child.description && (
                                  <div className="text-xs text-gray-500 font-normal leading-relaxed mt-0.5">
                                    {child.description}
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link key={link.name} href={link.href!} className="hover:text-black transition-colors">
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-[#0A66C2] flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
          </a>
        </div>
      </header>

      {/* 2. Mobile Floating Sticky Navbar Header (Single persistent navbar bar) */}
      <header className="md:hidden sticky top-4 z-50 w-full px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md mx-auto relative">
          {/* Persistent Floating Dark Bar */}
          <div className="bg-[#18181b] text-white rounded-full px-5 py-3 flex items-center justify-between shadow-[0_10px_25px_rgba(0,0,0,0.25)] border border-white/10 relative z-50">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/uppercurve_logo_nav.png"
                alt="UpperCurve logo"
                className="h-7 w-auto"
              />
              <span className="text-lg tracking-tight font-extrabold [font-family:var(--font-montserrat)]">
                <span className="text-white">UPPER</span>
                <span className="text-indigo-600">CURVE</span>
              </span>
            </Link>

            {/* Toggle Button (Hamburger when closed, Close 'X' when open) */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              className="w-11 h-11 rounded-full bg-[#27272a] hover:bg-[#3f3f46] flex items-center justify-center text-white transition-colors cursor-pointer active:scale-95"
            >
              {isOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 12h16M4 16h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Menu Card appearing right under the persistent navbar bar */}
          {isOpen && (
            <div className="absolute top-0 left-0 right-0 pt-20 bg-[#f8f8f8] rounded-[32px] p-5 flex flex-col border border-gray-200/60 shadow-2xl z-40 animate-slide-down">
              {/* Main Links */}
              <div className="flex flex-col space-y-3.5 px-2 pt-1">
                {navLinks.map((link) => {
                  if (link.children) {
                    return (
                      <div key={link.name} className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => setIsMobileResourcesOpen((prev) => !prev)}
                          className="flex items-center justify-between text-lg font-bold text-[#111111] hover:opacity-70 transition-opacity w-full text-left py-0.5"
                        >
                          <span>{link.name}</span>
                          <svg
                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isMobileResourcesOpen ? "rotate-180 text-indigo-600" : ""
                              }`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isMobileResourcesOpen && (
                          <div className="pl-3 mt-2.5 flex flex-col space-y-2 border-l-2 border-indigo-200 ml-1">
                            {link.children.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href}
                                onClick={() => {
                                  setIsOpen(false);
                                  setIsMobileResourcesOpen(false);
                                }}
                                className="py-1 px-2 rounded-lg text-base font-semibold text-gray-700 hover:text-indigo-600 hover:bg-gray-200/60 transition-all flex items-center gap-2.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span>{child.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={link.name}
                      href={link.href!}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-bold text-[#111111] hover:opacity-70 transition-opacity"
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              {/* Separator Divider Line */}
              <div className="border-t border-gray-200/80 my-5" />

              {/* Secondary Links */}
              <div className="flex flex-col space-y-3 px-2">
                {secondaryLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-base font-medium text-[#111111] hover:opacity-70 transition-opacity"
                  >
                    {link.name}
                  </a>
                ))}
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-3.5 my-5 px-2">
                {/* LinkedIn */}
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-black hover:scale-105 transition-transform"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </a>

                {/* X / Twitter */}
                {/* <a
                  href="#"
                  aria-label="X (Twitter)"
                  className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-black hover:scale-105 transition-transform"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a> */}

                {/* Instagram */}
                {/* <a
                  href="#"
                  aria-label="Instagram"
                  className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-black hover:scale-105 transition-transform"
                >
                  <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a> */}
              </div>

              {/* Bottom Full-Width Button */}
              {/* <div className="pt-2">

                <PrimaryButton className="w-full" onClick={() => setIsOpen(false)}>Explore programs</PrimaryButton>
              </div> */}
            </div>
          )}
        </div>
      </header>

      {/* Full-Screen White Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-white transition-opacity duration-300"
        />
      )}
    </>
  );
}

export default Navbar;

