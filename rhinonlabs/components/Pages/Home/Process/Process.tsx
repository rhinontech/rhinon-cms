'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
    {
        id: '01',
        tab: 'STEP 1',
        title: 'Free Discovery Call',
        description: 'We understand how your business runs today. Where most time is lost, where work feels messy, and what’s slowing your team down.',
    },
    {
        id: '02',
        tab: 'STEP 2',
        title: 'Strategy Sprint',
        description: 'We map out the exact systems and automations needed to fix the gaps and give you a clear plan before anything is built.',
    },
    {
        id: '03',
        tab: 'STEP 3',
        title: 'Build & Connect',
        description: 'We design and build your dashboards, automations, and AI tools and connect everything to your existing systems.',
    },
    {
        id: '04',
        tab: 'STEP 4',
        title: 'Deploy & Enablement',
        description: 'We deploy the system, train your team and make sure everything runs smoothly.',
    }
];

export function Process() {
    const [active, setActive] = useState(0);

    // Auto-advance every 12 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setActive((prev) => (prev + 1) % steps.length);
        }, 12000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section id="process" className="py-32 relative overflow-hidden bg-background flex flex-col items-center">
            {/* Header Area */}
            <div className="flex flex-col items-center text-center mb-16 z-10 px-6">
                <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                    {/* Small abstract chart icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white/70">
                        <rect x="3" y="16" width="4" height="5" fill="currentColor" rx="1" />
                        <rect x="10" y="10" width="4" height="11" fill="currentColor" rx="1" />
                        <rect x="17" y="4" width="4" height="17" fill="currentColor" rx="1" />
                    </svg>
                    <span className="text-[11px] font-bold tracking-[0.2em] text-[#A3B8CC] uppercase font-sans">
                        Our Process
                    </span>
                </div>

                <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white/90 to-white/50 ">
                    How we <span className="font-serif italic text-transparent bg-clip-text">Work</span>
                </h2>
                {/* <p className=" max-w-xl">
                    Everything you need to collaborate, create, and scale, all in one place.
                </p> */}
            </div>

            {/* Main Interactive Box */}
            <div className="max-w-[1200px]  w-full mx-auto px-4 relative z-10">
                <div className="rounded-2xl  border border-border/7 shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)]  overflow-hidden flex flex-col max-sm:min-h-[700px]  relative min-h-[600px]">

                    {/* Subtle Top Glow inside the container */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[100px]  blur-[50px] pointer-events-none" />

                    {/* Tabs */}
                    <div className="flex px-4 pt-4 pb-4 gap-2 relative z-20 flex-wrap sm:flex-nowrap">
                        {steps.map((step, index) => {
                            const isActive = index === active;
                            return (
                                <button
                                    key={step.tab}
                                    onClick={() => setActive(index)}
                                    className={`flex-1 min-w-[100px] py-4 rounded-[8px] text-xs font-bold tracking-[0.15em] transition-all duration-300 relative  shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)] ${isActive
                                        ? 'bg-[#10131c] '
                                        : 'bg-[#10131c]/50 text-white/50 hover:bg-[#10131c]/20'
                                        }`}
                                >
                                    {step.tab}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="relative flex-1 overflow-hidden flex items-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute inset-0 p-8  md:p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-24"
                            >
                                {/* Left Graphic Mockup */}
                                <div className="flex-1 w-full h-[250px] lg:h-full relative flex items-center justify-center pointer-events-none perspective-1000">

                                    {/* Variation based on step */}
                                    {active === 0 && (
                                        <div className="w-[80%] max-w-[320px] aspect-square bg-[#121215] rounded-full border border-white/5 shadow-2xl flex items-center justify-center relative animate-pulse-slow">
                                            <div className="absolute inset-0 rounded-full border border-[#1c2bff]/20 scale-[1.2]" />
                                            <div className="absolute inset-0 rounded-full border border-white/5 scale-[1.4]" />
                                            <div className="w-20 h-20 rounded-full bg-linear-to-b from-[#1c2bff] to-purple-500 shadow-[0_0_40px_rgba(28,43,255,0.4)] flex items-center justify-center">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white">
                                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}

                                    {active === 1 && (
                                        <div className="w-full max-w-[400px] h-[200px] flex items-center justify-between relative px-8">
                                            <div className="absolute top-1/2 left-8 right-8 h-[2px] bg-white/5 -translate-y-1/2" />
                                            <div className="absolute top-1/2 left-8 right-1/2 h-[2px] bg-linear-to-r from-[#e4fe00] to-transparent -translate-y-1/2" />
                                            <div className="w-16 h-16 rounded-2xl bg-[#121215] border border-white/10 z-10 shadow-xl flex items-center justify-center"><div className="w-4 h-4 rounded-full bg-white/20" /></div>
                                            <div className="w-20 h-20 rounded-2xl bg-[#121215] border border-[#e4fe00]/30 z-10 shadow-[0_0_30px_rgba(228,254,0,0.1)] flex items-center justify-center"><div className="w-6 h-6 rounded-full bg-[#e4fe00]" /></div>
                                            <div className="w-16 h-16 rounded-2xl bg-[#121215] border border-white/10 z-10 shadow-xl flex items-center justify-center"><div className="w-4 h-4 rounded-full bg-white/20" /></div>
                                        </div>
                                    )}

                                    {active === 2 && (
                                        <>
                                            {/* Dashboard Mock Window */}
                                            <div className="absolute left-[-5%] md:left-10 lg:left-0 top-[0%] md:top-[10%] w-[90%] md:w-[60%] lg:w-[320px] aspect-[4/3] bg-[#0c0c0e] rounded-xl border border-white/5 shadow-2xl flex flex-col p-4 opacity-80 scale-95">
                                                <div className="flex justify-between items-center mb-6">
                                                    <div className="text-[10px] text-white/40 font-medium">Activity</div>
                                                    <div className="text-[10px] text-white/40 font-medium">Month</div>
                                                </div>
                                                {/* Fake Bar Chart */}
                                                <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-4 border-b border-white/5">
                                                    {[40, 70, 45, 90, 65, 80, 50, 95].map((h, i) => (
                                                        <div key={i} className="w-full flex justify-center relative group">
                                                            <div className="w-full max-w-[12px] rounded-t-sm bg-[#222]" style={{ height: `${h}%` }}>
                                                                {i === 4 && <div className="w-full h-full bg-white/20 rounded-t-sm" />}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex pt-4 gap-6">
                                                    <div>
                                                        <div className="flex items-center gap-1.5 mb-1"><div className="w-2 h-2 rounded-sm bg-white/20" /><span className="text-[10px] text-white/50">Users</span></div>
                                                        <div className="text-white font-medium text-lg">3,6K</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Floating Code Mock Window */}
                                            <div className="absolute right-[-5%] md:right-10 lg:right-[-20px] bottom-[0%] md:bottom-[10%] w-[95%] md:w-[70%] lg:w-[400px] bg-[#121214]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] p-5 z-20">
                                                <div className="font-mono text-[10px] md:text-[11px] leading-relaxed text-[#a1a1aa] overflow-hidden whitespace-nowrap">
                                                    <div className="text-white/30 mb-2">// Build & Implement -&gt;</div>
                                                    <div><span className="text-[#c678dd]">async function</span> <span className="text-[#61afef]">generate</span>(prompt) {'{'}</div>
                                                    <div className="pl-4"><span className="text-[#c678dd]">const</span> res = <span className="text-[#c678dd]">await</span> <span className="text-[#56b6c2]">fetch</span>(<span className="text-[#98c379]">'https://api...'</span>, {'{'}</div>
                                                    <div className="pl-8">method: <span className="text-[#98c379]">'POST'</span>,</div>
                                                    <div className="pl-8">headers: {'{'}</div>
                                                    <div className="pl-12"><span className="text-[#98c379]">'Content-Type'</span>: <span className="text-[#98c379]">'application/json'</span></div>
                                                    <div className="pl-8">{'}'},</div>
                                                    <div className="pl-8">body: <span className="text-[#e5c07b]">JSON</span>.<span className="text-[#56b6c2]">stringify</span>({'{'}</div>
                                                    <div className="pl-12">model: <span className="text-[#98c379]">'gpt-4'</span>,</div>
                                                    <div className="pl-8">{'}'})</div>
                                                    <div>{'}'}</div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {active === 3 && (
                                        <div className="w-full max-w-[350px] aspect-video bg-[#121215] rounded-xl border border-white/5 shadow-[0_0_50px_rgba(28,43,255,0.1)] flex flex-col items-center justify-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(28,43,255,0.2),transparent_70%)]" />
                                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 border border-green-500/30">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-green-400">
                                                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <div className="text-white font-medium text-lg">System Deployed</div>
                                            <div className="text-white/40 text-sm mt-1">100% Uptime Operational</div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Text Structure */}
                                <div className="flex-1 flex flex-col justify-center text-center max-sm:text-left lg:text-left mt-8 lg:mt-0">
                                    <div className="text-white bg-primary h-7 w-7 rounded-full flex items-center justify-center font-medium text-md mb-3">
                                        {steps[active].id}
                                    </div>
                                    <h3 className="text-white font-bold text-lg md:text-xl mb-2 tracking-tight">
                                        {steps[active].title}
                                    </h3>
                                    <p className="text-white/50 text-md md:text-lg leading-relaxed lg:max-w-[400px]">
                                        {steps[active].description}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </div>

            {/* Background Glows positioned behind the main box
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(28,43,255,0.06)_0%,transparent_70%)] pointer-events-none z-0" /> */}
            {/* Subtle Bottom Glow Divider */}
            {/* <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_bottom,rgba(28,43,255,0.15)_0,transparent_70%)] pointer-events-none translate-y-1/2" /> */}
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
