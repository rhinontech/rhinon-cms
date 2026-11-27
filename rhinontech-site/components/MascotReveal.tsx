"use client";

import { useEffect, useRef } from "react";
import { Check, FileSignature, MessagesSquare, PenLine, Send, Sparkles, Target, Video } from "lucide-react";

/*
 * "Meet Rhino": a pinned section where the mascot goes from pencil sketch, to inked colour key, to
 * the finished 3D render as the visitor scrolls (the animation pipeline mirrors the product idea:
 * AI drafts, your team shapes it, it ships). Product cards around it turn from grey to colour.
 *
 * The three images were made to line up exactly (public/brand/mascot/): the sketch and colour key
 * are transparent layers; the 3D render keeps its flat #CFD8E1 background, which is also the
 * panel colour, so its square edges never show.
 *
 * One rAF-throttled scroll listener writes --p (0 → 1) and data-step; everything else is CSS.
 * Reduced motion: shows the finished state with no listener.
 */

const STEPS = [
  { title: "Draft", body: "Rhino writes the first version" },
  { title: "Shape", body: "Your team edits and approves" },
  { title: "Ship", body: "It goes out, on the client's record" },
];

export function MascotReveal() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const finish = () => { el.style.setProperty("--p", "1"); el.dataset.step = "2"; };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();

    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 1;
      el.style.setProperty("--p", p.toFixed(4));
      el.dataset.step = p < 0.3 ? "0" : p < 0.62 ? "1" : "2";
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={ref} aria-labelledby="meet-rhino" className="mascot-reveal relative" data-step="0">
      <div className="sticky top-0 flex h-[100svh] items-stretch px-3 pb-3 pt-[76px] sm:px-4 sm:pb-4">
        <div className="mr-panel relative flex w-full flex-col items-center overflow-hidden rounded-[32px] px-5 pt-8 sm:pt-10">
          <div className="relative z-20 mx-auto max-w-[760px] text-center">
            <p className="font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-[#3d2bc7]">Meet Rhino</p>
            <h2 id="meet-rhino" className="font-display mt-3 text-balance text-[32px] leading-[1.05] text-ink sm:text-[48px]">From rough draft to finished work.</h2>
            <p className="mx-auto mt-3 max-w-[600px] text-[15.5px] leading-7 text-ink-soft sm:text-[17px]">
              Rhino, the face of Rhinon AI, drafts the follow-up email or the offer letter. Your team shapes it, approves it and sends it, without leaving the workspace.
            </p>
          </div>
          <div className="relative z-20 mx-auto mt-5 max-w-[1040px]">
            <ol className="flex flex-wrap justify-center gap-2" aria-label="How Rhino works">
              {STEPS.map((s, i) => (
                <li key={s.title} className="mr-step flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px]" data-i={i}>
                  <span className="mr-step-n flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold">{i + 1}</span>
                  <span className="font-semibold">{s.title}</span>
                  <span className="hidden text-ink-soft md:inline">· {s.body}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative mt-2 flex w-full max-w-[1240px] flex-1 items-center justify-center">
            {/* The mascot: three aligned layers. */}
            <div className="mr-stage relative aspect-square">
              {/* Bottom to top: sketch, colour key, 3D render. The render is opaque (its own flat
                  background), so as it rises it covers both layers beneath it. */}
              <img src="/brand/mascot/rhino-sketch.webp" alt="" aria-hidden width={1200} height={1200} loading="lazy" decoding="async" className="mr-sketch absolute inset-0 h-full w-full" />
              <img src="/brand/mascot/rhino-flat.webp" alt="" aria-hidden width={1200} height={1200} loading="lazy" decoding="async" className="mr-flat absolute inset-0 h-full w-full" />
              <img src="/brand/mascot/rhino-3d.webp" alt="Rhino, the Rhinon Tech mascot" width={1200} height={1200} loading="lazy" decoding="async" className="mr-3d absolute inset-0 h-full w-full" />
              <span aria-hidden className="mr-scan absolute inset-x-[12%] h-[3px] rounded-full" />
            </div>

            {/* Product cards: grey sketches that colour in as Rhino comes to life. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
              <Card t={0.12} className="left-[2%] top-[6%] w-[250px]" label="AI Agent" icon={<Sparkles className="h-3.5 w-3.5" />}>
                <p className="ml-auto w-fit rounded-2xl rounded-tr-sm bg-ink px-3 py-1.5 text-[12px] text-white">Do you build sites for clinics?</p>
                <p className="mt-1.5 w-fit rounded-2xl rounded-tl-sm bg-[#eef1f7] px-3 py-1.5 text-[12px] text-ink-soft">Yes, six so far. Shall I book a call?</p>
                <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />New lead saved to CRM</p>
              </Card>
              <Card t={0.24} className="right-[2%] top-[4%] w-[270px]" label="Pipeline" icon={<Target className="h-3.5 w-3.5" />}>
                <div className="grid grid-cols-3 gap-1.5 text-[10.5px]">
                  {[["Qualified", "₹2.4L", "#2f5bff"], ["Proposal", "₹5.6L", "#7c5cff"], ["Won", "₹4.2L", "#10b981"]].map(([n, v, c]) => (
                    <div key={n} className="rounded-lg bg-[#f4f6fa] p-1.5">
                      <p className="flex items-center gap-1 font-semibold text-ink"><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{n}</p>
                      <p className="mt-1 rounded-md bg-white px-1.5 py-1 font-semibold text-ink shadow-sm">{v}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card t={0.4} className="left-[0%] top-[42%] w-[240px]" label="Outreach" icon={<Send className="h-3.5 w-3.5" />}>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5b3df5]"><PenLine className="h-3 w-3" />AI draft for Priya Nair</p>
                <p className="mt-1.5 text-[12px] leading-5 text-ink-soft">Congrats on the second clinic. Worth 15 minutes next week?</p>
                <p className="mt-2 flex gap-1.5"><span className="rounded-md bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">Approve</span><span className="rounded-md border border-line px-2 py-0.5 text-[11px] font-semibold text-ink-soft">Edit</span></p>
              </Card>
              <Card t={0.52} className="right-[0%] top-[40%] w-[230px]" label="Projects" icon={<Check className="h-3.5 w-3.5" />}>
                {[["Homepage design", true], ["Booking form", false], ["Launch", false]].map(([n, done]) => (
                  <p key={String(n)} className="flex items-center gap-2 py-0.5 text-[12px] text-ink">
                    <span className={`flex h-3.5 w-3.5 items-center justify-center rounded ${done ? "bg-emerald-500 text-white" : "border border-line"}`}>{done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}</span>
                    <span className={done ? "text-muted line-through" : ""}>{n}</span>
                  </p>
                ))}
              </Card>
              <Card t={0.66} className="bottom-[8%] left-[6%] w-[240px]" label="Team chat" icon={<MessagesSquare className="h-3.5 w-3.5" />}>
                <p className="text-[12px] text-ink-soft"><b className="font-semibold text-ink">Ana</b> Design review is live</p>
                <p className="mt-2 flex items-center justify-between rounded-lg bg-ink px-2.5 py-1.5 text-[11px] text-white"><span className="flex items-center gap-1.5"><Video className="h-3 w-3" />3 in the call</span><span className="rounded bg-emerald-500 px-1.5 py-0.5 font-semibold">Join</span></p>
              </Card>
              <Card t={0.78} className="bottom-[10%] right-[6%] w-[230px]" label="HR" icon={<FileSignature className="h-3.5 w-3.5" />}>
                <p className="text-[12px] font-semibold text-ink">Offer letter · Product Designer</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-700"><Check className="h-3 w-3" strokeWidth={3} />Signed by Ana Silva</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A small product card. `t` is the scroll progress at which it finishes colouring in. */
function Card({ t, className, label, icon, children }: { t: number; className: string; label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={`mr-card absolute rounded-2xl border border-white/70 bg-white p-3.5 ${className}`} style={{ "--t": t } as React.CSSProperties}>
      <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-ink"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#f1efff] text-[#5b3df5]">{icon}</span>{label}</p>
      {children}
    </div>
  );
}
