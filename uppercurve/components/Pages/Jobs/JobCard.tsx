"use client";

import React from "react";
import Link from "next/link";
import { JobListing } from "./jobData";

export function JobCard({ job }: { job: JobListing }) {
  return (
    <div className="group relative flex flex-col justify-between bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      {/* Clickable overlay navigating to /jobs/[id] */}
      <Link
        href={`/jobs/${job.id}`}
        className="absolute inset-0 z-10"
        aria-label={`View details for ${job.title} at ${job.company}`}
      />

      {/* Top Header: Company Logo & Company Name */}
      <div>
        <div className="flex items-center gap-3.5 mb-5">
          {/* Logo container with cyan/indigo rim aura */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm tracking-wider font-extrabold shadow-sm border ${
              job.logoBg || "bg-indigo-50 border-indigo-200 text-indigo-700"
            } transition-transform group-hover:scale-105 duration-300 relative overflow-hidden`}
          >
            {job.logoText || job.company.slice(0, 2).toUpperCase()}
          </div>

          <span className="text-sm font-semibold text-gray-700 tracking-tight">
            {job.company}
          </span>
        </div>

        {/* Job Title */}
        <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-snug mb-4 group-hover:text-indigo-600 transition-colors font-poppins">
          {job.title}
        </h3>

        {/* Level and Type Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200/70">
            {job.level}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200/70">
            {job.type}
          </span>
        </div>
      </div>

      {/* Bottom Footer: Location & Posted Date */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
        {/* Location with Pin Icon */}
        <div className="flex items-center gap-1.5 text-gray-600">
          <svg
            className="w-3.5 h-3.5 text-indigo-600 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
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
          <span className="truncate max-w-[130px]">{job.location}</span>
        </div>

        {/* Posted Time */}
        <span className="text-gray-500 font-medium">
          {job.postedAt}
        </span>
      </div>
    </div>
  );
}

export default JobCard;
