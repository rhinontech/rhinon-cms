"use client";

import React, { useState } from "react";
import Link from "next/link";
import { JobListing } from "../jobData";

export function JobDetailsPage({ job }: { job: JobListing }) {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Form submission handler (to be implemented later)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation to be added later
  };

  return (
    <main className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-4xl mx-auto">
        {/* Back Navigation */}
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors mb-6 cursor-pointer group"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Job Board</span>
        </Link>

        {/* 1. Header Card (Title, Company, Location, Apply Bar) */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-100">
            {/* Left: Logo & Job Info */}
            <div className="flex items-start gap-4 sm:gap-5">
              {/* Logo box */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-base sm:text-lg tracking-wider font-extrabold shadow-xs border shrink-0 ${
                  job.logoBg || "bg-indigo-50 border-indigo-200 text-indigo-700"
                }`}
              >
                {job.logoText || job.company.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight font-poppins">
                  {job.title}
                </h1>
                <p className="text-base font-semibold text-gray-700 mt-1">
                  {job.company}
                </p>

                {/* Sub-meta: Location & Type */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2.5 text-xs sm:text-sm font-medium text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{job.fullLocation || job.location}</span>
                  </div>

                  <span className="text-gray-300">•</span>

                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="capitalize">{job.type.toLowerCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Login To Apply</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Bottom Bar: Posted Time & Category Badge */}
          <div className="pt-4 flex items-center justify-between text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{job.postedAt}</span>
            </div>

            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
              {job.level}
            </span>
          </div>
        </div>

        {/* 2. Main Content Card (Qualifications, Skills, Responsibilities) */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 sm:p-10 space-y-9">
          {/* Minimum Qualifications */}
          {job.minimumQualifications && job.minimumQualifications.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight font-poppins mb-4">
                Minimum Qualifications
              </h2>
              <ul className="list-disc pl-5 space-y-2.5 text-gray-700 text-sm sm:text-[15px] leading-relaxed">
                {job.minimumQualifications.map((item, idx) => (
                  <li key={idx} className="pl-1">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preferred Qualifications */}
          {job.preferredQualifications && job.preferredQualifications.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight font-poppins mb-4">
                Preferred Qualifications
              </h2>
              <ul className="list-disc pl-5 space-y-2.5 text-gray-700 text-sm sm:text-[15px] leading-relaxed">
                {job.preferredQualifications.map((item, idx) => (
                  <li key={idx} className="pl-1">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight font-poppins mb-4">
                Skills
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm sm:text-[15px] leading-relaxed">
                {job.skills.map((skill, idx) => (
                  <li key={idx} className="pl-1">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description & Responsibilities */}
          <div className="pt-4 border-t border-gray-100 space-y-5">
            {job.description && (
              <p className="text-gray-700 text-sm sm:text-[15px] leading-relaxed">
                {job.description}
              </p>
            )}

            {job.responsibilities && job.responsibilities.length > 0 && (
              <ul className="list-disc pl-5 space-y-3.5 text-gray-700 text-sm sm:text-[15px] leading-relaxed">
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx} className="pl-1">
                    {resp}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Bottom Apply CTA */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
          >
            <span>Login To Apply</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* ================= APPLICATION FORM MODAL ================= */}
      {isApplyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto"
          onClick={() => setIsApplyModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 sm:p-8 my-8 text-left transition-all"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-5 pr-8">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs tracking-wider font-extrabold shadow-2xs border shrink-0 ${
                  job.logoBg || "bg-indigo-50 border-indigo-200 text-indigo-700"
                }`}
              >
                {job.logoText || job.company.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Apply for Role
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight font-poppins leading-snug">
                  {job.title}
                </h3>
                <p className="text-xs font-medium text-gray-500">
                  {job.company} • {job.location}
                </p>
              </div>
            </div>

            {/* Application Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              {/* Resume / Portfolio URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Resume / Portfolio URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/... or linkedin.com/in/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              {/* Short Note / Cover Note */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Brief Note (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Share a short note about your experience and why you are interested in this position..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default JobDetailsPage;
