'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, Check, Clock, DollarSign, LayoutDashboard, Mail, Sparkles, Users, Workflow, XSquare } from 'lucide-react';
import SchedulerModal from '@/components/Common/CTA/SchedulerModal';

/**
 * "Scale without the friction" — the three core services as bento tiles in the
 * same visual language as Results/Process (rotating gradient border, tech grid,
 * glow), each with its own accent colour, a readable live visual, an outcome
 * chip, and one link to its service page. A single call-to-action closes it.
 */

const CSS = `
.sv-tile { position: relative; border-radius: 1.5rem; padding: 1px; background:
  conic-gradient(from var(--sv-a, 0deg), transparent, var(--sv-c1), var(--sv-c2), transparent 45%, transparent);
  animation: sv-spin 10s linear infinite; }
.sv-tile > .sv-in { position: relative; height: 100%; border-radius: calc(1.5rem - 1px); overflow: hidden;
  background: radial-gradient(110% 70% at 50% 0%, var(--sv-glow), transparent 60%), #070a14; }
@property --sv-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@keyframes sv-spin { to { --sv-a: 360deg; } }
.sv-grid { background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 28px 28px; mask-image: radial-gradient(70% 60% at 50% 30%, black, transparent); }
.sv-cycle { animation: sv-cycle 8s ease-in-out infinite; }
@keyframes sv-cycle { 0%,15% { transform: translateY(0); } 25%,40% { transform: translateY(-58px); } 50%,65% { transform: translateY(-116px); } 75%,100% { transform: translateY(0); } }
.sv-type { animation: sv-type 6s steps(40) infinite; }
@keyframes sv-type { 0% { width: 0; } 45%,90% { width: 100%; } 100% { width: 100%; } }
.sv-pop { animation: sv-pop 6s ease-out infinite; }
@keyframes sv-pop { 0%,10% { opacity: 0; transform: translateY(6px); } 20%,92% { opacity: 1; transform: none; } 100% { opacity: 0; } }
.sv-bar { animation: sv-bar 3.6s ease-in-out infinite; transform-origin: bottom; }
@keyframes sv-bar { 0%,100% { transform: scaleY(.75); } 50% { transform: scaleY(1); } }
@media (prefers-reduced-motion: reduce) {
  .sv-tile, .sv-cycle, .sv-type, .sv-pop, .sv-bar { animation: none !important; }
  .sv-type { width: 100%; } .sv-pop { opacity: 1; }
}`;

type Accent = { c1: string; c2: string; glow: string; text: string; chip: string };
const TEAL: Accent = { c1: 'rgba(45,212,191,.6)', c2: 'rgba(91,123,255,.4)', glow: 'rgba(45,212,191,.12)', text: 'text-[#2dd4bf]', chip: 'border-[#2dd4bf]/30 bg-[#2dd4bf]/10 text-[#5eead4]' };
const VIOLET: Accent = { c1: 'rgba(162,107,255,.65)', c2: 'rgba(91,123,255,.45)', glow: 'rgba(162,107,255,.14)', text: 'text-[#b794ff]', chip: 'border-[#a26bff]/30 bg-[#a26bff]/10 text-[#c4a7ff]' };
const BLUE: Accent = { c1: 'rgba(91,123,255,.65)', c2: 'rgba(45,212,191,.35)', glow: 'rgba(91,123,255,.14)', text: 'text-[#8fa6ff]', chip: 'border-[#5b7bff]/30 bg-[#5b7bff]/10 text-[#a9b9ff]' };

function Tile({ accent, className = '', children }: { accent: Accent; className?: string; children: React.ReactNode }) {
    return (
        <div
            className={`sv-tile ${className}`}
            style={{ ['--sv-c1' as string]: accent.c1, ['--sv-c2' as string]: accent.c2, ['--sv-glow' as string]: accent.glow } as React.CSSProperties}
        >
            <div className="sv-in">
                <div className="sv-grid pointer-events-none absolute inset-0" />
                <div className="relative flex h-full flex-col">{children}</div>
            </div>
        </div>
    );
}

function Copy({ accent, Icon, title, subtitle, body, outcome, href }: {
    accent: Accent; Icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string; body: string; outcome: string; href: string;
}) {
    return (
        <div className="mt-auto p-7 md:p-8">
            <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 ${accent.text}`}><Icon className="h-5 w-5" /></span>
                <h3 className="text-[22px] font-semibold tracking-tight text-white">{title}</h3>
            </div>
            <p className={`mt-3 text-[15px] font-medium ${accent.text}`}>{subtitle}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-white/60">{body}</p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider ${accent.chip}`}>{outcome}</span>
                <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white">
                    Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        </div>
    );
}

const TASKS = [
    { name: 'Payment reminder sent', Icon: Clock },
    { name: 'New lead added to CRM', Icon: Users },
    { name: 'Invoice synced to books', Icon: DollarSign },
    { name: 'Social post scheduled', Icon: XSquare },
    { name: 'Payment reminder sent', Icon: Clock },
];

function AutomationVisual() {
    return (
        <div className="relative mx-auto mt-8 h-[200px] w-[86%] overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]">
            <div className="sv-cycle flex flex-col gap-3 pt-6">
                {TASKS.map((t, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0f1c]/90 px-4 py-3 shadow-lg">
                        <span className="flex items-center gap-3 text-sm text-white/85"><t.Icon className="h-4 w-4 text-white/60" />{t.name}</span>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2dd4bf]/20"><Check className="h-3.5 w-3.5 text-[#2dd4bf]" /></span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AgentVisual() {
    return (
        <div className="mx-auto mt-8 w-[88%] space-y-3">
            <div className="rounded-xl border border-white/10 bg-[#0b0f1c]/90 p-4">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[13px] text-white/85"><Mail className="h-4 w-4 text-white/60" />Priya · &ldquo;Can we move our demo to Friday?&rdquo;</span>
                    <span className="sv-pop rounded-full border border-[#a26bff]/40 bg-[#a26bff]/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#c4a7ff]">Sales · urgent</span>
                </div>
            </div>
            <div className="ml-6 rounded-xl border border-[#a26bff]/30 bg-[#a26bff]/8 p-4">
                <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#c4a7ff]"><Sparkles className="h-3.5 w-3.5" />AI draft · ready to send</p>
                <p className="sv-type overflow-hidden whitespace-nowrap text-[13px] text-white/80">Hi Priya — Friday 11am works. I&apos;ve updated the invite.</p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0f1c]/90 p-4">
                <span className="flex items-center gap-2 text-[13px] text-white/85"><Users className="h-4 w-4 text-white/60" />New lead · Arjun, Ops Head @ Finlytix</span>
                <span className="flex items-center gap-2 font-mono text-[11px] text-[#c4a7ff]">
                    Fit score
                    <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-white/10"><span className="absolute inset-y-0 left-0 w-[87%] rounded-full bg-linear-to-r from-[#5b7bff] to-[#a26bff]" /></span>
                    87
                </span>
            </div>
        </div>
    );
}

function DashboardVisual() {
    const kpis = [
        { k: 'Revenue', v: '₹18.4L', d: '+12%' },
        { k: 'Pipeline', v: '₹42L', d: '+8%' },
        { k: 'On-time', v: '94%', d: '+5%' },
    ];
    return (
        <div className="mx-auto mt-8 w-[92%] max-w-[720px] rounded-2xl border border-white/10 bg-[#0b0f1c]/90 p-4 md:p-5 shadow-2xl">
            <div className="grid grid-cols-3 gap-3">
                {kpis.map((x) => (
                    <div key={x.k} className="rounded-lg border border-white/10 bg-white/3 p-3">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">{x.k}</p>
                        <p className="mt-1 text-lg md:text-xl font-semibold text-white">{x.v}</p>
                        <p className="text-[11px] text-[#2dd4bf]">{x.d}</p>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex h-28 items-end gap-2">
                {[42, 58, 50, 72, 64, 80, 74, 92, 86, 100].map((h, i) => (
                    <span key={i} className="sv-bar flex-1 rounded-t-md bg-linear-to-t from-[#5b7bff]/30 via-[#5b7bff] to-[#8fa6ff]" style={{ height: `${h}%`, animationDelay: `${i * 0.18}s` }} />
                ))}
            </div>
        </div>
    );
}

export function Services() {
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
    return (
        <section id="services" className="py-24 relative overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center text-center mb-16">
                    <div className="mb-6 inline-flex items-center px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                        <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans">Scale Without The Friction</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-white/80">
                        Instead of adding more tools or headcount, <br className="hidden md:block" />
                        <span className="font-serif italic text-transparent bg-clip-text bg-linear-to-r from-[#c7d4ff] via-[#8fa6ff] to-[#5b7bff] pr-1">we build scalable systems.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                    <Tile accent={TEAL} className="lg:col-span-5">
                        <AutomationVisual />
                        <Copy
                            accent={TEAL} Icon={Workflow}
                            title="Workflow Automation" subtitle="End-to-end connectivity"
                            body="We connect your tools and processes so data flows automatically — less manual entry, fewer missed follow-ups, no repetitive admin."
                            outcome="~10 hrs / week saved per person" href="/services/workflow-automation"
                        />
                    </Tile>
                    <Tile accent={VIOLET} className="lg:col-span-7">
                        <AgentVisual />
                        <Copy
                            accent={VIOLET} Icon={Bot}
                            title="AI Agents & Smart Systems" subtitle="Intelligence built into your workflow"
                            body="AI that drafts replies, sorts leads, summarises documents and supports daily operations — quietly working in the background, with a human in control."
                            outcome="Replies in minutes, not hours" href="/services/ai-agents"
                        />
                    </Tile>
                    <Tile accent={BLUE} className="lg:col-span-12">
                        <div className="grid h-full lg:grid-cols-2 lg:items-center">
                            <div className="lg:order-2 lg:pb-8"><DashboardVisual /></div>
                            <Copy
                                accent={BLUE} Icon={LayoutDashboard}
                                title="Custom Internal Dashboards" subtitle="Visibility at a glance"
                                body="Central hubs for your CRM, projects and client reporting — so you stop asking “where are we at?” and see everything live, in one place."
                                outcome="One screen instead of five tools" href="/services/internal-dashboards"
                            />
                        </div>
                    </Tile>
                </div>

                <div className="mt-12 flex flex-col items-center gap-3">
                    <button
                        onClick={() => setIsSchedulerOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#1c2bff] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(28,43,255,0.9)] transition-colors hover:bg-[#1c2bff]/90"
                    >
                        Book a free discovery call <ArrowRight className="h-4 w-4" />
                    </button>
                    <Link href="/services" className="text-sm text-white/60 transition-colors hover:text-white">or see all services</Link>
                </div>
            </div>
            <SchedulerModal isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
        </section>
    );
}
