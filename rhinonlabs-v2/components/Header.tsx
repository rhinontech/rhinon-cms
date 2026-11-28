'use client';

import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { STITCH_IMAGES } from '../data/rhinonData';
import { ResilientImage } from './ResilientImage';

interface HeaderProps {
  onNavigateContact: (presetTopic?: string) => void;
  onOpenSecurityModal: () => void;
}

export function Header({ onNavigateContact, onOpenSecurityModal }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <header
      id="site-header"
      className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <a
            href="#top"
            aria-label="RhinonLabs Home"
            className="flex items-center shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121314] rounded-md"
          >
            <ResilientImage
              src={STITCH_IMAGES.logoLight}
              alt="RhinonLabs Logo"
              className="h-7 sm:h-8 w-auto object-contain"
              fallbackTitle="RhinonLabs"
              fallbackSubtitle=""
            />
          </a>

          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#535A61]"
          >
            <a href="#services" className="hover:text-[#121314] transition-colors whitespace-nowrap">
              Services
            </a>
            <a href="#solutions" className="hover:text-[#121314] transition-colors whitespace-nowrap">
              AI Solutions
            </a>
            <a href="#work" className="hover:text-[#121314] transition-colors whitespace-nowrap">
              Case Studies
            </a>
            <a href="#labs" className="hover:text-[#121314] transition-colors whitespace-nowrap">
              Labs
            </a>
            <a href="#industries" className="hover:text-[#121314] transition-colors whitespace-nowrap">
              Industries
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateContact()}
            className="bg-[#121314] hover:bg-[#2A2D30] text-white text-sm font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121314] focus-visible:ring-offset-2"
          >
            <span className="sm:hidden">Book Call</span>
            <span className="hidden sm:inline">Book A 30-Minute Call</span>
          </button>

          <button
            id="menu-toggle-btn"
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2.5 rounded-full bg-[#F4F5F7] hover:bg-gray-200/80 text-[#121314] transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121314]"
          >
            {menuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="menu-drawer"
          className="border-t border-gray-100 bg-white px-5 sm:px-8 py-6 shadow-xl"
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-wider text-[#6B7280]">
                Engineering
              </span>
              <a
                href="#why-us"
                onClick={handleLinkClick}
                className="text-sm font-medium text-[#121314] hover:text-[#FF6A2B] py-0.5"
              >
                Why RhinonLabs
              </a>
              <a
                href="#services"
                onClick={handleLinkClick}
                className="text-sm font-medium text-[#121314] hover:text-[#FF6A2B] py-0.5"
              >
                Engineering Services
              </a>
              <a
                href="#process"
                onClick={handleLinkClick}
                className="text-sm font-medium text-[#121314] hover:text-[#FF6A2B] py-0.5"
              >
                AI Velocity Pods
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-wider text-[#6B7280]">
                AI &amp; Labs
              </span>
              <a
                href="#solutions"
                onClick={handleLinkClick}
                className="text-sm font-medium text-[#121314] hover:text-[#FF6A2B] py-0.5"
              >
                AI Automation Solutions
              </a>
              <a
                href="#labs"
                onClick={handleLinkClick}
                className="text-sm font-medium text-[#121314] hover:text-[#FF6A2B] py-0.5"
              >
                RhinonLabs Labs Products
              </a>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenSecurityModal();
                }}
                className="text-left text-sm font-medium text-[#121314] hover:text-[#FF6A2B] py-0.5 cursor-pointer"
              >
                Security &amp; Compliance
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-wider text-[#6B7280]">
                Proof
              </span>
              <a
                href="#work"
                onClick={handleLinkClick}
                className="text-sm font-medium text-[#121314] hover:text-[#FF6A2B] py-0.5"
              >
                13 Case Studies
              </a>
              <a
                href="#industries"
                onClick={handleLinkClick}
                className="text-sm font-medium text-[#121314] hover:text-[#FF6A2B] py-0.5"
              >
                Industries Served
              </a>
              <a
                href="#voices"
                onClick={handleLinkClick}
                className="text-sm font-medium text-[#121314] hover:text-[#FF6A2B] py-0.5"
              >
                Client Voices
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="font-label text-xs uppercase tracking-wider text-[#6B7280]">
                Connect
              </span>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigateContact();
                }}
                className="text-left text-sm font-medium text-[#121314] hover:text-[#FF6A2B] py-0.5 cursor-pointer"
              >
                Start Project Discussion
              </button>
              <a
                href="mailto:hello@rhinonlabs.com"
                className="text-sm text-[#535A61] hover:text-[#FF6A2B]"
              >
                hello@rhinonlabs.com
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
