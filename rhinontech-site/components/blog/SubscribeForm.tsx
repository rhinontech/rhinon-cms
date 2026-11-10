"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { BRAND_SLUG, PUBLIC_API } from "@/components/site";

/**
 * Newsletter signup. There is no separate list yet, so a subscriber is saved as a
 * lead in the Rhinon Tech CRM, tagged "Blog newsletter" so it can be filtered out.
 */
export function SubscribeForm({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return setState("done"); // a bot filled the hidden field: look like success, send nothing
    setState("busy");
    try {
      const addr = email.trim();
      const res = await fetch(`${PUBLIC_API}/web-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addr.split("@")[0] || "Subscriber", email: addr, projectType: "Blog newsletter", message: "Subscribed from the Rhinon Tech blog.", site: BRAND_SLUG }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  const dark = tone === "dark";
  if (state === "done")
    return (
      <p className={`flex items-center gap-2 text-[15px] font-medium ${dark ? "text-white" : "text-ink"} ${className}`}>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
        You are subscribed. Thank you.
      </p>
    );

  return (
    <form onSubmit={submit} className={className}>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          aria-label="Email address"
          autoComplete="email"
          className={`h-[52px] min-w-0 flex-1 rounded-xl px-4 text-[15px] outline-none transition ${dark ? "bg-white/10 text-white placeholder:text-white/45 focus:bg-white/15" : "bg-soft text-ink placeholder:text-muted focus:ring-4 focus:ring-violet/10"}`}
        />
        <input tabIndex={-1} autoComplete="off" aria-hidden value={hp} onChange={(e) => setHp(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
        <button type="submit" disabled={state === "busy"} className={`h-[52px] shrink-0 rounded-xl px-6 text-[15px] font-semibold transition disabled:opacity-60 ${dark ? "bg-white text-ink hover:bg-white/90" : "bg-[#1c1c1f] text-white hover:bg-black"}`}>
          {state === "busy" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {state === "error" && <p role="alert" className="mt-2 text-[13px] text-rose-600">We could not subscribe you just now. Please try again.</p>}
    </form>
  );
}
