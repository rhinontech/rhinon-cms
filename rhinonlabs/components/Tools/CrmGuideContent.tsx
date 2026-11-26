import React from "react";
import Link from "next/link";
import { ArrowRight, Calculator, TrendingUp, Clock, HelpCircle, CheckCircle2 } from "lucide-react";
import { ToolFaqAccordion } from "./ToolFaqAccordion";

export function CrmGuideContent() {
  const faqs = [
    {
      q: "How does this CRM ROI Calculator work?",
      a: "Our calculator models revenue uplift based on three proven metrics: a 29% increase in lead close rates (from Salesforce/Gartner sales benchmarks), reclaiming 2 hours weekly per rep on manual admin tasks, and automating 60% of repetitive data entry across active pipelines.",
    },
    {
      q: "Why do small sales teams leak revenue in spreadsheets?",
      a: "Spreadsheets lack automated follow-up reminders, activity audit logs, and lead routing. Research shows 44% of sales reps give up after just one follow-up call, and delayed responses beyond 5 minutes drop qualification chances by 80%. A CRM prevents leads from falling through the cracks.",
    },
    {
      q: "Should early startups use off-the-shelf CRM or a custom dashboard?",
      a: "For simple pipelines, standard tools like HubSpot or Pipedrive work well initially. But when you need two-way sync with payment gateways, operational fulfillment, and proprietary client workflows, custom internal dashboards prevent costly recurring per-seat SaaS taxes.",
    },
    {
      q: "How quickly does a sales CRM pay for itself?",
      a: "Most SMB sales teams with 3–10 reps recover their CRM setup and tooling investment within 60 to 90 days simply by reclaiming abandoned inbound inquiries and standardizing deal stages.",
    },
  ];

  return (
    <article className="mt-16 border-t border-white/[0.08] pt-16 max-w-4xl mx-auto px-5 text-white/80 font-sans">
      {/* Overview */}
      <div className="mb-16 text-center max-w-3xl mx-auto">
        <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans mb-3 block">
          Sales Operations Math
        </span>
        <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-6">
          The Hidden Cost of Managing Deals in Spreadsheets
        </h2>
        <p className="text-white/70 leading-relaxed mb-4 text-base sm:text-lg">
          In early-stage companies and boutique agencies, sales often start in Google Sheets or Notion. While free and flexible initially, spreadsheets quickly become an invisible revenue leak as deal volume expands. Without automated triggers, status stages depend entirely on individual rep memory.
        </p>
        <p className="text-white/60 leading-relaxed text-sm sm:text-base">
          This calculator measures two crucial dimensions of sales operational loss: <strong className="text-white">unrealized revenue from dropped leads</strong> and <strong className="text-white">wasted rep hours spent on repetitive reporting</strong> instead of talking to qualified prospects.
        </p>
      </div>

      {/* The Math & Methodology */}
      <div className="mb-16">
        <div className="mb-8 text-center sm:text-left">
          <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans mb-2 block">
            How The Numbers Work
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            The ROI Calculation Methodology
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-border/7 bg-color-card shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-6 sm:p-7 rounded-[12px] flex flex-col gap-4">
            <div className="w-fit px-3 py-3 rounded-lg bg-[#10131c] shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white/80" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5 block">
                Factor 01
              </span>
              <h3 className="text-lg font-semibold text-white mb-2">Win Rate Uplift</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Based on enterprise sales benchmarks, automated reminders and stage clarity boost deal closure by an average of 25% to 29% across mid-market and SMB sales cycles.
              </p>
            </div>
          </div>

          <div className="border border-border/7 bg-color-card shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-6 sm:p-7 rounded-[12px] flex flex-col gap-4">
            <div className="w-fit px-3 py-3 rounded-lg bg-[#10131c] shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)] flex items-center justify-center">
              <Clock className="w-5 h-5 text-white/80" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5 block">
                Factor 02
              </span>
              <h3 className="text-lg font-semibold text-white mb-2">Reclaimed Hours</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Sales reps spend an average of 10+ hours weekly logging status updates, updating sheets, and compiling status emails. Modern CRM integrations automate up to 60% of this manual entry.
              </p>
            </div>
          </div>

          <div className="border border-border/7 bg-color-card shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-6 sm:p-7 rounded-[12px] flex flex-col gap-4">
            <div className="w-fit px-3 py-3 rounded-lg bg-[#10131c] shadow-[inset_0_1px_1px_rgba(207,231,255,0.2)] flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white/80" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5 block">
                Factor 03
              </span>
              <h3 className="text-lg font-semibold text-white mb-2">Direct Payback</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                By calculating annual deal throughput against improved conversion percentages, the model illustrates the incremental gross revenue generated from existing lead pipelines.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-World Case Example */}
      <div className="mb-16 border border-border/7 bg-color-card shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-7 sm:p-8 rounded-[12px]">
        <h3 className="text-xl font-semibold text-white mb-3">Example: 5-Person Sales Team Case Study</h3>
        <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-4">
          Consider an Indian B2B service agency with 5 account executives closing ₹50,000 average contract values at a baseline 20% win rate. When transitioning from disparate sheets to a unified operational CRM:
        </p>
        <ul className="space-y-3 text-sm text-white/70 mb-4">
          <li className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-white/60 shrink-0" />
            <span>Win rate lifts from 20% to ~25.8% through prompt multi-touch follow-ups.</span>
          </li>
          <li className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-white/60 shrink-0" />
            <span>Over 1,200 annual manual reporting hours are redirected toward active deal discovery.</span>
          </li>
          <li className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-white/60 shrink-0" />
            <span>Generates over ₹75 Lakhs in incremental pipeline revenue within 12 months.</span>
          </li>
        </ul>
      </div>

      {/* Internal Link to Custom Dashboards */}
      <div className="mb-16 border border-border/7 bg-color-card shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-6 sm:p-8 rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Need a custom sales &amp; operations dashboard?</h3>
          <p className="text-sm text-white/60">Learn how we consolidate scattered CRM and accounting tools into one unified internal platform.</p>
        </div>
        <Link
          href="/services/internal-dashboards"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors shrink-0"
        >
          Explore Dashboards <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* FAQs */}
      <div className="mb-16">
        <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-white/70" /> Frequently Asked Questions
        </h2>
        <ToolFaqAccordion items={faqs} />
      </div>
    </article>
  );
}
