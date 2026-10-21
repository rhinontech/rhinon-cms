import { ArrowRight } from 'lucide-react';
import { siGmail, siGooglesheets, siHubspot, siNotion, siStripe, siWhatsapp, siZapier, siZoom, type SimpleIcon } from 'simple-icons';

/**
 * "Measurable impact" as a bento grid: every number owns a tile and a small
 * live-looking visual (chart, ring, gauge, uptime bars, logo cluster), so the
 * figure leads and the label stays quiet. Pure SVG + CSS animation — a server
 * component that ships no JavaScript. Motion is disabled for reduced-motion users.
 */

const CSS = `
.rx-tile { position: relative; border-radius: 1.5rem; padding: 1px; background:
  conic-gradient(from var(--rx-a, 0deg), rgba(91,123,255,.0), rgba(91,123,255,.55), rgba(162,107,255,.45), rgba(45,212,191,.35), rgba(91,123,255,.0) 40%, rgba(91,123,255,.0));
  animation: rx-spin 8s linear infinite; }
.rx-tile > .rx-in { position: relative; height: 100%; border-radius: calc(1.5rem - 1px); overflow: hidden;
  background: radial-gradient(120% 80% at 50% 0%, rgba(77,107,255,.10), transparent 60%), #070a14; }
@property --rx-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@keyframes rx-spin { to { --rx-a: 360deg; } }
.rx-grid { background-image: linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 28px 28px; mask-image: radial-gradient(70% 60% at 50% 40%, black, transparent); }
.rx-draw { stroke-dasharray: 600; stroke-dashoffset: 600; animation: rx-draw 2.4s ease-out forwards; }
@keyframes rx-draw { to { stroke-dashoffset: 0; } }
.rx-ring { stroke-dasharray: 264; stroke-dashoffset: 264; animation: rx-ring 2s ease-out .3s forwards; }
@keyframes rx-ring { to { stroke-dashoffset: 39.6; } }
.rx-needle { transform-origin: 60px 60px; transform: rotate(-90deg); animation: rx-needle 2s cubic-bezier(.2,.9,.2,1) .3s forwards; }
@keyframes rx-needle { to { transform: rotate(86deg); } }
.rx-pulse { animation: rx-pulse 1.8s ease-out infinite; }
@keyframes rx-pulse { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(2.6); opacity: 0; } }
.rx-bar { animation: rx-bar 2.4s ease-in-out infinite; transform-origin: bottom; }
@keyframes rx-bar { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
.rx-num { background: linear-gradient(180deg, #fff 10%, #dfe6ff 45%, #7f95ff 100%); -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 0 24px rgba(91,123,255,.35)); }
@media (prefers-reduced-motion: reduce) {
  .rx-tile, .rx-draw, .rx-ring, .rx-needle, .rx-pulse, .rx-bar { animation: none !important; }
  .rx-draw { stroke-dashoffset: 0; } .rx-ring { stroke-dashoffset: 39.6; } .rx-needle { transform: rotate(86deg); }
}`;

const shifts = [
    { from: "Guesswork", to: "Real-time visibility" },
    { from: "Hiring to grow", to: "Growing without hiring" },
    { from: "Manual busywork", to: "An AI-first team" },
];

const LOGOS: SimpleIcon[] = [siHubspot, siStripe, siGmail, siWhatsapp, siNotion, siGooglesheets, siZapier, siZoom];

function Tile({ className = "", children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className={`rx-tile min-h-48 ${className}`}>
            <div className="rx-in">
                <div className="rx-grid pointer-events-none absolute inset-0" />
                <div className="relative h-full">{children}</div>
            </div>
        </div>
    );
}

function Label({ children }: { children: React.ReactNode }) {
    return <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">{children}</p>;
}

export function Results() {
    return (
        <section id="results" className="py-24 relative overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center text-center mb-14">
                    <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                            <span className="rx-pulse absolute inline-flex h-full w-full rounded-full bg-[#2dd4bf]" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2dd4bf]" />
                        </span>
                        <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans">Measurable Impact</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white to-white/80">
                        What changes after <span className="font-serif italic text-transparent bg-clip-text bg-linear-to-r from-[#c7d4ff] via-[#8fa6ff] to-[#5b7bff] pr-1">we work together</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:auto-rows-[220px]">
                    {/* 100s — hero tile with a rising chart */}
                    <Tile className="md:col-span-2 md:row-span-2 min-h-96">
                        <div className="flex h-full flex-col justify-between p-8 pb-36 md:pb-40">
                            <Label>Hours saved / month</Label>
                            <div className="relative z-10">
                                <p className="rx-num text-7xl md:text-8xl lg:text-9xl font-semibold tracking-tighter leading-none">100s</p>
                                <p className="mt-3 text-sm text-white/60 max-w-xs">Repetitive work your team never touches again — every single month.</p>
                            </div>
                            <svg viewBox="0 0 400 120" className="absolute inset-x-0 bottom-0 h-32 md:h-36 w-full" preserveAspectRatio="none" aria-hidden="true">
                                <defs>
                                    <linearGradient id="rx-line" x1="0" x2="1"><stop offset="0" stopColor="#5b7bff" /><stop offset=".6" stopColor="#a26bff" /><stop offset="1" stopColor="#2dd4bf" /></linearGradient>
                                    <linearGradient id="rx-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#5b7bff" stopOpacity=".28" /><stop offset="1" stopColor="#5b7bff" stopOpacity="0" /></linearGradient>
                                </defs>
                                <path d="M0 110 C 60 105, 90 95, 130 88 S 200 70, 240 58 S 320 30, 400 8 L 400 120 L 0 120 Z" fill="url(#rx-fill)" />
                                <path className="rx-draw" d="M0 110 C 60 105, 90 95, 130 88 S 200 70, 240 58 S 320 30, 400 8" fill="none" stroke="url(#rx-line)" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </div>
                    </Tile>

                    {/* 85% — progress ring */}
                    <Tile>
                        <div className="flex h-full items-center justify-between gap-4 p-6">
                            <div>
                                <Label>Manual work</Label>
                                <p className="rx-num mt-3 text-6xl font-semibold tracking-tighter leading-none">85%</p>
                                <p className="mt-2 text-xs text-white/55">less, on average</p>
                            </div>
                            <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90 shrink-0" aria-hidden="true">
                                <defs><linearGradient id="rx-ring" x1="0" x2="1"><stop offset="0" stopColor="#a26bff" /><stop offset="1" stopColor="#5b7bff" /></linearGradient></defs>
                                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
                                <circle className="rx-ring" cx="50" cy="50" r="42" fill="none" stroke="url(#rx-ring)" strokeWidth="8" strokeLinecap="round" />
                            </svg>
                        </div>
                    </Tile>

                    {/* 98% — gauge */}
                    <Tile>
                        <div className="flex h-full items-center justify-between gap-4 p-6">
                            <div>
                                <Label>Workflow accuracy</Label>
                                <p className="rx-num mt-3 text-6xl font-semibold tracking-tighter leading-none">98%</p>
                                <p className="mt-2 text-xs text-white/55">runs without a human fix</p>
                            </div>
                            <svg viewBox="0 0 120 70" className="h-20 w-28 shrink-0" aria-hidden="true">
                                <defs><linearGradient id="rx-gauge" x1="0" x2="1"><stop offset="0" stopColor="#f59e0b" /><stop offset=".5" stopColor="#a26bff" /><stop offset="1" stopColor="#2dd4bf" /></linearGradient></defs>
                                <path d="M10 60 A 50 50 0 0 1 110 60" fill="none" stroke="url(#rx-gauge)" strokeWidth="8" strokeLinecap="round" />
                                <g className="rx-needle"><line x1="60" y1="60" x2="60" y2="18" stroke="#fff" strokeWidth="3" strokeLinecap="round" transform="translate(0 0)" /></g>
                                <circle cx="60" cy="60" r="5" fill="#fff" />
                            </svg>
                        </div>
                    </Tile>

                    {/* 24/7 — live status */}
                    <Tile>
                        <div className="flex h-full flex-col justify-between p-6">
                            <div className="flex items-center justify-between">
                                <Label>Automation uptime</Label>
                                <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#2dd4bf]">
                                    <span className="relative flex h-2 w-2"><span className="rx-pulse absolute h-full w-full rounded-full bg-[#2dd4bf]" /><span className="relative h-2 w-2 rounded-full bg-[#2dd4bf]" /></span>
                                    LIVE
                                </span>
                            </div>
                            <p className="rx-num text-6xl font-semibold tracking-tighter leading-none">24/7</p>
                            <div className="flex h-6 items-end gap-[3px]" aria-hidden="true">
                                {Array.from({ length: 30 }).map((_, i) => (
                                    <span key={i} className="rx-bar flex-1 rounded-sm bg-[#2dd4bf]" style={{ height: `${70 + ((i * 37) % 30)}%`, animationDelay: `${(i % 10) * 0.12}s` }} />
                                ))}
                            </div>
                        </div>
                    </Tile>

                    {/* 50+ — logo cluster */}
                    <Tile>
                        <div className="flex h-full flex-col justify-between p-6">
                            <Label>Tools connected</Label>
                            <p className="rx-num text-6xl font-semibold tracking-tighter leading-none">50+</p>
                            <div className="flex -space-x-2" aria-hidden="true">
                                {LOGOS.map((l) => (
                                    <span key={l.slug} className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-2 ring-[#070a14]">
                                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={`#${l.hex}`}><path d={l.path} /></svg>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Tile>
                </div>

                {/* Before → after */}
                <ul className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {shifts.map((s) => (
                        <li key={s.to} className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/2 px-5 py-5 text-center backdrop-blur-sm">
                            <span className="text-[15px] text-white/50 line-through decoration-white/30">{s.from}</span>
                            <ArrowRight className="h-4 w-4 shrink-0 text-[#8fa6ff]" />
                            <span className="text-[15px] font-medium text-white">{s.to}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div
                className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[1200px] h-1"
                style={{ background: 'radial-gradient(50% 50% at 50% 50%, rgba(216, 231, 242, 0.07) 0%, rgba(216, 231, 242, 0) 100%)' }}
            />
        </section>
    );
}
