"use client";

import React, { useState, useEffect } from "react";

export interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
}

export function EventRegistrationModal({
  isOpen,
  onClose,
  eventTitle = "2 Days AI PM Masterclass",
  eventDate,
  eventTime,
}: EventRegistrationModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    experience: "1-3 Years",
    expectation: "",
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Keep handleSubmit empty as requested (to be implemented later)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Intentionally empty: implementation will be added later
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-3xl border border-gray-200/90 shadow-2xl p-6 sm:p-8 my-8 text-left transition-all overflow-hidden"
      >
        {/* Soft Ambient Corner Aura */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-indigo-50/70 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-emerald-50/70 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center text-sm font-medium transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="relative z-10 mb-6 pr-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium mb-2.5 font-poppins">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>100% Free Live Masterclass</span>
          </div>

          <h3
            id="register-modal-title"
            className="text-xl sm:text-2xl font-medium text-gray-900 tracking-tight font-poppins leading-snug"
          >
            Register for Masterclass
          </h3>

          <p
            className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed"
            style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
          >
            {eventTitle}
            {(eventDate || eventTime) && (
              <span className="block text-gray-500 text-xs mt-0.5 font-poppins">
                {eventDate} {eventTime ? `• ${eventTime}` : ""}
              </span>
            )}
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="relative z-10 space-y-4 font-poppins">
          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="e.g. John Doe"
              className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/60 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-normal"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john@example.com"
              className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/60 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-normal"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1.5">
              Phone / WhatsApp Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/60 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-normal"
            />
          </div>

          {/* Experience Tier */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1.5">
              Work Experience
            </label>
            <select
              value={formData.experience}
              onChange={(e) =>
                setFormData({ ...formData, experience: e.target.value })
              }
              className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/60 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-normal cursor-pointer"
            >
              <option value="College Student / Fresher">College Student / Fresher</option>
              <option value="1-3 Years">1-3 Years (Early Career)</option>
              <option value="3-9 Years">3-9 Years (Mid Career)</option>
              <option value="10+ Years">10+ Years (Senior / Leadership)</option>
            </select>
          </div>

          {/* Brief Expectation */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1.5">
              What do you hope to learn? (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.expectation}
              onChange={(e) =>
                setFormData({ ...formData, expectation: e.target.value })
              }
              placeholder="e.g. How to use AI agents in product workflows..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/60 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all resize-none font-normal"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition-all cursor-pointer font-poppins flex items-center gap-2"
            >
              <span>Register Now</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          </div>

          {/* Guarantees */}
          <div className="flex items-center justify-center gap-3 pt-2 text-[11px] text-gray-500 font-normal">
            <span className="flex items-center gap-1 font-medium text-emerald-700">
              ✓ 100% Free
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-emerald-700">
              ✓ Certificate Included
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-gray-600">
              ✓ No Spam
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventRegistrationModal;
