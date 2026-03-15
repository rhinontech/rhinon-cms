'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, ArrowRight } from 'lucide-react';

export function LeadMagnet() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                <div className="relative p-12 rounded-[2rem] bg-linear-to-b from-[#1c2bff]/10 to-transparent border border-[#1c2bff]/20 overflow-hidden group">
                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#1c2bff]/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c2bff]/10 border border-[#1c2bff]/20 text-[#A3B8CC] text-xs font-bold tracking-widest uppercase mb-6">
                                <Sparkles className="w-3 h-3" />
                                <span>Limited Availability</span>
                            </div>
                            
                            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-6">
                                Get a <span className="font-serif italic text-transparent bg-clip-text bg-linear-to-r from-white to-white/60">Free Automation Audit</span> <br/> 
                                for Your Business
                            </h2>
                            
                            <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-xl">
                                We'll analyze your current workflows, identify bottlenecks, and show you exactly where AI and automation can save you 20+ hours per week. No commitment required.
                            </p>
                            
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mb-8 text-sm text-white/50">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-[#e4fe00]" />
                                    <span>Zero-Risk Consultation</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-[#e4fe00]" />
                                    <span>Custom Roadmap Included</span>
                                </div>
                            </div>

                            <a 
                                href="#contact" 
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] group"
                            >
                                Claim Your Free Audit
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>
                        
                        <div className="lg:w-1/3 w-full">
                            <div className="relative aspect-square rounded-3xl bg-[#10131c] border border-white/5 p-8 flex flex-col justify-center gap-6 shadow-2xl">
                                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        whileInView={{ width: '75%' }}
                                        transition={{ duration: 1.5, delay: 0.5 }}
                                        className="h-full bg-linear-to-r from-blue-500 to-purple-500"
                                    />
                                </div>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                <div className="w-4 h-4 rounded-full border-2 border-primary/40" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="w-2/3 h-2 rounded-sm bg-white/10" />
                                                <div className="w-1/3 h-1.5 rounded-sm bg-white/5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="text-xs text-white/30 uppercase tracking-widest">Efficiency Gain</div>
                                    <div className="text-xl font-bold font-serif italic text-primary">+82%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
