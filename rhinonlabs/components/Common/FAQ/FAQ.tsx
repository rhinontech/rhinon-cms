'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, ChevronDown, MessageSquareMore, ArrowRight, ArrowUpRight, CircleQuestionMarkIcon } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { faqs } from './faqs';


const scrollVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [showAll, setShowAll] = useState(false);

    const visibleFaqs = showAll ? faqs : faqs.slice(0, 5);

    return (
        <section id="faqs" className="py-24 relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">

                {/* Section Badge */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={scrollVariant}
                    className="flex justify-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                        <MessageSquareMore className="w-4 h-4 text-white" />
                        <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans">
                            FAQ's
                        </span>
                    </div>
                </motion.div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Side: Static Card */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={scrollVariant}
                        className="md:w-1/3"
                    >
                        <div className="sticky overflow-hidden top-0 text-center p-8 rounded-[20px] bg-color-card border border-border/7 shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)]">
                            <div className="inline-flex items-center gap-2 px-4 py-3 rounded-lg shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] mb-5  ">
                                <CircleQuestionMarkIcon className="w-7 h-7 text-white/70" />
                            </div>
                            <h3 className="text-[22px] font-medium text-[#D5DBE6] mb-4">
                                Still Have Questions?
                            </h3>
                            <p className="opacity-70 mb-8">
                                Still have questions? Feel free to get in touch with us today!
                            </p>
                            <Link href="https://wa.me/918249291789" target='_blank'>
                                <Button variant="default" className="w-fit bg-primary hover:bg-blue-700 border-0 text-white gap-2">
                                    <ArrowUpRight className="w-4 h-4" /> Ask a Question
                                </Button>
                            </Link>

                            {/* Background Glow */}
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
                    </motion.div>

                    {/* Right Side: Accordion */}
                    <div className="md:w-2/3 flex flex-col pt-8 md:pt-0">
                        {visibleFaqs.map((faq, index) => {
                            const isOpen = openIndex === index;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.5, delay: (index % 5) * 0.1 }}
                                    key={index}
                                    className="border relative overflow-hidden border-border/7 shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-3 mb-5 rounded-[10px]"
                                >
                                    {/* Background Glow */}
                                    <div
                                        className="absolute top-0 -left-100 pointer-events-none z-1"
                                        style={{
                                            width: '437px',
                                            height: '306px',
                                            background: 'radial-gradient(circle, rgba(184, 199, 217, 0.5) 0%, rgba(184, 199, 217, 0) 100%)',
                                            opacity: 0.1,
                                            transform: 'translate(50%, -50%)'
                                        }}
                                    />
                                    <button
                                        onClick={() => setOpenIndex(isOpen ? null : index)}
                                        className="w-full flex items-center justify-between text-left group"
                                    >
                                        <span className={`text-lg font-[450] tracking-tight transition-colors pr-8 text-gray-300`}>
                                            {faq.question}
                                        </span>
                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ml-4 transition-colors ${isOpen ? 'border-[#1c2bff]/30 bg-[#1c2bff]/10 text-white' : 'border-white/10 text-white/50 group-hover:bg-white/5'}`}>
                                            {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                        </div>
                                    </button>

                                    <div
                                        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'
                                            }`}
                                    >
                                        <div className="overflow-hidden">
                                            <p className="opacity-70 leading-relaxed pr-8">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Toggles */}
                        <div className="pt-6 flex justify-center md:justify-start">
                            {!showAll ? (
                                <button
                                    onClick={() => setShowAll(true)}
                                    className="flex items-center gap-2 text-sm font-medium text-[#e4fe00] hover:text-[#c4df00] transition-colors group"
                                >
                                    See more questions
                                    <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setShowAll(false);
                                        // Optional: scroll slightly up if they are too far down when clicking read less
                                        const faqsHeader = document.getElementById('faqs');
                                        if (faqsHeader) {
                                            faqsHeader.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                    className="flex items-center gap-2 text-sm font-medium text-[#A3B8CC] hover:text-white transition-colors group"
                                >
                                    Show less
                                    <ChevronDown className="w-4 h-4 rotate-180 group-hover:-translate-y-1 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>

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
