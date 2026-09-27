"use client";

import React from "react";
import CommunityHero from "./CommunityHero";
import CommunityRegisterCard from "./CommunityRegisterCard";
import CommunityBenefits from "./CommunityBenefits";
import TopicFAQSection from "../Homepage/TopicFAQSection/TopicFAQSection";

export function CommunityPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center font-sans">
      {/* 1. Centered Hero (Matching Reference Image 1) */}
      <CommunityHero />

      {/* 2. Registration Form Component */}
      <section className="w-full bg-white pb-20 px-4 sm:px-6 flex justify-center">
        <div className="w-full max-w-2xl mx-auto">
          <CommunityRegisterCard />
        </div>
      </section>

      {/* 3. 'What You'll Get' Section (Matching Reference Image 2) */}
      <CommunityBenefits />

      {/* 4. Topic FAQ Section */}
      <div className="w-full bg-white border-t border-gray-200/80">
        <TopicFAQSection academyName="UpperCurve Community" />
      </div>
    </main>
  );
}

export default CommunityPage;
