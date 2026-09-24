"use client";

import React, { useState } from "react";
import { registerForEvent } from "@/services/eventService";

export function SaveSeatForm({
  eventTitle,
  eventId,
  eventSlug,
}: {
  eventTitle: string;
  eventId?: string;
  eventSlug?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    setErrorMsg("");

    const res = await registerForEvent({
      eventId,
      eventSlug,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    });

    setSubmitting(false);
    if (res.success) {
      setSubmitted(true);
    } else {
      setErrorMsg(res.message || "Failed to reserve seat");
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6 px-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl animate-fade-in font-poppins">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl font-medium mb-3 shadow-md">
          ✓
        </div>
        <h4 className="text-lg font-medium text-gray-900 tracking-tight mb-1">
          Seat Reserved Successfully!
        </h4>
        <p
          className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-sm mx-auto"
          style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
        >
          You&apos;re registered for <span className="text-gray-900 font-medium">{eventTitle}</span>.
          We have sent the calendar invite and Zoom joining link to{" "}
          <span className="text-indigo-600 underline font-medium">{email}</span>.
        </p>
        <div className="mt-4 pt-3 border-t border-emerald-200/60 text-[11px] text-emerald-800 font-medium">
          Check your inbox or promotions tab in a few minutes.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 font-poppins">
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1.5">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rahul Sharma"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-normal"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1.5">
          Work or Personal Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="rahul@company.com"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-normal"
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1.5">
          Phone Number <span className="text-gray-400 font-normal">(for calendar SMS & WhatsApp reminder)</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-normal"
        />
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white font-medium text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer font-poppins"
      >
        <span>{submitting ? "Reserving..." : "Reserve Free Seat"}</span>
        <svg
          className={`w-4 h-4 ${submitting ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          {submitting ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          )}
        </svg>
      </button>

      <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-500 font-normal">
        <span className="flex items-center gap-1 font-medium">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          100% Free
        </span>
        <span>•</span>
        <span className="flex items-center gap-1 font-medium">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Certificate Included
        </span>
        <span>•</span>
        <span className="flex items-center gap-1 font-medium">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          No spam
        </span>
      </div>
    </form>
  );
}

export default SaveSeatForm;
