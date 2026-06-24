'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getCaseStudies, type CaseStudy } from '@/lib/api';

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop";

export function CaseStudies() {
    const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);

    useEffect(() => {
        let active = true;
        getCaseStudies().then((data) => {
            if (active) setCaseStudies(data);
        });
        return () => { active = false; };
    }, []);

    // Nothing published (or everything deleted in the CMS) — hide the section entirely.
    if (caseStudies.length === 0) return null;

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
                    <p className="opacity-60 text-sm md:text-base">
                        Discover how businesses and creators achieve results
                    </p>
                </div>

                {/* Clickable grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {caseStudies.map((cs) => {
                        const cover = cs.image || cs.images?.[0] || PLACEHOLDER_IMG;
                        return (
                            <Link
                                key={cs.id}
                                href={`/case-studies/${cs.slug}`}
                                className="group flex flex-col rounded-[16px] border border-border/7 bg-background overflow-hidden shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] hover:border-white/20 transition-all"
                            >
                                <div className="aspect-[16/10] overflow-hidden relative">
                                    <img
                                        src={cover}
                                        alt={cs.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent opacity-60" />
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    {(cs.category || cs.industry) && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
                                            {cs.category || cs.industry}
                                        </span>
                                    )}
                                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white transition-colors">
                                        {cs.title}
                                    </h3>
                                    <p className="text-sm opacity-60 line-clamp-2 mb-4">{cs.description}</p>

                                    {cs.stats && cs.stats.length > 0 && (
                                        <div className="flex gap-4 mt-auto pt-2">
                                            {cs.stats.slice(0, 2).map((stat, i) => (
                                                <div key={i}>
                                                    <div className="text-xl font-medium text-white">
                                                        {stat.value}<span className="text-xs text-white/60">{stat.suffix}</span>
                                                    </div>
                                                    <div className="text-[11px] opacity-50">{stat.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* View all */}
                <Link
                    href="/case-studies"
                    className="mt-12 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 text-sm text-white/90 hover:bg-white/10 transition-colors"
                >
                    View all case studies
                    <ArrowRight size={16} />
                </Link>
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
