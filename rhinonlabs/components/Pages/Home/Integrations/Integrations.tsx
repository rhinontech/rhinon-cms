'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import {
    Layers,
    Figma, Twitter, Facebook, Youtube, Slack, Github,
    Chrome, Contact, Instagram, Smartphone, Database, Box,
    Cloud, CreditCard, Server, Network, Cpu
} from 'lucide-react';

const scrollVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const row1 = [Figma, Twitter, Facebook, Youtube, Slack, Github, Layers];
const row2 = [Chrome, Contact, Box, Instagram, Smartphone, Database, Github];
const row3 = [Cloud, CreditCard, Server, Cpu, Network, Box, Cloud];

export function Integrations() {
    return (
        <section id="integrations" className="py-24 relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 relative z-10 flex flex-col items-center text-center">

                {/* Badge */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={scrollVariant}
                    className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)]"
                >
                    <Layers className="w-4 h-4 text-white" />
                    <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans">
                        Integrations
                    </span>
                </motion.div>

                {/* Headings */}
                <motion.h2
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={scrollVariant}
                    className="text-4xl md:text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white/90 to-white/50 mb-6"
                >
                    Seamless <span className="font-serif italic text-transparent bg-clip-text ">Integrations</span>
                </motion.h2>

                <motion.p
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={scrollVariant}
                    className="opacity-70 mb-16 max-w-2xl"
                >
                    Interact with all your favorite software without unnecessary fuss
                </motion.p>

                {/* Integrations Container */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={scrollVariant}
                    className="relative w-full max-w-[600px] rounded-[16px] py-16 mb-16 overflow-hidden"
                >
                    {/* Inner shadow overlay so gradients don't overlap it */}
                    <div className="absolute inset-0 pointer-events-none z-20 rounded-[16px] shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)]" />

                    {/* Fading Edges for the marquee */}
                    <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-linear-to-r from-background to-transparent z-2 pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-linear-to-l from-background to-transparent z-2 pointer-events-none" />
                    <div
                        className="absolute top-0 right-0 pointer-events-none z-10"
                        style={{
                            width: '437px',
                            height: '306px',
                            background: 'radial-gradient(50% 50% at 50% 50%, rgba(184, 199, 217, 0.5) 0%, rgba(184, 199, 217, 0) 100%)',
                            opacity: 0.1,
                            transform: 'translate(50%, -50%)'
                        }}
                    />

                    <div className="flex flex-col gap-8 md:gap-14">
                        {/* Row 1 - Moves Left */}
                        <div className="flex overflow-hidden">
                            <motion.div
                                animate={{ x: [0, "-50%"] }}
                                transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                                className="flex items-center gap-8 md:gap-14 w-max pr-8 md:pr-14"
                            >
                                <div className="flex items-center gap-8 md:gap-14">
                                    {row1.map((Icon, i) => (
                                        <div key={`r1-1-${i}`} className="w-16 h-16 md:w-16 md:h-16 rounded-xl shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] bg-[#10131c] flex items-center justify-center ">
                                            <Icon strokeWidth={1.5} className="w-8 h-8 text-white/70 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-8 md:gap-14">
                                    {row1.map((Icon, i) => (
                                        <div key={`r1-2-${i}`} className="w-16 h-16 md:w-16 md:h-16 rounded-xl shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] bg-[#10131c] flex items-center justify-center ">
                                            <Icon strokeWidth={1.5} className="w-8 h-8 text-white/70 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Row 2 - Moves Right */}
                        <div className="flex overflow-hidden">
                            <motion.div
                                animate={{ x: ["-50%", 0] }}
                                transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
                                className="flex items-center gap-8 md:gap-14 w-max pr-8 md:pr-14"
                            >
                                <div className="flex items-center gap-8 md:gap-14">
                                    {row2.map((Icon, i) => (
                                        <div key={`r2-1-${i}`} className="w-16 h-16 md:w-16 md:h-16 rounded-xl shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] bg-[#10131c] flex items-center justify-center ">
                                            <Icon strokeWidth={1.5} className="w-8 h-8 text-white/70 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-8 md:gap-14">
                                    {row2.map((Icon, i) => (
                                        <div key={`r2-2-${i}`} className="w-16 h-16 md:w-16 md:h-16 rounded-xl shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] bg-[#10131c] flex items-center justify-center ">
                                            <Icon strokeWidth={1.5} className="w-8 h-8 text-white/70 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Row 3 - Moves Left */}
                        <div className="flex overflow-hidden">
                            <motion.div
                                animate={{ x: [0, "-50%"] }}
                                transition={{ repeat: Infinity, duration: 35, ease: "linear" }}
                                className="flex items-center gap-8 md:gap-14 w-max pr-8 md:pr-14"
                            >
                                <div className="flex items-center gap-8 md:gap-14">
                                    {row3.map((Icon, i) => (
                                        <div key={`r3-1-${i}`} className="w-16 h-16 md:w-16 md:h-16 rounded-xl shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] bg-[#10131c] flex items-center justify-center ">
                                            <Icon strokeWidth={1.5} className="w-8 h-8 text-white/70 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-8 md:gap-14">
                                    {row3.map((Icon, i) => (
                                        <div key={`r3-2-${i}`} className="w-16 h-16 md:w-16 md:h-16 rounded-xl shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] bg-[#10131c] flex items-center justify-center">
                                            <Icon strokeWidth={1.5} className="w-8 h-8 text-white/70 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Bottom Text */}
                <motion.p
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={scrollVariant}
                    className="opacity-70  max-w-2xl"
                >
                    &quot;Our AI automation plugs into your stack to create a unified, intelligent workflow&quot;
                </motion.p>

            </div>

            {/* Existing Dividers/Overlays similarly added to other sections */}
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
