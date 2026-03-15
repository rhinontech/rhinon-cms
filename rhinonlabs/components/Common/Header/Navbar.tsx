'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';


const navLinks = [
    { title: "Services", href: "/#services" },
    { title: "Process", href: "/#process" },
    { title: "Automations", href: "/#our_products" },
    { title: "Contact", href: "/contact-us" }
]

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Check for hash on load or after route changes so it still scrolls down if navigating from /contact -> /#services
    useEffect(() => {
        if (window.location.hash) {
            const id = window.location.hash;
            const element = document.querySelector(id);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100); // slight delay to let Nextjs render the page first
            }
        }
    }, [pathname]);

    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        // If it's a hash link pointing to the homepage (e.g. /#services)
        if (href.startsWith('/#')) {
            const targetId = href.replace('/#', '#');

            // If we are already on the homepage where these sections exist, smoothly scroll
            if (pathname === '/') {
                e.preventDefault();
                const elem = document.querySelector(targetId);
                if (elem) {
                    elem.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', href);
                }
            } else {
                // If we are on /contact, let it navigate naturally (the useEffect above catches the hash)
                // We use router.push here to ensure it properly changes pages internally with Next.js
                e.preventDefault();
                router.push(href);
            }
        }
        setIsOpen(false);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300 py-4">
            <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <Image
                        src="/RhinonLabs_Dark.png"
                        alt="Rhinon Labs"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain transition-transform"
                    />
                    <span className="text-2xl font-serif italic tracking-wide">Rhinon Labs</span>
                </Link>

                {/* Desktop Nav */}


                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((item) => (
                        <Link
                            key={item.title}
                            href={item.href}
                            onClick={(e) => handleScroll(e, item.href)}
                            className="text-sm text-color-muted hover:text-white transition-colors"
                        >
                            {item.title}
                        </Link>
                    ))}
                </nav>

                {/* Action Button & Mobile Toggle */}
                <div className="flex items-center gap-4">
                    <Button variant="default" size="default" className="hidden sm:inline-flex">
                        Free Resources
                    </Button>

                    <button
                        className="md:hidden text-white/70 hover:text-white transition-colors flex items-center justify-center p-2"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle Menu"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden absolute top-20 left-0 w-full bg-background border-b border-white/5 py-4 px-6 shadow-2xl flex flex-col gap-4 z-40"
                    >
                        {navLinks.map((item) => (
                            <Link
                                key={item.title}
                                href={item.href}
                                onClick={(e) => handleScroll(e, item.href)}
                                className="text-base text-color-muted hover:text-white transition-colors py-2 border-b border-white/5 last:border-0"
                            >
                                {item.title}
                            </Link>
                        ))}
                        <Button variant="default" size="default" className="w-full mt-2 sm:hidden">
                            Free Resources
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
