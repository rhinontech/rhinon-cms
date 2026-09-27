"use client";

import React, { useState, useMemo } from "react";
import { DUMMY_JOBS, JobCategory, JobListing } from "./jobData";
import JobCard from "./JobCard";

export function JobsExplorer() {
  const [activeCategory, setActiveCategory] = useState<"ALL" | JobCategory>("ALL");
  const [selectedLocation, setSelectedLocation] = useState<string>("All Locations");
  const [selectedLevel, setSelectedLevel] = useState<string>("All Levels");

  // Derive unique locations and levels from data
  const locations = useMemo(() => {
    const set = new Set<string>();
    DUMMY_JOBS.forEach((j) => set.add(j.location));
    return ["All Locations", ...Array.from(set)];
  }, []);

  const levels = useMemo(() => {
    const set = new Set<string>();
    DUMMY_JOBS.forEach((j) => set.add(j.level));
    return ["All Levels", ...Array.from(set)];
  }, []);

  // Filter jobs dynamically
  const filteredJobs = useMemo(() => {
    return DUMMY_JOBS.filter((job) => {
      // Category filter
      if (activeCategory !== "ALL" && job.category !== activeCategory) {
        return false;
      }
      // Location filter
      if (selectedLocation !== "All Locations" && job.location !== selectedLocation) {
        return false;
      }
      // Level filter
      if (selectedLevel !== "All Levels" && job.level !== selectedLevel) {
        return false;
      }
      return true;
    });
  }, [activeCategory, selectedLocation, selectedLevel]);

  const hasActiveFilters =
    activeCategory !== "ALL" ||
    selectedLocation !== "All Locations" ||
    selectedLevel !== "All Levels";

  const handleClearFilters = () => {
    setActiveCategory("ALL");
    setSelectedLocation("All Locations");
    setSelectedLevel("All Levels");
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-5 sm:px-6 py-12">
      {/* ================= 1. CATEGORY TABS ================= */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center p-1 rounded-xl bg-gray-100 border border-gray-200/80 shadow-xs">
          {(["ALL", "PRODUCT", "ENGINEERING"] as const).map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-7 sm:px-9 py-2.5 rounded-lg text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= 2. FILTER & CTA BAR ================= */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-10 pb-4">
        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Location Dropdown */}
          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="appearance-none bg-white border border-gray-200 hover:border-gray-300 rounded-xl pl-4 pr-10 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 shadow-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer min-w-[150px]"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              ▼
            </span>
          </div>

          {/* Level Dropdown */}
          <div className="relative">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="appearance-none bg-white border border-gray-200 hover:border-gray-300 rounded-xl pl-4 pr-10 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 shadow-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer min-w-[140px]"
            >
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl === "All Levels" ? "All Levels" : lvl}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              ▼
            </span>
          </div>
        </div>

        {/* Right Action: WhatsApp CTA & Clear Filters */}
        <div className="flex items-center flex-wrap gap-4 self-end lg:self-auto">
          {/* WhatsApp Channel Alert Button */}
          <a
            href="https://chat.whatsapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2e7d32] hover:bg-[#256828] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all hover:shadow-md cursor-pointer"
          >
            {/* WhatsApp Icon */}
            <svg
              className="w-4 h-4 fill-current shrink-0"
              viewBox="0 0 24 24"
            >
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.78 14.07c-.24.68-1.4 1.25-1.95 1.33-.51.08-1.18.11-3.41-.81-2.85-1.18-4.67-4.08-4.81-4.27-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.37.26-.28.58-.35.77-.35.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.33.02.53-.1.2-.15.32-.3.49-.15.17-.32.38-.46.51-.15.15-.31.31-.13.62.18.31.8 1.32 1.72 2.14 1.18 1.05 2.17 1.37 2.48 1.52.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.16.28.1.78.84 2.1 1.49.32.16.53.24.61.37.08.13.08.76-.16 1.44z" />
            </svg>
            <span>Stay updated on new job openings</span>
          </a>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= 3. JOB CARDS GRID ================= */}
      {filteredJobs.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h4 className="text-base font-bold text-gray-900 mb-1 font-poppins">
            No jobs found
          </h4>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 max-w-sm">
            Try adjusting your category, location, or level filters to see more results.
          </p>
          <button
            onClick={handleClearFilters}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
}

export default JobsExplorer;
