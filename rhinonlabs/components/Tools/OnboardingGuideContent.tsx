import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSpreadsheet, ShieldAlert, Sparkles, HelpCircle } from "lucide-react";
import { ToolFaqAccordion } from "./ToolFaqAccordion";

export function OnboardingGuideContent() {
  const faqs = [
    {
      q: "How long should an employee onboarding process take?",
      a: "Effective onboarding lasts at least 90 days. While basic admin setup and paperwork happen before Day 1, structured check-ins at 30, 60, and 90 days ensure role clarity, tool adoption, and long-term team retention.",
    },
    {
      q: "Why do small teams need an onboarding checklist?",
      a: "In early-stage startups and SMBs, onboarding knowledge usually lives in one founder's head. A written, systematic checklist prevents forgotten logins, missed compliance steps, and slow ramp-up times without requiring a full-time HR department.",
    },
    {
      q: "Can I customize this checklist for my company?",
      a: "Yes. Enter your company name above, choose your hiring volume, and click 'Generate Checklist'. You can download the printable version or email it to your hiring manager as a working SOP.",
    },
    {
      q: "When should we automate employee onboarding?",
      a: "Once you hire more than 2–3 team members a quarter, manual onboarding becomes a bottleneck. Automated welcome emails, Slack invites, Notion workspace provisioning, and document collection save 15+ hours per hire.",
    },
  ];

  return (
    <article className="mt-16 border-t border-white/[0.08] pt-16 max-w-4xl mx-auto px-5 text-white/80 print:hidden font-sans">
      {/* Overview */}
      <div className="mb-16 text-center max-w-3xl mx-auto">
        <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans mb-3 block">
          Operational SOP
        </span>
        <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-6">
          Why Structured Employee Onboarding Matters for Small Teams
        </h2>
        <p className="text-white/70 leading-relaxed mb-4 text-base sm:text-lg">
          Hiring great talent is expensive, but losing them in the first 90 days is even more costly. Industry research shows that companies with a standardized onboarding workflow achieve <strong className="text-white">50% higher new hire productivity</strong> and improve retention by up to <strong className="text-white">69%</strong>.
        </p>
        <p className="text-white/60 leading-relaxed text-sm sm:text-base">
          For startups and growing agencies without a dedicated People/HR department, early onboarding is frequently rushed. Essential security setups are delayed, passwords are sent over unencrypted chats, and new hires spend their first week waiting for access instead of shipping work. This checklist gives you an enterprise-grade structure designed specifically for teams of 5 to 50.
        </p>
      </div>

      {/* The 5 Phases Explained */}
      <div className="mb-16">
        <div className="mb-8 text-center sm:text-left">
          <span className="text-xs font-semibold tracking-widest text-[#A3B8CC] uppercase font-sans mb-2 block">
            Step-by-Step Blueprint
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            The 5 Phases of Startup Onboarding
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border/7 bg-color-card shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-6 rounded-[12px] flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2 block">Phase 1</span>
            <h3 className="text-xl font-semibold text-white mb-2">Pre-Day 1 (Pre-boarding)</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Send signed offer letters, hardware, Google Workspace/Slack logins, and invite them to an onboarding buddy before their first official morning. Eliminates first-day idle anxiety.
            </p>
          </div>

          <div className="border border-border/7 bg-color-card shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-6 rounded-[12px] flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2 block">Phase 2</span>
            <h3 className="text-xl font-semibold text-white mb-2">Day 1: Connection &amp; Context</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Focus on welcoming the person, not drowning them in policy docs. A warm team introduction, an overview of company vision, and a scheduled lunch or coffee chat make the biggest impression.
            </p>
          </div>

          <div className="border border-border/7 bg-color-card shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-6 rounded-[12px] flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2 block">Phase 3</span>
            <h3 className="text-xl font-semibold text-white mb-2">Week 1: Tools &amp; Role Expectations</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Deep-dive into tech stacks, internal documentation, CRM or codebases. Establish clear 30-day goals so the new hire understands what good performance looks like.
            </p>
          </div>

          <div className="border border-border/7 bg-color-card shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-6 rounded-[12px] flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2 block">Phases 4 &amp; 5</span>
            <h3 className="text-xl font-semibold text-white mb-2">Month 1 to 3: Autonomy &amp; Review</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Assign their first high-impact project, conduct 30-day bi-weekly check-ins, and conclude with a formal 90-day review to confirm mutual fit and quarterly career roadmaps.
            </p>
          </div>
        </div>
      </div>

      {/* Common Mistakes */}
      <div className="mb-16 border border-border/7 bg-color-card shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-7 sm:p-8 rounded-[12px]">
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" /> 3 Mistakes That Derail Early Onboarding
        </h2>
        <ul className="space-y-3.5 text-white/70 text-sm sm:text-base">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-white/60 shrink-0 mt-1" />
            <span><strong className="text-white">Assuming common knowledge:</strong> Acronyms, client history, and unspoken conventions must be written down in an accessible internal wiki or handbook.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-white/60 shrink-0 mt-1" />
            <span><strong className="text-white">Lack of dedicated mentorship:</strong> Always pair new hires with an onboarding buddy outside their direct reporting line for informal everyday questions.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-white/60 shrink-0 mt-1" />
            <span><strong className="text-white">Manual access management:</strong> Spending 3 hours manually configuring Google Drive permissions, GitHub repos, and CRM seats introduces errors. Automate access provisioning with role-based presets.</span>
          </li>
        </ul>
      </div>

      {/* Internal Link to Automation Guide */}
      <div className="mb-16 border border-border/7 bg-color-card shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] p-6 sm:p-8 rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Need to automate this entire workflow?</h3>
          <p className="text-sm text-white/60">Read our complete technical blueprint on automating onboarding without an HR department.</p>
        </div>
        <Link
          href="/blogs/automate-employee-onboarding-small-company"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors shrink-0"
        >
          Read the Guide <ArrowRight className="w-4 h-4" />
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
