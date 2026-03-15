'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { LayoutDashboard, Users, HeartPulse, PieChart, Calendar, Target, UserPlus, Send, RefreshCw, HandCoins, MonitorPlay, Zap, Mail, MessageSquare, Search, Copy, FileText, CalendarCheck } from 'lucide-react';

const scrollVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const examples = [
    // Column 1: Custom Dashboards
    { title: 'Centralized Client Portal', desc: 'A single login for your clients to see project status and files.', icon: <LayoutDashboard className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'Custom Dashboards' },
    { title: 'Real-Time KPI Tracker', desc: 'See your revenue, margins, and lead costs in one live view.', icon: <PieChart className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'Custom Dashboards' },
    { title: 'Project Health Monitor', desc: 'Spot bottlenecked tasks before they delay your delivery.', icon: <HeartPulse className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'Custom Dashboards' },
    { title: 'Sales Pipeline Visualizer', desc: 'See exactly where every dollar is stuck in your sales funnel.', icon: <Target className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'Custom Dashboards' },
    { title: 'Team Capacity Planner', desc: 'Know exactly who is over-worked and who has room for more.', icon: <Calendar className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'Custom Dashboards' },
    { title: 'Marketing ROI Dashboard', desc: 'Stop guessing which ad channel is actually making money.', icon: <Users className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'Custom Dashboards' },

    // Column 2: Workflow Automation
    { title: 'Auto-Pilot Onboarding', desc: 'Automatically create folders, send contracts, and Slack the team.', icon: <UserPlus className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'Workflow Automation' },
    { title: 'Lead Distribution Engine', desc: 'Route leads from your site to the right sales rep in seconds.', icon: <Send className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'Workflow Automation' },
    { title: 'Automated Invoice', desc: 'Sync your CRM with Stripe/Quickbooks to follow up on late pay.', icon: <HandCoins className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'Workflow Automation' },
    { title: 'Meeting-to-Task Sync', desc: 'Turn Zoom transcripts into actionable tasks in your PM tool.', icon: <MonitorPlay className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'Workflow Automation' },
    { title: 'Cross-Platform Data Sync', desc: 'Keep your CRM, Email tool, and Sheets perfectly mirrored.', icon: <RefreshCw className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'Workflow Automation' },
    { title: 'Multi-Channel Notifications', desc: 'Get critical business alerts in Slack / WhatsApp, not email.', icon: <Zap className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'Workflow Automation' },

    // Column 3: AI Agents
    { title: 'AI Email Triage', desc: 'An agent that reads incoming mail, tags it, and drafts replies.', icon: <Mail className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'AI Agents & Smart Systems' },
    { title: '24/7 Support Bot', desc: 'An AI trained on your docs to answer 80% of routine FAQs.', icon: <MessageSquare className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'AI Agents & Smart Systems' },
    { title: 'Smart Lead Researcher', desc: 'AI scans a lead\'s website and writes a personalized intro.', icon: <Search className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'AI Agents & Smart Systems' },
    { title: 'Auto-Content Repurposer', desc: 'Turn one long-form blog or video into 10 social media posts.', icon: <Copy className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'AI Agents & Smart Systems' },
    { title: 'Document Data Extractor', desc: 'AI reads PDFs/Invoices and enters the data into your system.', icon: <FileText className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'AI Agents & Smart Systems' },
    { title: 'AI Appointment Setter', desc: 'An agent that chats/calls with leads to qualify and book.', icon: <CalendarCheck className="w-8 h-8 text-white/50 group-hover:text-white transition-all duration-400 ease-in-out" />, category: 'AI Agents & Smart Systems' }
];

export function Examples() {
    return (
        <section id="our_products" className="py-24 relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={scrollVariant}
                    className="flex flex-col items-center text-center mb-16"
                >
                    <div className="mb-6 inline-flex items-center px-4 py-2 rounded-full border border-white/5 bg-white/5 backdrop-blur-md">
                        <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans">
                            Our Products
                        </span>
                    </div>
                    <h2 className="text-4xl md:h-14 md:text-5xl font-medium tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-white/60 mb-6">
                        Different systems that <span className="font-serif italic text-transparent bg-clip-text">We Build</span>
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['Custom Dashboards', 'Workflow Automation', 'AI Agents & Smart Systems'].map((category) => (
                        <div key={category} className="flex flex-col gap-4">
                            <h3 className="text-lg font-medium flex justify-center text-white mb-4 border-b border-white/10 pb-4 text-center md:text-left">
                                {category}
                            </h3>
                            {examples.filter(e => e.category === category).map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={scrollVariant}

                                    className="p-5 group px-10 rounded-2xl bg-color-card border-1 border-[#D8E7F2]/7 transition-all shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] flex flex-col gap-4"
                                >
                                    <div className="mt-1 shrink-0 relative overflow-hidden flex justify-center items-center p-10 rounded-lg shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)] ">

                                        <motion.div
                                            drag
                                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                            dragElastic={1}
                                            dragSnapToOrigin={true}
                                            className="relative z-10 cursor-grab active:cursor-grabbing"
                                        >
                                            <div
                                                className="group-hover:scale-120 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                                                style={{
                                                    padding: '14px',
                                                    borderRadius: '0.75rem',
                                                    borderTopWidth: '2px',
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                    backgroundColor: '#10131c'
                                                }}
                                            >
                                                {item.icon}
                                            </div>
                                        </motion.div>
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
                                    <div className='text-center'>
                                        <h4 className="text-white font-sans text-lg font-[600] mb-1">{item.title}</h4>
                                        <p className="text-white opacity-40 ">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
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
