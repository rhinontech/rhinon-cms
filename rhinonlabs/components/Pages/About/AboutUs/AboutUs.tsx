'use client'
import { motion } from 'framer-motion'
import Link from "next/link";
import { ArrowRight, Box, Layers, Smartphone } from 'lucide-react';

const projects = [
    {
        name: 'FurrCircle',
        type: 'Consumer product',
        description: 'A pet-parent app — in-house product, live on web, iOS and Android.',
        icon: Smartphone,
        tags: ['iOS', 'Android', 'Web'],
    },
    {
        name: 'SR Fitout',
        type: 'Client portal + admin dashboard',
        description: 'A Bengaluru interiors studio. We built their marketing site, a project-intake portal and an admin dashboard that replaced a folder of email threads.',
        icon: Layers,
        tags: ['Dashboard', 'Portal', 'Web'],
    },
    {
        name: 'Apexis Pro',
        type: 'Construction SaaS',
        description: 'A full SaaS product for construction teams — managing drawings, snags, RFIs and handover across sites, on web and native mobile.',
        icon: Box,
        tags: ['SaaS', 'Mobile', 'Web'],
    },
]

const AboutUs = () => {
    return (
        <div className="flex flex-col py-20 px-5 gap-16 max-w-[1200px] mx-auto">
            <div className="flex flex-col gap-5">
                <p className="text-xs font-semibold tracking-widest text-white/50 uppercase">What We Have Built</p>
                <h2 className="lg:text-5xl md:text-4xl text-3xl font-medium tracking-tight">
                    Our credentials are<br />
                    <span className="text-white/50">the products we ship.</span>
                </h2>
                <p className="max-w-2xl text-lg text-white/70 leading-relaxed">
                    We don&apos;t sell strategy decks. Every claim we make about our capability is backed by something that is live and running. These are three of the products our team has built from scratch.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {projects.map((p, i) => (
                    <motion.div
                        key={p.name}
                        className="flex flex-col gap-5 p-6 rounded-2xl border border-white/10 bg-white/3 hover:bg-white/5 transition-colors"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60">
                                <p.icon className="h-4 w-4" />
                            </span>
                            <div>
                                <h3 className="font-semibold text-white">{p.name}</h3>
                                <p className="text-xs text-white/40">{p.type}</p>
                            </div>
                        </div>
                        <p className="text-[15px] text-white/70 leading-relaxed flex-1">{p.description}</p>
                        <div className="flex flex-wrap gap-2">
                            {p.tags.map(t => (
                                <span key={t} className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10 text-white/50">{t}</span>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
                <Link
                    href="/case-studies"
                    className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                    See case studies <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="text-white/20">·</span>
                <Link
                    href="/schedule-call"
                    className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                    Book a free discovery call <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    )
}

export default AboutUs;
