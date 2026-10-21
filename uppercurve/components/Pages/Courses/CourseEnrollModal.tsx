"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, X } from "lucide-react";

export interface CourseEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle?: string;
  whatsappGroupUrl?: string;
}

export function CourseEnrollModal({
  isOpen,
  onClose,
  courseTitle = "Agentic AI Launchpad",
  whatsappGroupUrl = "https://chat.whatsapp.com/",
}: CourseEnrollModalProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    userType: "Working Professional" as "Working Professional" | "Student",
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => firstField.current?.focus(), 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    const payload = {
      course: courseTitle,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      linkedin: form.linkedin.trim() || undefined,
      userType: form.userType,
      submittedAt: new Date().toISOString(),
    };

    // User requirement: For now just console the form data
    console.log("=== Course Enrollment Application Submitted ===");
    console.log(payload);

    setSubmitted(true);
  };

  const fieldClass =
    "w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-[14.5px] text-[#0B1B3D] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0052FF] focus:ring-4 focus:ring-[#0052FF]/10";
  const labelClass = "block text-[12.5px] font-semibold text-[#334155] mb-1.5";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enroll-title"
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#06102B]/70 p-4 backdrop-blur-sm font-[family-name:var(--font-plus-jakarta)]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative my-6 w-full max-w-lg overflow-hidden rounded-3xl bg-white text-[#0B1B3D] shadow-[0_40px_100px_-20px_rgba(11,27,61,0.5)] border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top gradient accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#0052FF] via-[#0077FF] to-[#00C2FF]" aria-hidden />

        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-5 grid size-9 place-items-center rounded-full text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0B1B3D] transition-colors"
        >
          <X className="size-4" />
        </button>

        {submitted ? (
          /* Pop-Up -> Tick Mark & Confirmation View */
          <div className="px-6 py-9 sm:px-10 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#ECFDF3] text-[#16A34A] shadow-[0_4px_20px_rgba(22,163,74,0.15)] mb-5">
              <CheckCircle2 className="size-9" />
            </span>

            <h2 id="enroll-title" className="text-2xl font-extrabold tracking-tight text-[#0B1B3D]">
              Application Received
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-relaxed text-[#475569]">
              Thank you for submitting your details. We have received your application &amp; you will receive a call from our team soon.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <a
                href={whatsappGroupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-[4px] bg-[#25D366] hover:bg-[#20ba59] px-6 py-3.5 text-[13px] font-bold uppercase tracking-wider text-white shadow-[0_10px_24px_-8px_rgba(37,211,102,0.4)] transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span>Join WhatsApp Group</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="mt-1 text-[13px] font-semibold text-[#64748B] hover:text-[#0B1B3D] transition-colors py-1.5"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="px-6 py-7 sm:px-9 sm:py-8" noValidate>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0052FF]">
              Cohort Application
            </p>
            <h2 id="enroll-title" className="mt-1.5 pr-8 text-[22px] font-extrabold leading-snug tracking-tight text-[#0B1B3D]">
              Enroll in {courseTitle}
            </h2>

            {error ? (
              <p className="mt-4 rounded-xl bg-red-50 border border-red-200/80 px-3.5 py-2.5 text-[13px] text-red-600 font-medium">
                {error}
              </p>
            ) : null}

            <div className="mt-5 space-y-4">
              <div>
                <label className={labelClass} htmlFor="enroll-name">
                  Name *
                </label>
                <input
                  ref={firstField}
                  id="enroll-name"
                  type="text"
                  required
                  className={fieldClass}
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="enroll-email">
                    Email *
                  </label>
                  <input
                    id="enroll-email"
                    type="email"
                    required
                    className={fieldClass}
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="enroll-phone">
                    Phone Number *
                  </label>
                  <input
                    id="enroll-phone"
                    type="tel"
                    required
                    className={fieldClass}
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="enroll-linkedin">
                  LinkedIn Profile
                </label>
                <input
                  id="enroll-linkedin"
                  type="url"
                  className={fieldClass}
                  placeholder="https://linkedin.com/in/username"
                  value={form.linkedin}
                  onChange={(e) => setField("linkedin", e.target.value)}
                />
              </div>

              <div>
                <span className={labelClass}>
                  Option: Working Professional or Students *
                </span>
                <div
                  className="grid grid-cols-2 gap-2 rounded-xl bg-[#F1F5F9] p-1"
                  role="radiogroup"
                  aria-label="Working Professional or Student"
                >
                  {(["Working Professional", "Student"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={form.userType === type}
                      onClick={() => setField("userType", type)}
                      className={`rounded-lg py-2.5 text-[13.5px] font-semibold transition cursor-pointer ${
                        form.userType === type
                          ? "bg-white text-[#0B1B3D] shadow-xs"
                          : "text-[#64748B] hover:text-[#0B1B3D]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-7">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#0052FF] hover:bg-[#0043CC] px-7 py-3.5 text-[13px] font-bold uppercase tracking-wider text-white shadow-[0_12px_24px_-8px_rgba(0,82,255,0.6)] transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>Submit Application</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CourseEnrollModal;
