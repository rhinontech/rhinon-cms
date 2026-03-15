'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Check, Hexagon, Triangle, Command, CircleDashed, Sparkles, Infinity as InfinityIcon } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { ParticleOverlay } from '@/components/Common/ParticleOverlay/ParticleOverlay';
import Link from 'next/link';


const fadeUpVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
};

export function Hero() {
    return (
        <section className="relative pt-28 pb-16 flex flex-col items-center justify-center min-h-screen overflow-hidden">
            {/* Background Video */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute min-w-full min-h-[150vh] md:min-h-full object-cover bg-[#CC0808] grayscale-100 opacity-40 scale-150 md:scale-100"
                >
                    <source src="/heroVideo.mp4" />
                </video>
            </div>

            {/* Background Overlay */}
            <div
                className="absolute inset-0 pointer-events-none z-3"
                style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0) 0%, #000000 100%)',
                }}
            />

            <ParticleOverlay />

            {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(28,43,255,0.15)_0,transparent_50%)] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" /> */}

            <div className="max-w-[1200px] mx-auto px-6 relative z-10 flex flex-col items-center text-center mt-12">

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
                    }}
                    className="flex flex-col items-center"
                >
                    {/* Badge */}
                    <motion.div variants={fadeUpVariant} className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-medium tracking-widest text-[#A3B8CC] uppercase font-sans">
                            Your Go-To Operations Scaling Partner
                        </span>
                    </motion.div>

                    {/* Main Heading */}
                    <motion.h1
                        variants={fadeUpVariant}
                        className="text-[42px] sm:text-5xl md:text-[80px] font-sans font-normal leading-[1.1] tracking-[-0.02em] max-w-4xl mx-auto py-2 text-transparent bg-clip-text bg-linear-to-b from-white/90 to-white/50 mb-6"
                    >
                        Scale Your Operations, <br className="sm:hidden" /> <span className="font-serif italic text-transparent bg-clip-text">Not Your Headcount.</span>
                    </motion.h1>
                    {/* <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white/90 to-white/50 mb-4">
                        Our Simple & <span className="font-serif italic text-transparent bg-clip-text">Smart Process</span>
                    </h2> */}


                    {/* Subtitle */}
                    <motion.p variants={fadeUpVariant} className="text-white/70 sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 px-4 sm:px-0">
                        We design and build custom AI workflows, automations, and internal dashboards that reduce manual work and help your team work faster and smarter.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row items-center gap-4 relative z-20">
                        <Button size="lg" className="w-full sm:w-auto group rounded-full px-8 bg-[#1c2bff] hover:bg-blue-700 text-white border-0">
                            Book Your Free Automation Audit
                            <ArrowUpRight className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Button>
                        <Link href="/#our_products" className="w-full sm:w-auto">
                            <Button size="lg" variant="outline" className="w-full group rounded-full px-8 border-white/20 text-white hover:bg-white/5">
                                Explore what we build
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Objection Handling */}
                    <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 mt-10 text-sm md:text-base text-[#A3B8CC] font-medium px-4">
                        <div className="flex items-center gap-2"><Check className="w-5 h-5 text-[#e4fe00]" /> Zero technical complexity</div>
                        <div className="flex items-center gap-2"><Check className="w-5 h-5 text-[#e4fe00]" /> Predictable ROI</div>
                        <div className="flex items-center gap-2"><Check className="w-5 h-5 text-[#e4fe00]" /> Flexible and structured process</div>
                    </motion.div>
                </motion.div>

                {/* Marquee (Tech Stack) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="mt-16 sm:mt-28 w-[70vw] sm:w-full max-w-full overflow-hidden relative fade-mask flex flex-col items-center"
                    style={{
                        maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
                    }}
                >
                    <div className="mb-6 sm:mb-8 text-xs sm:text-sm font-medium tracking-widest text-[#A3B8CC] uppercase font-sans text-center">
                        Our Tech Stack Partners
                    </div>

                    <div className="w-full max-w-[70vw] overflow-hidden">
                        <motion.div
                            animate={{ x: [0, "-50%"] }}
                            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                            className="flex items-center gap-8 sm:gap-24 whitespace-nowrap opacity-80 w-max pr-8 sm:pr-24"
                        >
                            {/* First Set */}
                            <div className="flex items-center gap-12 sm:gap-24">
                                {[
                                    { name: 'Lumina', icon: Hexagon },
                                    { name: 'Nexis', icon: Triangle },
                                    { name: 'Vertex', icon: Command },
                                    { name: 'Aura', icon: CircleDashed },
                                    { name: 'Pulse', icon: Sparkles },
                                    { name: 'Zenith', icon: InfinityIcon }
                                ].map((Company, i) => (
                                    <div key={i} className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity duration-300">
                                        <Company.icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#A3B8CC]" />
                                        <span className="text-xl sm:text-2xl font-bold tracking-tight font-sans text-[#A3B8CC]">{Company.name}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Second Set (Duplicate) */}
                            <div className="flex items-center gap-12 sm:gap-24">
                                {[
                                    { name: 'Lumina', icon: Hexagon },
                                    { name: 'Nexis', icon: Triangle },
                                    { name: 'Vertex', icon: Command },
                                    { name: 'Aura', icon: CircleDashed },
                                    { name: 'Pulse', icon: Sparkles },
                                    { name: 'Zenith', icon: InfinityIcon }
                                ].map((Company, i) => (
                                    <div key={`dup-${i}`} className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity duration-300">
                                        <Company.icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#A3B8CC]" />
                                        <span className="text-xl sm:text-2xl font-bold tracking-tight font-sans text-[#A3B8CC]">{Company.name}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
            <div
                className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[1200px] h-[4px]"
                style={{
                    background: 'radial-gradient(50% 50% at 50% 50%, rgba(216, 231, 242, 0.07) 0%, rgba(216, 231, 242, 0) 100%)'
                }}
            />

            <div
                className="absolute -bottom-[249px] left-0 right-0 mx-auto w-[793px] h-[499px] opacity-10 pointer-events-none -rotate-13 rounded-[10px]"
                style={{
                    background: 'radial-gradient(50% 50% at 50% 50%, rgba(213, 219, 230, 0.7) 0%, rgba(213, 219, 230, 0) 100%)',
                    zIndex: 1
                }}
            />

            {/* Grid overlay for texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none mix-blend-overlay" />
        </section>
    );
}
