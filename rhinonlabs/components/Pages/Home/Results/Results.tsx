'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { div } from 'framer-motion/client';

const scrollVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const stats = [
    { value: "100s", label: "of monthly hours saved" },
    { value: "Guesswork", label: "to real-time visibility" },
    { value: "Grow", label: "without hiring more" },
    { value: "Become", label: "AI-first organization" },
    { value: "24/7", label: "Automation uptime" },
    { value: "98%", label: "Workflow accuracy" },
    { value: "85%", label: "reduction in manual tasks" },
    { value: "50+", label: "tools integrated" }
];

export function Results() {
    return (
        <section id="results" className="py-24 relative overflow-hidden">
            <div className="max-w-full mx-auto px-6 relative z-10">

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={scrollVariant}
                    className="flex flex-col items-center text-center mb-10"
                >
                    <div className="mb-6 inline-flex items-center px-4 py-2 rounded-full border border-white/5 bg-white/5 backdrop-blur-md">
                        <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans">
                            Measurable Impact
                        </span>
                    </div>
                    <h2 className="text-4xl md:h-16 md:text-5xl font-medium tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-white/60">
                        What changes after <span className="font-serif italic text-transparent bg-clip-text ">we work together</span>
                    </h2>
                </motion.div>

                {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div
                            key={i}
                            className="p-8 rounded-[2rem] bg-color-card border border-white/5 hover:border-white/10 transition-colors flex flex-col items-center text-center justify-center min-h-[220px]"
                        >
                            <h3 className="text-4xl md:text-5xl font-medium text-white mb-4 tracking-tight drop-shadow-md">
                                {stat.value}
                            </h3>
                            <p className="text-[#A3B8CC] text-sm leading-relaxed font-light">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div> */}
                <div className='gap-4 justify-center grid grid-cols-1 max-sm:px-14 sm:grid-cols-2 md:grid-cols-4 max-w-7xl mx-auto'>
                    {stats.map((stat, i) => (
                        <div key={i} className='flex hover:scale-105 transition-all duration-300 ease-in-out gap-1.5 items-center justify-center px-5 py-2.5 rounded-full bg-white shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.7)]'>
                            <span className="text-[15px] max-sm:text-[12px] italic font-semibold text-[#111] tracking-tight">
                                {stat.value}
                            </span>
                            <span className="text-[15px] max-sm:text-[12px] font-medium text-[#666] tracking-tighter">
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </div>

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
        </section>
    );
}
