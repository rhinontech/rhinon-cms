"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import type { CaseStudy } from "@/lib/api";
import { MarkdownRenderer } from "@/components/Common/Markdown/MarkdownRenderer";
import { BlockRenderer } from "@/components/Common/Blog/BlockRenderer";

const CaseStudyDetail: React.FC<{ caseStudy: CaseStudy }> = ({ caseStudy }) => {
    const images = caseStudy.images && caseStudy.images.length
        ? caseStudy.images
        : caseStudy.image
            ? [caseStudy.image]
            : [];
    const category = caseStudy.category || caseStudy.industry || "Case Study";
    const blocks = caseStudy.contentBlocks?.length ? caseStudy.contentBlocks : null;

    return (
        <div className="text-white pt-36 pb-20">
            <motion.div
                className="absolute inset-0 top-0 left-0 -z-10"
                initial={{ opacity: 0, }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                viewport={{ once: true }}
            >
                <div className="[mask-image:linear-gradient(to_bottom,transparent,white_30%,white_60%,transparent)] mask-mode:luminance">
                    <img src="/images/background/q3lzdr4u88731.jpg" className="w-full h-full object-cover" alt="" />
                </div>
            </motion.div>
            <div className="max-w-[1440px] mx-auto px-5 md:px-10">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Left Column - Scrollable Images */}
                    <div className="w-full lg:w-2/3 flex flex-col gap-10 pt-10">
                        {images.map((img, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="w-full rounded-lg overflow-hidden border border-white/10"
                            >
                                <img src={img} alt={`${caseStudy.title} screenshot ${index + 1}`} className="w-full h-auto object-cover" />
                            </motion.div>
                        ))}

                        {blocks ? (
                            <div className="mt-2">
                                <BlockRenderer blocks={blocks} />
                            </div>
                        ) : caseStudy.content ? (
                            <div className="prose prose-invert max-w-none mt-2">
                                <MarkdownRenderer content={caseStudy.content} />
                            </div>
                        ) : null}
                    </div>

                    {/* Right Column - Sticky Details */}
                    <motion.div
                        style={{ position: "sticky", top: "150px" }}
                        className="h-fit flex items-center justify-center font-semibold pt-20 w-full lg:w-[50%]"
                    >
                        <section className="px-8">
                            <div>
                                <div className="mb-3">
                                    <span className="text-sm font-semibold tracking-widest text-white/80">{category}</span>
                                </div>

                                <h1 className="text-5xl md:text-6xl font-light mb-6 leading-tight">{caseStudy.title}</h1>

                                <p className="text-lg text-white/80 mb-8 font-normal max-w-lg">{caseStudy.description}</p>

                                {/* Headline stats */}
                                {caseStudy.stats && caseStudy.stats.length > 0 && (
                                    <div className="flex flex-wrap gap-8 mb-8">
                                        {caseStudy.stats.map((stat, i) => (
                                            <div key={i}>
                                                <p className="text-3xl font-medium">
                                                    {stat.value}<span className="text-base text-white/60">{stat.suffix}</span>
                                                </p>
                                                <p className="text-sm text-white/60">{stat.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Quote / outcome */}
                                {caseStudy.quote && (
                                    <p className="text-lg italic text-white/70 border-l-2 border-white/20 pl-4 mb-10 max-w-lg">
                                        {caseStudy.quote}
                                    </p>
                                )}

                                <div className='flex items-center gap-5 flex-wrap'>
                                    <Button className="bg-white text-black hover:bg-gray-200 px-6 py-6 text-base font-semibold rounded-none border-3 border-black/30">
                                        <Link href="/contact-us">Start a Project</Link>
                                    </Button>

                                    <div className="flex items-center gap-4">
                                        <div className="flex -space-x-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center">
                                                <img src="https://randomuser.me/api/portraits/women/1.jpg" alt="User 1" className="w-full h-full rounded-full object-cover" />
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-gray-600 border-2 border-black flex items-center justify-center">
                                                <img src="https://randomuser.me/api/portraits/men/2.jpg" alt="User 2" className="w-full h-full rounded-full object-cover" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-white text-white" />
                                                ))}
                                            </div>
                                            <span className="text-white/80 text-sm font-light mt-1">
                                                Trusted by leading enterprises &amp; fast-growing teams worldwide.
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 mt-10">
                                    {caseStudy.date && (
                                        <>
                                            <div className='flex items-center justify-between'>
                                                <p className="font-medium uppercase tracking-wider">Date</p>
                                                <p className="font-medium text-white/50 tracking-wider">{caseStudy.date}</p>
                                            </div>
                                            <div className="w-full h-px bg-white/10 my-2"></div>
                                        </>
                                    )}
                                    {caseStudy.industry && (
                                        <>
                                            <div className='flex items-center justify-between'>
                                                <p className="font-medium uppercase tracking-wider">Industry</p>
                                                <p className="font-medium text-white/50 tracking-wider">{caseStudy.industry}</p>
                                            </div>
                                            <div className="w-full h-px bg-white/10 my-2"></div>
                                        </>
                                    )}
                                    {caseStudy.timeline && (
                                        <>
                                            <div className='flex items-center justify-between'>
                                                <p className="font-medium uppercase tracking-wider">Timeline</p>
                                                <p className="font-medium text-white/50 tracking-wider">{caseStudy.timeline}</p>
                                            </div>
                                            <div className="w-full h-px bg-white/10 my-2"></div>
                                        </>
                                    )}
                                    {caseStudy.liveLink && (
                                        <>
                                            <div className='flex items-center justify-between'>
                                                <div className='flex items-center gap-2'>
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    <p className="font-medium uppercase tracking-wider">Live</p>
                                                </div>
                                                <a
                                                    href={caseStudy.liveLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 font-medium text-white/50 tracking-wider hover:text-white transition-colors cursor-pointer"
                                                >
                                                    Visit Site <ArrowRight size={18} />
                                                </a>
                                            </div>
                                            <div className="w-full h-px bg-white/10 my-2"></div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </section>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default CaseStudyDetail;
