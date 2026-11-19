"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Clock, Percent, ArrowRight } from "lucide-react";
import Link from "next/link";

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toFixed(0)}`;
}

function fmtHr(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K hrs`;
  return `${n.toFixed(0)} hrs`;
}

const inputClass =
  "w-full mt-1.5 border border-border/7 rounded-[8px] px-4 py-3.5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-white/20 transition-colors bg-transparent";
const labelClass = "text-[14px] font-semibold text-white opacity-60 tracking-wide";

export default function CrmRoiCalculator() {
  const [teamSize, setTeamSize] = useState("5");
  const [dealValue, setDealValue] = useState("50000");
  const [winRate, setWinRate] = useState("20");
  const [hoursPerWeek, setHoursPerWeek] = useState("10");
  const [calculated, setCalculated] = useState(false);

  const result = useMemo(() => {
    const team = parseInt(teamSize) || 0;
    const deal = parseInt(dealValue) || 0;
    const rate = parseInt(winRate) / 100 || 0;
    const hours = parseInt(hoursPerWeek) || 0;

    // Assumptions based on typical CRM studies:
    // - CRM improves win rate by ~29% (Salesforce 2023 State of Sales)
    // - CRM saves ~2hrs/week per rep on admin tasks
    // - 50 selling weeks/year
    const dealsPerRepPerYear = 52;
    const currentRevenue = team * dealsPerRepPerYear * deal * rate;
    const improvedWinRate = rate * 1.29;
    const newRevenue = team * dealsPerRepPerYear * deal * improvedWinRate;
    const revenueUplift = newRevenue - currentRevenue;
    const hoursSavedPerYear = team * 2 * 50; // 2 hrs/week saved per rep
    const manualHoursPerYear = team * hours * 50;
    const manualHoursSaved = manualHoursPerYear * 0.6; // CRM automates ~60% of manual tasks

    return {
      currentRevenue,
      newRevenue,
      revenueUplift,
      hoursSaved: hoursSavedPerYear + manualHoursSaved,
      roi: currentRevenue > 0 ? Math.round((revenueUplift / currentRevenue) * 100) : 0,
    };
  }, [teamSize, dealValue, winRate, hoursPerWeek]);

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setCalculated(true);
  }

  return (
    <div className="relative flex flex-col selection:bg-[#1c2bff]/50 overflow-x-clip">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="pt-40 max-sm:pt-28 pb-10 px-5 max-w-4xl mx-auto w-full flex flex-col items-center"
        >
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium tracking-widest text-[#A3B8CC] uppercase font-sans">Free Tool</span>
          </div>
          <h1 className="text-[36px] text-center sm:text-5xl md:text-[56px] font-sans font-normal leading-[1.1] tracking-[-0.02em] py-2 text-transparent bg-clip-text bg-linear-to-b from-white to-white/80 mb-6">
            CRM <span className="font-serif italic">ROI Calculator</span>
          </h1>
          <p className="text-white/70 text-center sm:text-lg max-w-2xl">
            See how much revenue your team is leaving on the table without a proper CRM. Enter your numbers and get an instant estimate.
          </p>
        </motion.div>
      </section>

      <section className="pb-28 px-5">
        <div className="mx-auto max-w-2xl">
          {/* Calculator card */}
          <form
            onSubmit={handleCalculate}
            className="p-8 rounded-2xl border border-border/7 shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] space-y-6"
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="teamSize" className={labelClass}>Sales team size</label>
                <input
                  id="teamSize"
                  type="number"
                  min="1"
                  value={teamSize}
                  onChange={(e) => { setTeamSize(e.target.value); setCalculated(false); }}
                  placeholder="5"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="dealValue" className={labelClass}>Average deal value (₹)</label>
                <input
                  id="dealValue"
                  type="number"
                  min="0"
                  value={dealValue}
                  onChange={(e) => { setDealValue(e.target.value); setCalculated(false); }}
                  placeholder="50000"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="winRate" className={labelClass}>Current win rate (%)</label>
                <input
                  id="winRate"
                  type="number"
                  min="1"
                  max="100"
                  value={winRate}
                  onChange={(e) => { setWinRate(e.target.value); setCalculated(false); }}
                  placeholder="20"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="hoursPerWeek" className={labelClass}>Hours/week on manual admin</label>
                <input
                  id="hoursPerWeek"
                  type="number"
                  min="0"
                  value={hoursPerWeek}
                  onChange={(e) => { setHoursPerWeek(e.target.value); setCalculated(false); }}
                  placeholder="10"
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              Calculate My ROI
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <AnimatePresence>
            {calculated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 space-y-6"
              >
                <h2 className="text-2xl font-medium tracking-tight text-white">
                  Your estimated <span className="font-serif italic text-transparent bg-clip-text bg-linear-to-r from-white to-white/60">CRM impact</span>
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { icon: TrendingUp, value: fmt(result.revenueUplift), label: "Annual revenue uplift" },
                    { icon: Clock, value: fmtHr(result.hoursSaved), label: "Hours saved per year" },
                    { icon: Percent, value: `${result.roi}%`, label: "ROI vs. current revenue" },
                  ].map(({ icon: Icon, value, label }) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-border/7 shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-6 text-center bg-[#10131c]/40"
                    >
                      <Icon className="mx-auto mb-3 h-5 w-5 text-[#e4fe00]" />
                      <div className="text-3xl font-serif italic text-white">{value}</div>
                      <div className="mt-2 text-xs text-white/50 uppercase tracking-widest">{label}</div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-white/40">
                  Based on Salesforce State of Sales data: CRM adoption improves win rates by ~29% and saves ~2 hrs/week per rep on admin tasks.
                </p>

                {/* CTA — mirrors the home LeadMagnet card */}
                <div className="relative p-8 rounded-2xl bg-linear-to-b from-[#1c2bff]/10 to-transparent border border-[#1c2bff]/20 overflow-hidden">
                  <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#1c2bff]/5 blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <p className="text-lg font-medium text-white">
                    See how Rhinon Labs can deliver this for your team
                  </p>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed max-w-md">
                    Built-in CRM, outreach automation, AI lead research, and live pipeline tracking — designed and built for your workflow.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      href="/schedule-call"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 transition-all"
                    >
                      Book a free call <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/services/mvp-development"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/80 font-medium text-sm hover:border-white/40 hover:text-white transition-all"
                    >
                      See what we build
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
