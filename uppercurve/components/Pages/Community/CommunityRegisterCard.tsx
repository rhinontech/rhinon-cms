"use client";

import React, { useState } from "react";

export function CommunityRegisterCard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("India");
  const [phone, setPhone] = useState("");
  const [knowsCoding, setKnowsCoding] = useState<"yes" | "no">("yes");
  const [role, setRole] = useState("Working Professional");
  const [experience, setExperience] = useState("1-3 years");
  const [optMasterclass, setOptMasterclass] = useState(true);
  const [optNewsletter, setOptNewsletter] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 800);
  };

  if (isSubmitted) {
    return (
      <div className="w-full bg-white border border-gray-200/90 rounded-3xl p-7 sm:p-10 text-gray-900 shadow-[0_15px_40px_rgba(0,0,0,0.06)] text-center animate-fade-in relative overflow-hidden">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl font-black mb-4 shadow-sm">
          ✓
        </div>

        <div className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-emerald-200">
          Registration Complete
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
          Welcome to UpperCurve Community!
        </h3>

        <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto mb-6">
          Hey <span className="text-gray-900 font-bold">{name}</span>, your invite has been generated. Tap below to enter the official WhatsApp group for instant access.
        </p>

        {/* WhatsApp Direct CTA Button */}
        <a
          href="https://chat.whatsapp.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-[#25D366] hover:bg-[#20ba59] text-black font-extrabold text-base px-8 py-4 rounded-2xl shadow-[0_4px_25px_rgba(37,211,102,0.3)] transition-all active:scale-95"
        >
          <svg className="w-6 h-6 fill-current text-[#075E54]" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          <span>Click to Join WhatsApp Group</span>
        </a>

        <div className="mt-6 pt-5 border-t border-gray-100 text-xs text-gray-500">
          Also check your email at <span className="text-gray-900 font-bold">{email}</span> for Discord server invites & starter kits.
        </div>
      </div>
    );
  }

  return (
    <div
      id="join-form"
      className="w-full bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-9 text-gray-900 shadow-[0_12px_40px_rgba(0,0,0,0.06)] relative overflow-hidden font-sans"
    >
      {/* Top accent badge */}
      <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            Open Registrations
          </span>
        </div>
        <span className="text-xs font-bold text-gray-500">
          100% Free Access
        </span>
      </div>

      <div className="mb-6">
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-1.5">
          Join the UpperCurve Community
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Skip the noise. Get high-signal AI updates, production architectures, code reviews, and weekend session invites.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Your name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0066FF] focus:ring-3 focus:ring-blue-100 transition-all font-medium"
          />
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rahul@company.com"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0066FF] focus:ring-3 focus:ring-blue-100 transition-all font-medium"
          />
        </div>

        {/* Country & Phone Number */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 outline-none focus:bg-white focus:border-[#0066FF] transition-all font-medium cursor-pointer"
            >
              <option value="India">India (🇮🇳)</option>
              <option value="United States">United States (🇺🇸)</option>
              <option value="United Kingdom">United Kingdom (🇬🇧)</option>
              <option value="Canada">Canada (🇨🇦)</option>
              <option value="Germany">Germany (🇩🇪)</option>
              <option value="Singapore">Singapore (🇸🇬)</option>
              <option value="United Arab Emirates">UAE (🇦🇪)</option>
              <option value="Other">Other International</option>
            </select>
          </div>

          <div className="sm:col-span-7">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              WhatsApp Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-xs font-bold text-gray-700 shrink-0">
                {country === "India" ? "+91" : "+"}
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className="w-full bg-gray-50 border border-gray-200 rounded-r-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0066FF] focus:ring-3 focus:ring-blue-100 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Do you know coding? Radio pill */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Do you know Coding?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setKnowsCoding("yes")}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                knowsCoding === "yes"
                  ? "bg-[#0066FF] border-[#0066FF] text-white shadow-sm"
                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>Yes, I code</span>
              {knowsCoding === "yes" && <span>✓</span>}
            </button>
            <button
              type="button"
              onClick={() => setKnowsCoding("no")}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                knowsCoding === "no"
                  ? "bg-[#0066FF] border-[#0066FF] text-white shadow-sm"
                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>No, non-technical</span>
              {knowsCoding === "no" && <span>✓</span>}
            </button>
          </div>
        </div>

        {/* What describes you best & Years of experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              What describes you best?
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-xs sm:text-sm text-gray-900 outline-none focus:bg-white focus:border-[#0066FF] transition-all font-medium cursor-pointer"
            >
              <option value="Working Professional">Working Professional</option>
              <option value="Student">Student / Fresher</option>
              <option value="Self Employed / Freelancer">Freelancer / Creator</option>
              <option value="Tech Lead / Architect">Tech Lead / Architect</option>
              <option value="Career Switcher">Career Switcher</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Years of experience
            </label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-xs sm:text-sm text-gray-900 outline-none focus:bg-white focus:border-[#0066FF] transition-all font-medium cursor-pointer"
            >
              <option value="0 years (Fresher)">0 years (Fresher)</option>
              <option value="1-3 years">1-3 years</option>
              <option value="3-5 years">3-5 years</option>
              <option value="5-10 years">5-10 years</option>
              <option value="10+ years">10+ years</option>
            </select>
          </div>
        </div>

        {/* Opt-in Checkboxes */}
        <div className="space-y-2.5 pt-2 text-xs text-gray-600">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={optMasterclass}
              onChange={(e) => setOptMasterclass(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-[#0066FF] focus:ring-blue-200 cursor-pointer"
            />
            <span className="leading-snug">
              I also want free VIP invites to upcoming weekend AI masterclasses & live build jams
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={optNewsletter}
              onChange={(e) => setOptNewsletter(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-[#0066FF] focus:ring-blue-200 cursor-pointer"
            />
            <span className="leading-snug">
              Subscribe me to the weekly UpperCurve Engineering & AI Dispatch
            </span>
          </label>
        </div>

        {/* Social Proof Counter */}
        <div className="flex items-center gap-3 pt-3 pb-1">
          <div className="flex -space-x-2 overflow-hidden shrink-0">
            <span className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              AK
            </span>
            <span className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              SS
            </span>
            <span className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              RD
            </span>
            <span className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              VM
            </span>
          </div>
          <span className="text-xs text-gray-600 font-medium">
            <b className="text-gray-900 font-bold">15,000+ engineers</b> have joined
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#0070F3] hover:bg-[#005FE0] text-white font-extrabold text-sm sm:text-base py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Generating your invite...</span>
            </span>
          ) : (
            <>
              <span>Get Instant WhatsApp Access</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>

        <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1.5 pt-1">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Your data is 100% safe. No spam, ever. Leave anytime.</span>
        </p>
      </form>
    </div>
  );
}

export default CommunityRegisterCard;
