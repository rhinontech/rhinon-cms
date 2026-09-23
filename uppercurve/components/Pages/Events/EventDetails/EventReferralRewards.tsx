"use client";

import React, { useState } from "react";

const serifStyle = { fontFamily: 'Georgia, "Times New Roman", Times, serif' };

interface RewardTier {
  referralCount: number;
  perks: {
    text: string;
    highlight?: string;
  }[];
}

export function EventReferralRewards() {
  const [copied, setCopied] = useState(false);

  const tiers: RewardTier[] = [
    {
      referralCount: 5,
      perks: [
        {
          text: "Free access to recordings & resources from all sessions",
        },
      ],
    },
    {
      referralCount: 10,
      perks: [
        {
          text: "Access to Live Q&A Sessions",
        },
        {
          text: "A Free 1:1 Personalized Mentorship session",
          highlight: "1:1 Personalized Mentorship",
        },
      ],
    },
    {
      referralCount: 20,
      perks: [
        {
          text: "Exclusive Resources from Product Space (worth ₹2000)",
        },
        {
          text: "30 Min 1:1 Career Guidance with top mentors",
          highlight: "30 Min 1:1 Career Guidance",
        },
      ],
    },
  ];

  const handleGetReferralLink = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/events?ref=uppercurve`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  return (
    <section className="w-full bg-white py-12 sm:py-16 px-4 sm:px-6 flex justify-center border-b border-gray-100 select-none">
      <div className="w-full max-w-6xl flex flex-col items-center">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 font-poppins">
          <span className="block text-xs sm:text-sm font-medium tracking-widest uppercase text-indigo-600 mb-2">
            COMMUNITY PERKS
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-900 tracking-tight leading-tight">
            Unlock Exclusive Rewards by Referring
          </h2>
        </div>

        {/* 3 Referral Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full mb-10 sm:mb-12 items-stretch">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center rounded-3xl border border-gray-200/90 bg-white p-7 sm:p-9 shadow-[0_4px_30px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-indigo-300 transition-all duration-300 group"
            >
              {/* Number of Referrals */}
              <span
                className="text-4xl sm:text-5xl font-medium text-gray-900 tracking-tight group-hover:scale-105 transition-transform"
                style={serifStyle}
              >
                {tier.referralCount}
              </span>
              <span className="text-xs sm:text-[13px] font-medium text-gray-500 font-poppins uppercase tracking-wider mt-1 mb-8">
                Referrals
              </span>

              {/* Perks List */}
              <div className="w-full space-y-3 flex-1 flex flex-col justify-start">
                {tier.perks.map((perk, pIdx) => {
                  if (perk.highlight && perk.text.includes(perk.highlight)) {
                    const [before, after] = perk.text.split(perk.highlight);
                    return (
                      <div
                        key={pIdx}
                        className="w-full py-4 px-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-indigo-200 text-xs sm:text-sm text-gray-700 leading-relaxed font-normal transition-colors shadow-2xs"
                        style={serifStyle}
                      >
                        {before}
                        <span className="text-indigo-600 font-medium font-poppins">
                          {perk.highlight}
                        </span>
                        {after}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={pIdx}
                      className="w-full py-4 px-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-indigo-200 text-xs sm:text-sm text-gray-700 leading-relaxed font-normal transition-colors shadow-2xs"
                      style={serifStyle}
                    >
                      {perk.text}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleGetReferralLink}
            className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium text-sm sm:text-base shadow-sm hover:shadow-md inline-flex items-center gap-2.5 transition-all cursor-pointer font-poppins"
          >
            <span>{copied ? "Referral Link Copied!" : "GET REFERRAL LINK"}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </button>

          {copied && (
            <span className="text-xs font-medium text-emerald-600 font-poppins animate-fade-in">
              Copied to clipboard. Share with your friends!
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export default EventReferralRewards;
