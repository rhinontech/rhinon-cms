"use client";

import React from "react";
import JobsHero from "./JobsHero";
import JobsExplorer from "./JobsExplorer";

export function JobsPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center">
      {/* 1. Hero Section matching screenshot UI in UpperCurve white theme */}
      <JobsHero
        title="Curated Jobs"
        subtitle="Discover exclusive opportunities curated by UpperCurve"
        jobCount="8676"
      />

      {/* 2. Jobs Explorer: Category Tabs, Filters, WhatsApp Alerts, and Cards Grid */}
      <JobsExplorer />
    </main>
  );
}

export default JobsPage;
