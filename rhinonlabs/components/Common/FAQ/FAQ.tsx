'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, ChevronDown, MessageSquareMore, ArrowRight, ArrowUpRight, CircleQuestionMarkIcon } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';

const faqs = [
    {
        question: 'Do we need to be technical to work with you?',
        answer: 'Not at all. We handle the technical side end-to-end. We build it, we deploy it, we maintain it. You just run your business. We only need to explain how your business currently works and where things feel inefficient.'
    },
    {
        question: 'How long does it take to build a system?',
        answer: 'It depends on complexity, but most projects are scoped and delivered within 2-4 weeks. You’ll get a clear timeline before we begin.'
    },
    {
        question: 'What if we already use multiple tools?',
        answer: 'That’s completely fine, most of our clients do. We build around your existing tools and connect them properly instead of forcing you to replace everything. In fact, you might be able to replace a lot of tools with one solution.'
    },
    {
        question: 'Will this disrupt our current operations?',
        answer: 'No. We design and implement systems carefully so your day-to-day operations continue running smoothly during the transition.'
    },
    {
        question: 'Is this expensive?',
        answer: 'It’s an investment, but the one designed to pay for itself. Yes, most of our clients recover the cost by reclaiming 50+ hours weekly, reduced manual work, and fewer operational inefficiencies within the 90 days.'
    },
    {
        question: 'Do you offer ongoing support?',
        answer: 'Yes. After deployment, we offer optional monthly or quarterly support (retainer plan) to optimize and expand your systems as your business grows.'
    },
    {
        question: 'What industries do you work with?',
        answer: 'We work with growing service businesses, agencies, and SMBs across industries. If your operations rely on repetitive work, scattered tools, or manual processes, we can help.'
    },
    {
        question: 'How is this different from just hiring a freelancer?',
        answer: 'Freelancers usually build a specific task you ask for. We are systems partners. We look at your entire operational workflow, identify the bottlenecks you might not see, and build a cohesive ecosystem. You aren’t just getting a zap, you’re getting a scalable infrastructure.'
    },
    {
        question: 'We already use other tools like Zapier. Why do we need you?',
        answer: 'Most businesses have "duct-tape automation", a few zaps here and there that don\'t talk to each other. We build enterprise-grade workflows and custom dashboards that handle complex logic, centralize your data, and scale without breaking when your volume doubles.'
    },
    {
        question: 'How much time do I (the founder/operator) need to commit?',
        answer: 'We know you’re busy and that’s why you’re hiring us. We only need about 2-4 hours of your time upfront to audit your current "chaos." After that, our team handles the heavy lifting, development, and testing.'
    },
    {
        question: 'Is our data secure with AI and automation?',
        answer: 'Absolutely. We prioritize data privacy by using secure API connections and, where necessary, private LLM deployments. We build systems that give you full ownership and control over your data, nothing is used to train public models.'
    },
    {
        question: 'What if our processes change? Are we "locked in" to this system?',
        answer: 'We build for flexibility. Unlike rigid off-the-shelf software, our custom systems are designed to be modular. We provide you with the documentation (and training if needed) so your team can make minor tweaks, or we can jump back in to evolve the system as you grow.'
    }
];

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
                            <Link href="https://wa.me/919664430061" target='_blank'>
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
