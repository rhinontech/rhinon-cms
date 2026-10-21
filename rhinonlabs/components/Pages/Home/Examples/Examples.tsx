'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';

const scrollVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const examples = [
    // Column 1: Custom Dashboards
    { title: 'Centralized Client Portal', desc: 'A single login for your clients to see project status and files.', category: 'Custom Dashboards' },
    { title: 'Real-Time KPI Tracker', desc: 'See your revenue, margins, and lead costs in one live view.', category: 'Custom Dashboards' },
    { title: 'Project Health Monitor', desc: 'Spot bottlenecked tasks before they delay your delivery.', category: 'Custom Dashboards' },
    { title: 'Sales Pipeline Visualizer', desc: 'See exactly where every dollar is stuck in your sales funnel.', category: 'Custom Dashboards' },
    { title: 'Team Capacity Planner', desc: 'Know exactly who is over-worked and who has room for more.', category: 'Custom Dashboards' },
    { title: 'Marketing ROI Dashboard', desc: 'Stop guessing which ad channel is actually making money.', category: 'Custom Dashboards' },

    // Column 2: Workflow Automation
    { title: 'Auto-Pilot Onboarding', desc: 'Automatically create folders, send contracts, and Slack the team.', category: 'Workflow Automation' },
    { title: 'Lead Distribution Engine', desc: 'Route leads from your site to the right sales rep in seconds.', category: 'Workflow Automation' },
    { title: 'Automated Invoice', desc: 'Sync your CRM with Stripe/Quickbooks to follow up on late pay.', category: 'Workflow Automation' },
    { title: 'Meeting-to-Task Sync', desc: 'Turn Zoom transcripts into actionable tasks in your PM tool.', category: 'Workflow Automation' },
    { title: 'Cross-Platform Data Sync', desc: 'Keep your CRM, Email tool, and Sheets perfectly mirrored.', category: 'Workflow Automation' },
    { title: 'Multi-Channel Notifications', desc: 'Get critical business alerts in Slack / WhatsApp, not email.', category: 'Workflow Automation' },

    // Column 3: AI Agents
    { title: 'AI Email Triage', desc: 'An agent that reads incoming mail, tags it, and drafts replies.', category: 'AI Agents & Smart Systems' },
    { title: '24/7 Support Bot', desc: 'An AI trained on your docs to answer 80% of routine FAQs.', category: 'AI Agents & Smart Systems' },
    { title: 'Smart Lead Researcher', desc: 'AI scans a lead\'s website and writes a personalized intro.', category: 'AI Agents & Smart Systems' },
    { title: 'Auto-Content Repurposer', desc: 'Turn one long-form blog or video into 10 social media posts.', category: 'AI Agents & Smart Systems' },
    { title: 'Document Data Extractor', desc: 'AI reads PDFs/Invoices and enters the data into your system.', category: 'AI Agents & Smart Systems' },
    { title: 'AI Appointment Setter', desc: 'An agent that chats/calls with leads to qualify and book.', category: 'AI Agents & Smart Systems' }
];

// Row order and direction: 1 left→right, 2 right→left, 3 left→right.
const ROWS = [
    { category: 'Custom Dashboards', direction: 'ltr' },
    { category: 'Workflow Automation', direction: 'rtl' },
    { category: 'AI Agents & Smart Systems', direction: 'ltr' },
] as const;


/* The track holds its cards twice; moving it by -50% shows the second copy
   exactly where the first began, so the loop has no visible seam. Kept with the
   component (not globals.css) so it always ships and hot-reloads with it. */
const MARQUEE_CSS = `
@keyframes marquee-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes marquee-ltr { from { transform: translateX(-50%); } to { transform: translateX(0); } }
.marquee { mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent); }
.marquee-rtl { animation: marquee-rtl 60s linear infinite; }
.marquee-ltr { animation: marquee-ltr 60s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .marquee { overflow-x: auto; mask-image: none; }
  .marquee-track { animation: none; transform: none; }
}`;

export function Examples() {
    return (
        <section id="our_products" className="py-24 relative overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: MARQUEE_CSS }} />
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

            </div>

            {/* Three infinite rows instead of three long columns. Each track holds
                the cards twice and slides by exactly one copy, so the loop is seamless. */}
            <div className="relative z-10 flex flex-col gap-12">
                {ROWS.map((row) => (
                    <div key={row.category}>
                        <h3 className="max-w-[1200px] mx-auto px-6 text-lg font-medium text-white mb-6 text-center">
                            {row.category}
                        </h3>
                        <div className="marquee group/row overflow-hidden">
                            <div className={`marquee-track flex w-max ${row.direction === 'ltr' ? 'marquee-ltr' : 'marquee-rtl'}`}>
                                {[0, 1].map((copy) =>
                                    examples
                                        .map((item, n) => ({ item, n }))
                                        .filter(({ item }) => item.category === row.category)
                                        .map(({ item, n }) => (
                                            <div
                                                key={`${copy}-${n}`}
                                                aria-hidden={copy === 1 ? true : undefined}
                                                className="pr-6"
                                            >
                                                <div className="group w-[300px] sm:w-[340px] h-full p-5 rounded-2xl bg-color-card border-1 border-[#D8E7F2]/7 shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] flex flex-col gap-4">
                                                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)]">
                                                        <Image
                                                            src={`/assets/examples/${n + 1}.webp`}
                                                            alt={copy === 0 ? `${item.title} illustration` : ''}
                                                            fill
                                                            sizes="340px"
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                                                        />
                                                    </div>
                                                    <div className="text-center px-2 pb-1">
                                                        <h4 className="text-white font-sans text-lg font-[600] mb-1">{item.title}</h4>
                                                        <p className="text-white/60 text-[15px] leading-relaxed">{item.desc}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    </div>
                ))}
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
