'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Star } from 'lucide-react';

const caseStudies = [
    {
        id: 1,
        title: "Emily's E-commerce Success",
        description: "Emily, the CEO of BloomTech, transformed their marketing efforts using AI-powered tools. This shift resulted in a 60% increase in ROI and a 45% improvement in customer personalization, leading to a surge in brand loyalty",
        stats: [
            { value: "70", suffix: " %", label: "growth in sales" },
            { value: "50", suffix: " %", label: "rise in engagement" }
        ],
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
        quote: (
            <>
                "They grasped our <span className="font-serif italic text-white/90">pain points</span>, knew exactly who we needed to reach, and helped us stand out. Their solutions delivered real, <span className="font-serif italic text-white/90">impactful results!</span>"
            </>
        )
    },
    {
        id: 2,
        title: "Marcus's SaaS Scaling",
        description: "Marcus, founder of CloudScale, automated their entire sales funnel with our platform. The implementation reduced customer acquisition costs by 40% while doubling the the conversion rate of their enterprise leads.",
        stats: [
            { value: "2x", suffix: "", label: "conversion rate" },
            { value: "40", suffix: " %", label: "lower CAC" }
        ],
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop",
        quote: (
            <>
                "The automation completely transformed our <span className="font-serif italic text-white/90">sales pipeline</span>. We're now closing enterprise deals faster with significantly <span className="font-serif italic text-white/90">less manual effort!</span>"
            </>
        )
    },
    {
        id: 3,
        title: "Sarah's Creative Agency",
        description: "Sarah's design agency utilized our analytics dashboard to track client project health. Having real-time insights allowed them to increase project delivery speed and dramatically boost client retention rates.",
        stats: [
            { value: "3x", suffix: "", label: "delivery speed" },
            { value: "85", suffix: " %", label: "client retention" }
        ],
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop",
        quote: (
            <>
                "Having <span className="font-serif italic text-white/90">real-time insights</span> completely changed how we operate. Our clients are happier, and our team is <span className="font-serif italic text-white/90">more productive than ever!</span>"
            </>
        )
    }
];

export function CaseStudies() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % caseStudies.length);
        }, 10000); // 10s delay as requested
        return () => clearInterval(timer);
    }, []);

    const activeStudy = caseStudies[currentIndex];

    return (
        <section id="case-studies" className="py-24 relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 relative z-10 flex flex-col items-center">

                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-16">
                    <div className="mb-6 inline-flex items-center px-4 py-1.5 rounded-full border border-white/10 bg-[#0F131C] backdrop-blur-md">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60 mr-2" />
                        <span className="text-[11px] font-semibold tracking-wider text-white/80 uppercase font-sans">
                            OUR CLIENTS
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white to-white/60 mb-4">
                        Real Results. <span className="font-serif italic text-transparent bg-clip-text">Real Impact</span>
                    </h2>
                    <p className=" opacity-60 text-sm md:text-base">
                        Discover how businesses and creators achieve results
                    </p>
                </div>

                {/* Cards Stack Container */}
                <div className="relative w-full max-w-[1000px] h-[480px] md:h-[500px] mb-12 perspective-[1000px]">
                    <AnimatePresence mode="popLayout">
                        {caseStudies.map((study, idx) => {
                            const offset = (idx - currentIndex + caseStudies.length) % caseStudies.length;

                            const isVisible = offset < 3;
                            if (!isVisible) return null;

                            // offset 0 (front): scale 1, y 0
                            // offset 1 (middle): scale 0.95, y -40
                            // offset 2 (back): scale 0.9, y -80
                            const scale = 1 - offset * 0.05;
                            const y = -offset * 40;
                            const zIndex = 30 - offset * 10;
                            const brightness = 1 - offset * 0.2;
                            const blur = offset * 2; // 0px for front, 2px for middle, 4px for back

                            return (
                                <motion.div
                                    key={study.id}
                                    initial={false}
                                    animate={{
                                        scale,
                                        y,
                                        zIndex,
                                        filter: `brightness(${brightness}) blur(${blur}px)`,
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                    className="absolute top-[80px] left-0 right-0 bg-background mx-auto w-full md:w-[1000px] rounded-[12px] border-x border-b border-border/7  overflow-hidden  transform-origin-top"
                                    style={{ transformOrigin: "top center" }}
                                >
                                    {/* Mockup Window Header */}
                                    <div className="flex items-center justify-between px-5 py-3 bg-background rounded-[12px] border border-border/7 shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)]">
                                        <div className="flex items-center text-white">
                                            <User className="w-7 h-7" />
                                        </div>
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-white/20" />
                                            <div className="w-2 h-2 rounded-full bg-white/20" />
                                            <div className="w-2 h-2 rounded-full bg-white/20" />
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-8 flex flex-col md:flex-row gap-8 items-center bg-background">
                                        {/* Left Text */}
                                        <div className="flex-1 text-left w-full">
                                            <h3 className="text-[28px] max-sm:text-[20px] font-semibold  mb-4 tracking-tight">
                                                {study.title}
                                            </h3>
                                            <p className=" text-[18px] max-sm:text-[14px] leading-[1.6] opacity-60 mb-8 max-w-[90%]">
                                                {study.description}
                                            </p>
                                            <div className="flex gap-4">
                                                {study.stats.map((stat, i) => (
                                                    <div key={i} className="flex-1 overflow-hidden relative rounded-[12px] border border-border/7 shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)]  p-4 max-sm:p-2 text-center">
                                                        <div className="text-4xl max-sm:text-xl font- text-white mb-1">
                                                            {stat.value}
                                                            <span className="text-base max-sm:text-sm font-medium text-white/60">{stat.suffix}</span>
                                                        </div>
                                                        <div className="text-[16px] max-sm:text-[12px] tracking-wide opacity-60">{stat.label}</div>

                                                        {/* Subtle Top Right Glow */}
                                                        <div
                                                            className="absolute top-0 right-0 pointer-events-none z-1"
                                                            style={{
                                                                width: '437px',
                                                                height: '306px',
                                                                background: 'radial-gradient(circle, rgba(184, 199, 217, 0.5) 0%, rgba(184, 199, 217, 0) 100%)',
                                                                opacity: 0.1,
                                                                transform: 'translate(50%, -50%)'
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Right Image */}
                                        <div className="flex-1 max-sm:hidden w-full h-[300px]">
                                            <img
                                                src={study.image}
                                                alt={study.title}
                                                className="w-full h-full object-cover rounded-[12px]"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Quote Section */}
                <div className="max-w-[700px] text-center mb-8 h-[100px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={currentIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                            className="text-xl md:text-[26px] leading-snug text-[#8B9DB0] font-light"
                        >
                            {activeStudy.quote}
                        </motion.p>
                    </AnimatePresence>
                </div>

                {/* Pagination Dots */}
                <div className="flex gap-2">
                    {caseStudies.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-[5px] h-[5px] rounded-full cursor-pointer transition-colors duration-300 ${currentIndex === idx ? 'bg-white' : 'bg-white/20 hover:bg-white/40'
                                }`}
                        />
                    ))}
                </div>

            </div>

            {/* Background Glows */}
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
        </section>
    );
}
