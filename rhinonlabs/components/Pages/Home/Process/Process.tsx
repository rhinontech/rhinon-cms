'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Phone } from 'lucide-react';
import SchedulerModal from '@/components/Common/CTA/SchedulerModal';

/**
 * "How we work" — a vertical step rail (every step always readable) driving a
 * large visual panel. Same visual language as the Results bento: rotating
 * gradient border, faint tech grid, glowing gradient numerals.
 */
const STEP_MS = 7000;

const steps = [
    { id: '01', title: 'Free Discovery Call', meta: '30 min', description: 'We learn how your business runs today — where time is lost, where work feels messy, and what slows your team down.' },
    { id: '02', title: 'Strategy Sprint', meta: '1 week', description: 'We map the exact systems and automations that fix those gaps, so you get a clear plan before anything is built.' },
    { id: '03', title: 'Build & Connect', meta: 'Weekly releases', description: 'We design and build your dashboards, automations and AI tools, and connect them to the systems you already use.' },
    { id: '04', title: 'Deploy & Enablement', meta: 'Go-live', description: 'We deploy, train your team and stay close until everything runs smoothly on its own.' },
];

const CSS = `
.px-frame { position: relative; border-radius: 1.75rem; padding: 1px; background:
  conic-gradient(from var(--px-a, 0deg), transparent, rgba(91,123,255,.6), rgba(162,107,255,.45), rgba(45,212,191,.4), transparent 45%, transparent);
  animation: px-spin 9s linear infinite; }
.px-frame > .px-in { position: relative; height: 100%; border-radius: calc(1.75rem - 1px); overflow: hidden;
  background: radial-gradient(110% 70% at 50% 0%, rgba(77,107,255,.14), transparent 60%), #070a14; }
@property --px-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@keyframes px-spin { to { --px-a: 360deg; } }
.px-grid { background-image: linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
  background-size: 32px 32px; mask-image: radial-gradient(65% 60% at 50% 45%, black, transparent); }
.px-progress { animation: px-fill linear forwards; }
@keyframes px-fill { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.px-ring { animation: px-ring 2.4s ease-out infinite; }
@keyframes px-ring { 0% { transform: scale(.8); opacity: .8; } 100% { transform: scale(1.9); opacity: 0; } }
.px-wave { animation: px-wave 1.1s ease-in-out infinite; transform-origin: center; }
@keyframes px-wave { 0%,100% { transform: scaleY(.35); } 50% { transform: scaleY(1); } }
.px-dash { stroke-dasharray: 6 8; animation: px-dash 1.2s linear infinite; }
@keyframes px-dash { to { stroke-dashoffset: -28; } }
.px-blink { animation: px-blink 1s steps(2) infinite; }
@keyframes px-blink { 50% { opacity: 0; } }
.px-num { background: linear-gradient(180deg, #fff, #8fa6ff); -webkit-background-clip: text; background-clip: text; color: transparent; }
@media (prefers-reduced-motion: reduce) {
  .px-frame, .px-ring, .px-wave, .px-dash, .px-blink { animation: none !important; }
  .px-progress { animation: none !important; transform: scaleY(1); }
}`;

function CallVisual() {
    return (
        <div className="relative flex h-full items-center justify-center">
            {[0, 0.8, 1.6].map((d) => (
                <span key={d} className="px-ring absolute h-56 w-56 rounded-full border border-[#5b7bff]/50" style={{ animationDelay: `${d}s` }} />
            ))}
            <div className="relative z-10 w-[min(400px,88%)] rounded-2xl border border-white/10 bg-[#0b0f1c]/90 p-6 backdrop-blur-xl shadow-[0_30px_60px_-20px_rgba(0,0,0,.8)]">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-[#5b7bff] to-[#a26bff] shadow-[0_0_30px_rgba(91,123,255,.6)]">
                        <Phone className="h-5 w-5 text-white" />
                    </span>
                    <div>
                        <p className="text-sm font-medium text-white">Discovery call</p>
                        <p className="font-mono text-[11px] text-[#2dd4bf]">● connected · 12:48</p>
                    </div>
                </div>
                <div className="mt-5 flex h-10 items-center justify-between gap-[3px]">
                    {Array.from({ length: 34 }).map((_, i) => (
                        <span key={i} className="px-wave w-1 rounded-full bg-linear-to-t from-[#5b7bff] to-[#2dd4bf]" style={{ height: `${30 + ((i * 53) % 70)}%`, animationDelay: `${(i % 9) * 0.09}s` }} />
                    ))}
                </div>
                <div className="mt-4 space-y-2">
                    {['Lead follow-ups done by hand', 'Reports rebuilt every Monday', 'Data copied between 4 tools'].map((t) => (
                        <p key={t} className="flex items-center gap-2 text-[12px] text-white/70"><span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />{t}</p>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StrategyVisual() {
    const nodes = [
        { x: 60, y: 60, label: 'CRM' }, { x: 60, y: 200, label: 'Forms' }, { x: 210, y: 130, label: 'Automation' },
        { x: 360, y: 60, label: 'Dashboard' }, { x: 360, y: 200, label: 'AI agent' },
    ];
    const links = [[0, 2], [1, 2], [2, 3], [2, 4]];
    return (
        <div className="flex h-full items-center justify-center p-6">
            <svg viewBox="0 0 420 260" className="w-full max-w-[580px]" aria-hidden="true">
                <defs>
                    <linearGradient id="px-link" x1="0" x2="1"><stop offset="0" stopColor="#5b7bff" /><stop offset="1" stopColor="#2dd4bf" /></linearGradient>
                </defs>
                {links.map(([a, b]) => (
                    <path key={`${a}-${b}`} className="px-dash" d={`M${nodes[a].x} ${nodes[a].y} C ${(nodes[a].x + nodes[b].x) / 2} ${nodes[a].y}, ${(nodes[a].x + nodes[b].x) / 2} ${nodes[b].y}, ${nodes[b].x} ${nodes[b].y}`} fill="none" stroke="url(#px-link)" strokeWidth="2" />
                ))}
                {nodes.map((n, i) => (
                    <g key={n.label}>
                        <rect x={n.x - 44} y={n.y - 20} width="88" height="40" rx="12" fill={i === 2 ? '#1c2bff' : '#0b0f1c'} stroke={i === 2 ? '#8fa6ff' : 'rgba(255,255,255,.15)'} />
                        <text x={n.x} y={n.y + 4} textAnchor="middle" fill="#fff" fontSize="12" fontFamily="ui-monospace, monospace">{n.label}</text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

function BuildVisual() {
    return (
        <div className="relative flex h-full items-center justify-center p-6">
            <div className="absolute left-[6%] top-[13%] w-[62%] rounded-xl border border-white/10 bg-[#0b0f1c]/90 p-4 shadow-2xl">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-white/55">Revenue · live</p>
                <div className="flex h-32 items-end gap-2">
                    {[38, 55, 46, 70, 62, 84, 76, 96].map((h, i) => (
                        <span key={i} className="flex-1 rounded-t-sm bg-linear-to-t from-[#5b7bff]/40 to-[#8fa6ff]" style={{ height: `${h}%` }} />
                    ))}
                </div>
            </div>
            <div className="absolute bottom-[9%] right-[5%] w-[70%] rounded-xl border border-white/10 bg-[#0d1120]/95 p-5 font-mono text-[12.5px] leading-relaxed text-[#a1a1aa] shadow-[0_30px_60px_-20px_rgba(0,0,0,.9)] backdrop-blur-xl">
                <p className="text-white/50">{'// new lead → CRM → AI follow-up'}</p>
                <p><span className="text-[#c678dd]">on</span>(<span className="text-[#98c379]">&apos;form.submitted&apos;</span>, <span className="text-[#c678dd]">async</span> lead =&gt; {'{'}</p>
                <p className="pl-4"><span className="text-[#c678dd]">await</span> crm.<span className="text-[#61afef]">upsert</span>(lead)</p>
                <p className="pl-4"><span className="text-[#c678dd]">await</span> agent.<span className="text-[#61afef]">draftReply</span>(lead)</p>
                <p>{'})'}<span className="px-blink text-[#8fa6ff]">▍</span></p>
            </div>
        </div>
    );
}

function DeployVisual() {
    const checks = ['Build passed', 'Integrations connected', 'Team trained', 'Monitoring on'];
    return (
        <div className="flex h-full items-center justify-center p-6">
            <div className="w-[min(440px,90%)] rounded-2xl border border-white/10 bg-[#0b0f1c]/90 p-6 font-mono text-[13px] shadow-2xl">
                <div className="mb-4 flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                    <span className="ml-2 text-white/55">deploy · production</span>
                </div>
                <ul className="space-y-2.5">
                    {checks.map((c, i) => (
                        <motion.li key={c} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.45 }} className="flex items-center gap-2 text-white/80">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2dd4bf]/20"><Check className="h-3 w-3 text-[#2dd4bf]" /></span>{c}
                        </motion.li>
                    ))}
                </ul>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.3 }} className="mt-5 flex items-center gap-2 rounded-lg border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 px-3 py-2 text-[#2dd4bf]">
                    <span className="relative flex h-2 w-2"><span className="px-ring absolute h-full w-full rounded-full bg-[#2dd4bf]" /><span className="relative h-2 w-2 rounded-full bg-[#2dd4bf]" /></span>
                    All systems operational
                </motion.p>
            </div>
        </div>
    );
}

const VISUALS = [CallVisual, StrategyVisual, BuildVisual, DeployVisual];

export function Process() {
    const [active, setActive] = useState(0);
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

    // Auto-advance; restarting the timer on every change means a click resets it.
    useEffect(() => {
        const t = setTimeout(() => setActive((a) => (a + 1) % steps.length), STEP_MS);
        return () => clearTimeout(t);
    }, [active]);

    const Visual = VISUALS[active];

    return (
        <section id="process" className="py-28 relative overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="flex flex-col items-center text-center mb-16 px-6 relative z-10">
                <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                        <span className="px-ring absolute h-full w-full rounded-full bg-[#8fa6ff]" />
                        <span className="relative h-2 w-2 rounded-full bg-[#8fa6ff]" />
                    </span>
                    <span className="text-[11px] font-bold tracking-[0.2em] text-[#A3B8CC] uppercase font-sans">Our Process</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white to-white/80">
                    How we <span className="font-serif italic text-transparent bg-clip-text bg-linear-to-r from-[#c7d4ff] via-[#8fa6ff] to-[#5b7bff] pr-1">work</span>
                </h2>
                <p className="mt-4 text-white/60 max-w-xl">Four steps from first call to a system your team runs on — with a clear plan before we build anything.</p>
            </div>

            <div className="max-w-[1200px] mx-auto px-6 relative z-10 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                {/* Step rail */}
                <ol className="flex flex-col gap-3">
                    {steps.map((s, i) => {
                        const on = i === active;
                        return (
                            <li key={s.id}>
                                <button
                                    onClick={() => setActive(i)}
                                    aria-current={on ? 'step' : undefined}
                                    className={`group relative w-full overflow-hidden rounded-2xl border px-5 py-5 text-left transition-all duration-300 ${on ? 'border-[#5b7bff]/50 bg-[#5b7bff]/[0.07] shadow-[0_0_40px_-12px_rgba(91,123,255,0.7)]' : 'border-white/10 bg-white/2 hover:border-white/20'}`}
                                >
                                    {/* progress line for the active step */}
                                    <span className="absolute left-0 top-0 h-full w-[3px] bg-white/5">
                                        {on && <span key={active} className="px-progress block h-full w-full origin-top bg-linear-to-b from-[#5b7bff] to-[#2dd4bf]" style={{ animationDuration: `${STEP_MS}ms` }} />}
                                    </span>
                                    <div className="flex items-start gap-4">
                                        <span className={`font-mono text-2xl font-semibold leading-none tabular-nums ${on ? 'px-num' : 'text-white/30'}`}>{s.id}</span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className={`text-lg font-semibold tracking-tight ${on ? 'text-white' : 'text-white/75'}`}>{s.title}</h3>
                                                <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white/55">{s.meta}</span>
                                            </div>
                                            <p className={`mt-1.5 text-[14px] leading-relaxed transition-colors ${on ? 'text-white/70' : 'text-white/50'}`}>{s.description}</p>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                    <button
                        onClick={() => setIsSchedulerOpen(true)}
                        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1c2bff] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(28,43,255,0.9)] transition-colors hover:bg-[#1c2bff]/90"
                    >
                        Book a free discovery call <ArrowRight className="h-4 w-4" />
                    </button>
                </ol>

                {/* Visual panel */}
                <div className="px-frame order-first lg:order-none min-h-[380px] lg:min-h-0">
                    <div className="px-in">
                        <div className="px-grid pointer-events-none absolute inset-0" />
                        <div className="absolute left-5 top-5 z-10 font-mono text-[11px] uppercase tracking-[0.2em] text-white/55">
                            Step {steps[active].id} / 04
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active}
                                initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute inset-0"
                            >
                                <Visual />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div
                className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[1200px] h-1"
                style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(216, 231, 242, 0.07) 0%, rgba(216, 231, 242, 0) 100%)' }}
            />
            <SchedulerModal isOpen={isSchedulerOpen} onClose={() => setIsSchedulerOpen(false)} />
        </section>
    );
}
