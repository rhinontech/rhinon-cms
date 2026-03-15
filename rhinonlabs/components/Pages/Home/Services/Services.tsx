'use client';

import React from 'react';
import { LayoutDashboard, Workflow, Bot, Check, RotateCcw, Activity, Users, Clock, DollarSign, XSquare, Search, Code } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const services = [
    {
        title: 'Custom Internal Dashboards',
        subtitle: 'Visibility at a glance.',
        description: 'We build central hubs for your CRM, project tracking, or client reporting so you can stop asking, “Where are we at?” and see everything clearly in one place.',
        icon: <LayoutDashboard className="w-6 h-6 text-blue-400" />,
        className: 'col-span-12 md:col-span-4'
    },
    {
        title: 'Workflow Automation',
        subtitle: 'End-to-end connectivity.',
        description: 'We connect your tools and processes so data flows automatically reducing manual entry, follow-ups, and repetitive admin work.',
        icon: <Workflow className="w-6 h-6 text-[#e4fe00]" />,
        className: 'col-span-12 md:col-span-4'
    },
    {
        title: 'AI Agents & Smart Systems',
        subtitle: 'Intelligence built into your workflow.',
        description: 'We create smart AI tools that can draft responses, organize leads, summarize information, and support daily operations quietly working in the background.',
        icon: <Bot className="w-6 h-6 text-blue-400" />,
        className: 'col-span-12 md:col-span-4'
    }
];

const scrollVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const tasks = [
    { name: "Social media post", icon: XSquare, icon2: Check },
    { name: "Employee Tracking", icon: Users, icon2: RotateCcw },
    { name: "Payment reminder", icon: Clock, icon2: Check },
    { name: "Cost Management", icon: DollarSign, icon2: RotateCcw }
];

const itemAnimations = [
    {
        scale: [1.05, 1, 1, 1, 1, 1, 1.05],
        opacity: [1, 0.3, 0.1, 0.1, 0.1, 0.3, 1],
        filter: ["blur(0px)", "blur(0.8px)", "blur(2px)", "blur(2px)", "blur(2px)", "blur(0.8px)", "blur(0px)"]
    },
    {
        scale: [1, 1.05, 1, 1, 1, 1.05, 1],
        opacity: [0.3, 1, 0.3, 0.1, 0.3, 1, 0.3],
        filter: ["blur(0.8px)", "blur(0px)", "blur(0.8px)", "blur(2px)", "blur(0.8px)", "blur(0px)", "blur(0.8px)"]
    },
    {
        scale: [1, 1, 1.05, 1, 1.05, 1, 1],
        opacity: [0.1, 0.3, 1, 0.3, 1, 0.3, 0.1],
        filter: ["blur(2px)", "blur(0.8px)", "blur(0px)", "blur(0.8px)", "blur(0px)", "blur(0.8px)", "blur(2px)"]
    },
    {
        scale: [1, 1, 1, 1.05, 1, 1, 1],
        opacity: [0.1, 0.1, 0.3, 1, 0.3, 0.1, 0.1],
        filter: ["blur(2px)", "blur(2px)", "blur(0.8px)", "blur(0px)", "blur(0.8px)", "blur(2px)", "blur(2px)"]
    },
];

const MARQUEE_TIMES = [0, 0.166, 0.333, 0.5, 0.666, 0.833, 1];

export function Services() {
    return (
        <section id="services" className="py-24 relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">

                {/* Section Header */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={scrollVariant}
                    className="flex flex-col items-center text-center mb-16"
                >
                    <div className="mb-6 inline-flex items-center px-4 py-2 rounded-full border border-white/5 bg-white/5 backdrop-blur-md">
                        <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans">
                            Scale Without The Friction
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-white/60">
                        Instead of adding more tools or headcount, <br/> <span className="font-serif italic text-transparent bg-clip-text">we build scalable systems.</span>
                    </h2>
                    {/* <p className="text-xl opacity-60 font-light max-w-2xl text-center">
                        We connect everything and remove unnecessary manual work.
                    </p> */}
                </motion.div>

                {/* 3 cards Grid */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Animated Card */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={scrollVariant}
                        className="col-span-12 lg:col-span-5 relative p-8 md:p-10 rounded-[16px] bg-color-card backdrop-blur-[10px] border border-border/7 overflow-hidden flex flex-col justify-between min-h-[450px] shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)]"
                    >
                        {/* Vertical Scrolling Marquee Area */}
                        <div className="relative h-[250px] flex items-center justify-center -mt-4 mb-8 overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_20%,black_100%,transparent)]">
                            <motion.div
                                animate={{ y: [96, 32, -32, -96, -32, 32, 96] }}
                                transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", times: MARQUEE_TIMES }}
                                className="flex flex-col gap-3 w-[85%]"
                            >
                                {/* Sequenced 4 task rows */}
                                {tasks.map((task, idx) => (
                                    <motion.div
                                        key={idx}
                                        animate={{
                                            scale: itemAnimations[idx].scale,
                                            opacity: itemAnimations[idx].opacity,
                                            filter: itemAnimations[idx].filter
                                        }}
                                        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", times: MARQUEE_TIMES }}
                                        className="flex items-center justify-between px-5 py-3.5 rounded-lg border border-border/7 shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)] backdrop-blur-[2px]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <task.icon strokeWidth={1.5} className="w-5 h-5 text-white/80" />
                                            <span className="text-white font-medium text-sm">{task.name}</span>
                                        </div>
                                        <task.icon2 strokeWidth={1.5} className="w-5 h-5 text-white/80" />
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Text Content */}
                        <div className="relative z-10 flex flex-col justify-end text-left mt-auto">
                            <h3 className="text-[22px] font-semibold text-white mb-1 tracking-tight">
                                Workflow Automation
                            </h3>
                            <h3 className="text-[16px] font-semibold text-white/70 mb-2 tracking-tight">
                                End-to-end connectivity
                            </h3>
                            <p className=" leading-relaxed opacity-60 text-[16px]">
                                We connect your tools and processes so data flows automatically reducing manual entry, follow-ups, and repetitive admin work.
                            </p>
                        </div>

                        {/* Radial Gradient */}
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
                    </motion.div>

                    {/* Right Animated Card (AI Agent) */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={scrollVariant}
                        className="col-span-12 lg:col-span-7 relative p-8 md:p-10 rounded-[16px] bg-color-card backdrop-blur-[10px] border border-border/7 overflow-hidden flex flex-col justify-between min-h-[450px] shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)]"
                    >
                        {/* Editor Image/Animation Area */}
                        <div className="relative h-[250px] w-full flex items-center justify-center -mt-4 mb-8 overflow-hidden mask-[linear-gradient(to_bottom,black_40%,transparent_100%)]">

                            {/* Stacked background windows for depth */}
                            <div className="absolute top-4 w-[75%] h-[200px] bg-[#0d1117] rounded-xl border border-white/5 opacity-40 -z-20 scale-95 origin-top translate-y-[-16px]" />
                            <div className="absolute top-4 w-[85%] h-[200px] bg-[#0B0F19] rounded-xl border border-white/5 opacity-70 -z-10 scale-[0.97] origin-top translate-y-[-8px]" />

                            {/* Main Window container */}
                            <div className="absolute top-4 w-[95%] bg-[#10131c] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col z-10">
                                {/* Window Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-background/50">
                                    <div className="flex gap-1.5 opacity-50 shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                                    </div>
                                    <div className="flex-1 px-4 flex justify-center">
                                        <div className="h-7 w-full max-w-[220px] bg-white/5 rounded-full flex items-center justify-end px-3">
                                            <Search className="w-3.5 h-3.5 text-white/40" />
                                        </div>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-lg bg-[#161b22] text-xs text-white/70 font-mono tracking-wider flex items-center gap-1.5 opacity-80 border border-white/5 shrink-0">
                                        Code {'</>'}
                                    </div>
                                </div>
                                {/* Window Body (Scrolling) */}
                                <div className="relative p-5 text-sm font-mono text-white/70 h-[160px] overflow-hidden leading-relaxed">
                                    <motion.div
                                        animate={{ y: [0, 0, -120, -120, 0, 0] }}
                                        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", times: [0, 0.2, 0.45, 0.7, 0.9, 1] }}
                                    >
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/30 shrink-0">1</div>
                                            <span className="text-white font-medium">class AutomationAgent:</span>
                                        </div>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/30 shrink-0">2</div>
                                            <span className="pl-6 text-white/60">def __init__(self, activation_limit):</span>
                                        </div>
                                        <div className="flex items-start gap-4 mb-3">
                                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/30 shrink-0 mt-0.5">3</div>
                                            <span className="pl-12 text-white/50">self.activation_limit =<br />activation_limit</span>
                                        </div>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/30 shrink-0">4</div>
                                            <span className="pl-12 text-white/50">self.current_mode = "idle"</span>
                                        </div>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-5 h-5 flex items-center justify-center text-[10px] text-transparent shrink-0">5</div>
                                            <span className="pl-6 text-white/60"> </span>
                                        </div>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/30 shrink-0">6</div>
                                            <span className="pl-6 text-white/60">def evaluate_task(self, workload_value):</span>
                                        </div>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/30 shrink-0">7</div>
                                            <span className="pl-12 text-white/50">if workload_value &gt; self.activation_limit:</span>
                                        </div>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/30 shrink-0">8</div>
                                            <span className="pl-16 text-[#A3B8CC]">return self.trigger_pipeline()</span>
                                        </div>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/30 shrink-0">9</div>
                                            <span className="pl-12 text-white/50">return "Idle"</span>
                                        </div>
                                    </motion.div>

                                </div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="relative z-10 flex flex-col justify-end text-left mt-auto">
                            <h3 className="text-[22px] font-semibold text-white mb-1 tracking-tight">
                                AI Agents & Smart Systems
                            </h3>
                            <h3 className="text-[16px] font-semibold text-white/70 mb-2 tracking-tight">
                                Intelligence built into your workflow
                            </h3>
                            <p className="leading-relaxed  opacity-60 max-w-[90%] text-[16px]">
                                We create smart AI tools that can draft responses, organize leads, summarize information, and support daily operations quietly working in the background
                            </p>
                        </div>

                        {/* Radial Gradient */}
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
                    </motion.div>

                    {/* Third Animated Card (Dashboard) */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={scrollVariant}
                        className="col-span-12 relative p-8 md:p-10 rounded-[2rem] bg-color-card backdrop-blur-[10px] border border-border/7 overflow-hidden flex flex-col justify-between min-h-[450px] shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)]"
                    >
                        {/* Dashboard Image/Animation Area */}
                        <div className="relative h-[250px] w-full flex items-center justify-center -mt-4 mb-8 overflow-hidden mask-[linear-gradient(to_bottom,black_40%,transparent_100%)]">

                            {/* Stacked background windows for depth */}
                            <div className="absolute top-4 w-[75%] max-w-[600px] h-[200px] bg-[#0d1117] rounded-xl border border-white/5 opacity-40 -z-20 scale-95 origin-top translate-y-[-16px]" />
                            <div className="absolute top-4 w-[85%] max-w-[680px] h-[200px] bg-[#0B0F19] rounded-xl border border-white/5 opacity-70 -z-10 scale-[0.97] origin-top translate-y-[-8px]" />

                            {/* Main Window container */}
                            <div className="absolute top-4 w-[95%] max-w-[760px] bg-[#10131c] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col z-10">
                                {/* Window Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-background/50">
                                    <div className="flex gap-1.5 opacity-50 shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                                    </div>
                                    <div className="flex-1 px-4 hidden sm:flex justify-center">
                                        <div className="h-6 w-full max-w-[300px] bg-white/5 rounded-full flex items-center justify-center px-3">
                                            <div className="flex gap-2 items-center opacity-30">
                                                <Search className="w-3 h-3" />
                                                <div className="w-16 h-1.5 bg-white/40 rounded-sm" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-white/5 rounded-md flex items-center gap-2 opacity-80 border border-white/5">
                                        <div className="w-4 h-4 rounded-full bg-white/20" />
                                        <div className="w-10 h-1.5 rounded-sm bg-white/20" />
                                    </div>
                                </div>
                                {/* Window Body */}
                                <div className="flex h-[160px] overflow-hidden bg-[#0B0F19]">
                                    {/* Sidebar */}
                                    <div className="hidden sm:flex w-[120px] shrink-0 border-r border-white/5 p-3 flex-col gap-3 bg-[rgba(255,255,255,0.01)]">
                                        <div className="w-full h-2.5 rounded bg-white/10 mb-2" />
                                        <div className="w-[70%] h-2 rounded bg-white/5 flex items-center gap-2">
                                            <LayoutDashboard className="w-3 h-3 text-white/30" />
                                            <div className="w-full h-1.5 rounded-sm bg-white/10" />
                                        </div>
                                        <div className="w-[85%] h-2 rounded bg-white/5 flex items-center gap-2">
                                            <Activity className="w-3 h-3 text-white/20" />
                                            <div className="w-full h-1.5 rounded-sm bg-white/5" />
                                        </div>
                                        <div className="w-[60%] h-2 rounded bg-white/5 flex items-center gap-2">
                                            <Users className="w-3 h-3 text-white/20" />
                                            <div className="w-full h-1.5 rounded-sm bg-white/5" />
                                        </div>
                                    </div>
                                    {/* Scrolling Content */}
                                    <div className="flex-1 p-4 relative overflow-hidden">
                                        <motion.div
                                            animate={{ y: [0, 0, -180, -180, 0, 0] }}
                                            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", times: [0, 0.2, 0.45, 0.7, 0.9, 1] }}
                                            className="flex flex-col gap-4"
                                        >
                                            {/* Row 1: Cards */}
                                            <div className="flex gap-3">
                                                <div className="flex-1 h-[72px] rounded-lg bg-white/5 border border-white/5 p-3 flex flex-col justify-between">
                                                    <div className="flex justify-between items-start">
                                                        <div className="w-16 h-2 rounded-sm bg-white/20" />
                                                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                            <Activity className="w-3 h-3 text-blue-400" />
                                                        </div>
                                                    </div>
                                                    <div className="w-10 h-3.5 rounded bg-white/60 mt-1" />
                                                </div>
                                                <div className="flex-1 h-[72px] rounded-lg bg-white/5 border border-white/5 p-3 flex flex-col justify-between">
                                                    <div className="flex justify-between items-start">
                                                        <div className="w-14 h-2 rounded-sm bg-white/20" />
                                                        <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                            <Users className="w-3 h-3 text-purple-400" />
                                                        </div>
                                                    </div>
                                                    <div className="w-12 h-3.5 rounded bg-white/60 mt-1" />
                                                </div>
                                                <div className="hidden sm:flex flex-1 h-[72px] rounded-lg bg-white/5 border border-white/5 p-3 flex-col justify-between">
                                                    <div className="flex justify-between items-start">
                                                        <div className="w-20 h-2 rounded-sm bg-white/20" />
                                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                                            <DollarSign className="w-3 h-3 text-green-400" />
                                                        </div>
                                                    </div>
                                                    <div className="w-14 h-3.5 rounded bg-white/60 mt-1" />
                                                </div>
                                            </div>

                                            {/* Row 2: Chart */}
                                            <div className="w-full h-32 rounded-lg bg-white/5 border border-white/5 p-4 flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="w-24 h-2.5 rounded bg-white/20" />
                                                    <div className="w-16 h-2 rounded-full bg-white/10" />
                                                </div>
                                                <div className="flex-1 flex items-end gap-1.5 sm:gap-2 pt-2">
                                                    {[40, 70, 50, 90, 60, 100, 80, 50].map((h, i) => (
                                                        <div key={i} className="flex-1 bg-blue-500/40 rounded-t-sm" style={{ height: `${h}%`, opacity: 0.3 + (h / 100) * 0.7 }} />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Row 3: List */}
                                            <div className="w-full h-[100px] rounded-lg bg-white/5 border border-white/5 p-4 flex flex-col justify-between">
                                                <div className="w-20 h-2.5 rounded bg-white/20 mb-1" />
                                                {[1, 2].map((i) => (
                                                    <div key={i} className="flex items-center gap-3 py-1.5 border-t border-white/5 first:border-0 border-dashed">
                                                        <div className="w-6 h-6 rounded-full bg-white/10 shrink-0" />
                                                        <div className="flex flex-col gap-1.5 flex-1">
                                                            <div className="w-3/4 h-1.5 rounded-sm bg-white/20" />
                                                            <div className="w-1/2 h-1.5 rounded-sm bg-white/10" />
                                                        </div>
                                                        <div className="w-12 h-4 rounded-full bg-primary/20 flex justify-center items-center">
                                                            <div className="w-6 h-1 rounded-sm bg-primary/60" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="relative z-10 flex flex-col justify-end text-left mt-auto">
                            <h3 className="text-[22px] font-semibold text-white mb-1 tracking-tight">
                                Custom Internal Dashboards
                            </h3>
                            <h3 className="text-[16px] font-semibold text-white/70 mb-2 tracking-tight">
                                Visibility at a glance
                            </h3>
                            <p className="leading-relaxed  opacity-60 max-w-[90%] lg:max-w-[70%] text-[16px]">
                                We build central hubs for your CRM, project tracking, or client reporting so you can stop asking, “Where are we at?” and see everything clearly in one place.
                            </p>
                        </div>
                        {/* Radial Gradient */}
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
                    </motion.div>
                </div>

            </div>

            {/* Subtle Bottom Glow Divider */}
            {/* <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_at_bottom,rgba(28,43,255,0.15)_0,transparent_70%)] pointer-events-none translate-y-1/2" /> */}


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
