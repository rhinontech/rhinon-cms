"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Download, Loader2, Mail, ArrowRight } from "lucide-react";
import { createPlatformLead } from "@/lib/api";
import { trackToolComplete, trackGenerateLead, getUtmParams } from "@/lib/analytics-events";

const CHECKLIST_ITEMS = [
  { phase: "Before Day 1", items: ["Send offer letter and get it signed", "Set up email and system accounts", "Order equipment and access cards", "Assign an onboarding buddy", "Send welcome package with company handbook"] },
  { phase: "Day 1", items: ["Greet the new hire and give office/remote tour", "Set up workstation and test all logins", "Introduce to the team (all-hands or Slack announcement)", "Walk through the org chart and reporting structure", "Review first-week schedule"] },
  { phase: "Week 1", items: ["Schedule 1:1s with key teammates", "Complete compliance and policy training", "Review role expectations and 90-day goals", "Walk through key tools and workflows", "Answer any open questions in a daily check-in"] },
  { phase: "Month 1", items: ["First performance feedback session", "Review progress on 30-day goals", "Confirm access to all needed tools and data", "Gather feedback on onboarding experience", "Assign first independent project or task"] },
  { phase: "Month 3", items: ["90-day review meeting", "Confirm role clarity and team fit", "Identify any skill gaps or training needs", "Set goals for next quarter", "Celebrate early wins"] },
];

const inputClass =
  "w-full mt-1.5 border border-border/7 rounded-[8px] px-4 py-3.5 text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-white/20 transition-colors bg-transparent";
const labelClass = "text-[14px] font-semibold text-white opacity-60 tracking-wide";

export default function EmployeeOnboardingChecklist() {
  const [companyName, setCompanyName] = useState("");
  const [hires, setHires] = useState("");
  const [generated, setGenerated] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;
    setGenerated(true);
    // Track tool completion (Audit H-08)
    trackToolComplete("employee_onboarding_checklist", {
      company: companyName,
      hires: hires || "1-5",
    });
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError("");
    try {
      const utms = getUtmParams();
      await createPlatformLead({
        name: companyName,
        email: email.trim(),
        phone: "",
        website: "",
        institutionType: "startup",
        annualLeadVolume: hires || "1-5",
        message: `Requested Employee Onboarding Checklist. Company: ${companyName}, Hires: ${hires || "not specified"}`,
        source: "tools/employee-onboarding-checklist",
        utmSource: utms.utmSource,
        utmMedium: utms.utmMedium,
        utmCampaign: utms.utmCampaign,
        utmTerm: utms.utmTerm,
        utmContent: utms.utmContent,
        referrer: utms.referrer,
      });
      setSent(true);
      // Track lead generation from tool (Audit H-08)
      trackGenerateLead({
        lead_type: "tool_lead",
        source: utms.utmSource || "tools/employee-onboarding-checklist",
        category: "employee_onboarding_checklist",
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="relative flex flex-col selection:bg-[#1c2bff]/50 overflow-x-clip">
      {/* Hero */}
      <section className="relative overflow-hidden print:hidden">
        <motion.div
          initial={{ opacity: 0.9, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="pt-40 max-sm:pt-28 pb-10 px-5 max-w-4xl mx-auto w-full flex flex-col items-center"
        >
          <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium tracking-widest text-[#A3B8CC] uppercase font-sans">Free Tool</span>
          </div>
          <h1 className="text-[36px] text-center sm:text-5xl md:text-[56px] font-sans font-normal leading-[1.1] tracking-[-0.02em] py-2 text-transparent bg-clip-text bg-linear-to-b from-white to-white/80 mb-6">
            Employee Onboarding <br className="hidden sm:block" />
            <span className="font-serif italic">Checklist Generator</span>
          </h1>
          <p className="text-white/70 text-center sm:text-lg max-w-2xl">
            Generate a complete, phase-by-phase onboarding checklist for your new hire in seconds. Free, no login required.
          </p>
        </motion.div>
      </section>

      <section className="pb-28 px-5 print:pb-0">
        <div className="mx-auto max-w-2xl">
          <AnimatePresence mode="wait">
            {!generated ? (
              <motion.form
                key="form"
                onSubmit={handleGenerate}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="p-8 rounded-2xl border border-border/7 shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] space-y-6"
              >
                <div className="space-y-1">
                  <label htmlFor="companyName" className={labelClass}>Company name</label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Inc."
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="hires" className={labelClass}>Number of new hires</label>
                  <select
                    id="hires"
                    value={hires}
                    onChange={(e) => setHires(e.target.value)}
                    className={`${inputClass} appearance-none [&>option]:bg-[#10131c] [&>option]:text-white`}
                  >
                    <option value="">Select…</option>
                    <option value="1">1 person</option>
                    <option value="2-5">2–5 people</option>
                    <option value="6-10">6–10 people</option>
                    <option value="10+">More than 10</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                >
                  Generate My Checklist
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="checklist"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between gap-4 print:hidden">
                  <p className="text-sm text-white/60">
                    Onboarding checklist for <strong className="text-white">{companyName}</strong>
                    {hires && ` · ${hires} ${hires === "1" ? "hire" : "hires"}`}
                  </p>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/80 hover:border-white/40 hover:text-white transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Print / Save PDF
                  </button>
                </div>

                {CHECKLIST_ITEMS.map((section) => (
                  <div
                    key={section.phase}
                    className="p-6 rounded-2xl border border-border/7 shadow-[inset_0_2px_1px_rgba(207,231,255,0.2)] bg-[#10131c]/40 print:border-black/20 print:shadow-none print:bg-white"
                  >
                    <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#A3B8CC] print:text-black">
                      {section.phase}
                    </h2>
                    <ul className="space-y-3">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-[15px] text-white/80 print:text-black">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#e4fe00] print:text-black" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Email capture — mirrors the home LeadMagnet card */}
                <div className="relative p-8 rounded-2xl bg-linear-to-b from-[#1c2bff]/10 to-transparent border border-[#1c2bff]/20 overflow-hidden print:hidden">
                  <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#1c2bff]/5 blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  {!sent ? (
                    <div className="relative z-10">
                      <p className="text-lg font-medium text-white">
                        Get this checklist in your inbox + a free automation audit
                      </p>
                      <p className="mt-2 text-sm text-white/60 leading-relaxed max-w-md">
                        We&apos;ll send you a formatted PDF and show you how to automate 80% of this checklist.
                      </p>
                      <form onSubmit={handleEmail} className="mt-5 flex flex-col sm:flex-row gap-3">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          aria-label="Your email"
                          className="flex-1 border border-border/7 rounded-full px-5 py-3 text-sm text-white placeholder:text-white/60 focus:outline-none focus:border-white/20 transition-colors bg-white/5"
                        />
                        <button
                          type="submit"
                          disabled={sending}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 transition-all disabled:opacity-50"
                        >
                          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4" /> Send</>}
                        </button>
                      </form>
                      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
                    </div>
                  ) : (
                    <div className="relative z-10 flex items-center gap-2.5 text-sm text-white">
                      <CheckCircle2 className="h-5 w-5 text-[#e4fe00]" />
                      Sent! Check your inbox. We&apos;ll be in touch shortly.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
