"use client";

import React, { useState, useEffect } from "react";
import { registerForEvent } from "@/services/eventService";

export interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventId?: string;
  eventSlug?: string;
}

export function EventRegistrationModal({
  isOpen,
  onClose,
  eventTitle = "2 Days AI PM Masterclass",
  eventDate,
  eventTime,
  eventId,
  eventSlug,
}: EventRegistrationModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    experience: "1-3 Years",
    expectation: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;

    setSubmitting(true);
    setErrorMsg("");

    const isStudent = formData.experience.toLowerCase().includes("student");
    const res = await registerForEvent({
      eventId,
      eventSlug,
      name: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      role: formData.experience,
      userType: isStudent ? "Student" : "Professional",
      expectation: formData.expectation.trim() || undefined,
    });

    setSubmitting(false);
    if (res.success) {
      setSubmitted(true);
    } else {
      setErrorMsg(res.message || "Failed to register. Please try again.");
    }
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

        {submitted ? (
          <div className="relative z-10 py-8 px-2 text-center font-poppins">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-emerald-500/25">
              ✓
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2">
              Seat Reserved Successfully!
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto leading-relaxed mb-6">
              You&apos;re registered for{" "}
              <span className="font-semibold text-gray-900">{eventTitle}</span>.
              A calendar invite and session link will be sent to{" "}
              <span className="font-semibold text-indigo-600">{formData.email}</span>.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold transition-all shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
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

            {errorMsg && (
              <div className="relative z-10 mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium font-poppins">
                {errorMsg}
              </div>
            )}

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
                  placeholder="name@company.com or name@gmail.com"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/60 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-normal"
                />
              </div>

              {/* Phone & Experience Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1.5">
                    WhatsApp / Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/60 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-normal"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1.5">
                    Your Experience
                  </label>
                  <select
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: e.target.value })
                    }
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 bg-gray-50/60 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all cursor-pointer font-normal"
                  >
                    <option value="College Student">College Student / Fresher</option>
                    <option value="0-1 Years">0-1 Years Experience</option>
                    <option value="1-3 Years">1-3 Years Experience</option>
                    <option value="3-5 Years">3-5 Years Experience</option>
                    <option value="5+ Years">5+ Years Experience</option>
                  </select>
                </div>
              </div>

              {/* What do you want to learn? */}
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-500 mb-1.5">
                  What do you hope to learn or build? (Optional)
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
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 active:scale-[0.98] text-white text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition-all cursor-pointer font-poppins flex items-center gap-2"
                >
                  <span>{submitting ? "Registering..." : "Register Now"}</span>
                  <svg
                    className={`w-4 h-4 ${submitting ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    {submitting ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    )}
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
          </>
        )}
      </div>
    </div>
  );
}

export default EventRegistrationModal;
