'use client';

import React from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import Image from 'next/image';

// Simple SVG Icons for Socials to match the minimal hollow style in the mockup
export const CustomXIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
);

const CustomFacebookIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
);

const CustomInstagramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

const CustomDribbbleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
    </svg>
);

export const CustomLinkedInIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
    </svg>
);

const navLinks = [
    { name: 'Services', href: '/#services' },
    { name: 'Contact', href: '/contact-us' },
    { name: 'Privacy & Terms', href: '#' },
];


export function Footer() {
    return (
        <footer className="w-full  pt-16 pb-12 flex flex-col items-center">
            <div className="max-w-[1200px] w-full px-6 md:px-10 flex flex-col">

                {/* Top Row: Logo & Socials */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-16 gap-8">
                    {/* Mockup Logo */}
                    <Link href="/" className="flex items-center gap-2 text-white/90 group">
                        <Image
                            src="/RhinonLabs_Dark.png"
                            alt="Rhinon Labs"
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain transition-transform"
                        />
                        <span className="text-2xl font-serif italic tracking-wide">Rhinon Labs</span>
                    </Link>

                    {/* Social Icons */}
                    <div className="flex items-center gap-6 text-white/50">
                        <a href="https://x.com/RhinonLabs" target="_blank" className="hover:text-white transition-colors"><CustomXIcon /></a>
                        <a href="https://www.instagram.com/rhinonlabs/" target="_blank" className="hover:text-white transition-colors"><CustomInstagramIcon /></a>
                        <a href="https://www.linkedin.com/company/rhinonlabs" target="_blank" className="hover:text-white transition-colors"><CustomLinkedInIcon /></a>
                    </div>
                </div>

                {/* Middle Row: Navigation Links */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-16">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-[15px] font-medium text-white/70 hover:text-white transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-white/10 mb-8" />

                {/* Bottom Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[13px] text-white/60 gap-4">
                    <p>© {new Date().getFullYear()} Rhinon Labs</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                        {/* <p>Made by <span className="text-white/80 font-medium">Framebase</span></p> */}
                        <a href="mailto:rhinonLabs@support.com" className="text-white/80 font-medium flex items-center gap-2 hover:text-white transition-colors">
                            <Mail className='h-4 w-4' /> Send us an email
                        </a>
                    </div>
                </div>

            </div>
        </footer>
    );
}
