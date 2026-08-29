"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/lib/api";
import { scrollVariant } from "./SectionHeading";
import { CTA_GRADIENT } from "./palette";

const stages = [
  "Just an idea",
  "Business plan",
  "Prototype",
  "Existing MVP",
  "Existing startup",
];

const budgets = [
  "Not sure yet",
  "Under ₹1L",
  "₹1L – ₹3L",
  "₹3L – ₹7L",
  "₹7L+",
];

const inputClass =
  "w-full mt-1.5 border border-white/10 rounded-[10px] px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20 transition-all bg-white/[0.03]";
const labelClass = "text-[14px] font-semibold opacity-60 tracking-wide";

const emptyForm = {
  name: "",
  email: "",
  whatsapp: "",
  organization: "",
  idea: "",
  stage: stages[0],
  budget: budgets[0],
};

export function IdeaForm() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Startup ideas post to their own endpoint, NOT /public/web-leads — they are kept out
    // of the CRM pipeline until someone converts one from the admin panel.
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;

    try {
      const res = await fetch(`${API_BASE}/public/startup-ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.whatsapp,
          organization: form.organization,
          idea: form.idea,
          stage: form.stage,
          budget: form.budget,
          source: "/build",
          utmSource: params?.get("utm_source") || undefined,
          utmMedium: params?.get("utm_medium") || undefined,
          utmCampaign: params?.get("utm_campaign") || undefined,
          referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
        }),
      });

      if (!res.ok) {
        setError("Failed to submit. Please try again.");
        return;
      }
      setSuccess(true);
      setForm(emptyForm);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="idea-form" className="py-24 relative overflow-hidden scroll-mt-24">
      <div className="max-w-[900px] mx-auto px-6 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={scrollVariant}
          className="flex flex-col items-center text-center mb-12"
        >
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-400/30 bg-gradient-to-r from-blue-500/15 to-violet-500/15 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 animate-pulse" />
            <span className="text-[11px] font-bold tracking-[0.2em] text-violet-100 uppercase font-sans">
              Start Here
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-linear-to-b from-white/90 to-white/50 py-1">
            Have an Idea?{" "}
            <span className="font-serif italic bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Let&apos;s Talk.
            </span>
          </h2>
          <p className="opacity-60 mt-5 max-w-xl">
            Tell us what you&apos;re thinking about. You don&apos;t need a finished business plan, technical
            specification or prototype.
          </p>
        </motion.div>

        <div className="p-8 md:p-12 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-600/10 via-blue-600/[0.06] to-transparent backdrop-blur-sm relative overflow-hidden">
          {success ? (
            <div className="flex flex-col items-center text-center gap-4 py-10">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              <h3 className="text-2xl font-semibold">Got it. We&apos;ll be in touch.</h3>
              <p className="opacity-60 max-w-md">
                We&apos;ve received your idea and will reach out shortly to set up a free consultation.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-sm text-white/60 hover:text-white underline underline-offset-4 mt-2"
              >
                Submit another idea
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label htmlFor="whatsapp" className={labelClass}>
                    Phone / WhatsApp
                  </label>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    value={form.whatsapp}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your WhatsApp number"
                  />
                </div>
                <div>
                  <label htmlFor="organization" className={labelClass}>
                    College / Organization
                  </label>
                  <input
                    id="organization"
                    name="organization"
                    value={form.organization}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Where are you studying or working?"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="idea" className={labelClass}>
                  What are you building?
                </label>
                <textarea
                  id="idea"
                  name="idea"
                  required
                  rows={4}
                  value={form.idea}
                  onChange={handleChange}
                  className={`${inputClass} resize-none`}
                  placeholder="Describe your idea in a few sentences — the problem, who it's for, and what you'd want it to do."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="stage" className={labelClass}>
                    Current stage
                  </label>
                  <select
                    id="stage"
                    name="stage"
                    value={form.stage}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    {stages.map((s) => (
                      <option key={s} value={s} className="bg-[#10131c]">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="budget" className={labelClass}>
                    Budget range <span className="opacity-50 font-normal">(optional)</span>
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    {budgets.map((b) => (
                      <option key={b} value={b} className="bg-[#10131c]">
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className={`w-full ${CTA_GRADIENT} font-semibold py-6 rounded-[10px] text-[15px] border-0 disabled:opacity-50 transition-all`}
              >
                {loading ? "Submitting..." : "Submit My Idea"}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>

              <p className="text-center text-xs opacity-45 flex items-center justify-center gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                No commitment. We&apos;ll help you understand what it would take to build.
              </p>
            </form>
          )}

          <div
            className="absolute top-0 right-0 pointer-events-none"
            style={{
              width: "437px",
              height: "306px",
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(139,92,246,0.7) 0%, rgba(139,92,246,0) 100%)",
              opacity: 0.3,
              transform: "translate(50%, -50%)",
            }}
          />
        </div>

        <p className="text-center text-sm text-white/50 mt-8">
          Prefer to talk directly?{" "}
          <a href="tel:+918249291789" className="font-semibold text-white hover:underline">
            +91 8249 291 789
          </a>{" "}
          or{" "}
          <a
            href="https://wa.me/918249291789"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white hover:underline"
          >
            WhatsApp us
          </a>
        </p>
      </div>
    </section>
  );
}
