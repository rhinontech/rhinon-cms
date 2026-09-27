"use client";

import React, { useState } from "react";
import { AnimateWrapper, CounterNumber, TextAnimation } from "@/components/Animations";
import { PrimaryButton } from "@/components/Common";

export function PricingSection() {
  const [isInstallments, setIsInstallments] = useState(false);

  const pricingPlans = [
    {
      name: "Self-paced",
      price: isInstallments ? "$220/mo" : "$599",
      sub: isInstallments ? "3 monthly payments" : "One-time enrollment",
      popular: false,
      features: [
        "All 6 modules, lifetime access",
        "Project briefs + critique library",
        "Private community access",
        "Certificate on completion",
      ],
      ctaText: "Enroll now",
      ctaBg: "bg-white hover:bg-gray-100 text-gray-900 border border-gray-200",
    },
    {
      name: "Cohort",
      price: isInstallments ? "$549/mo" : "$1499",
      sub: isInstallments ? "3 monthly payments" : "One-time enrollment",
      popular: true,
      popularTag: "Most popular",
      features: [
        "Everything in Self-Paced",
        "Live 12-week cohort",
        "Weekly 1:1 critique",
        "Career coaching + mock interviews",
        "Hiring partner network",
      ],
      ctaText: "Enroll now",
      ctaBg: "bg-[#18181b] hover:bg-black text-white shadow-lg",
    },
    {
      name: "1-on-1 Mentorship",
      price: isInstallments ? "$1,250/mo" : "$3,499",
      sub: isInstallments ? "3 monthly payments" : "One-time enrollment",
      popular: false,
      features: [
        "Everything in Cohort",
        "Dedicated mentor (10+ yrs)",
        "Weekly 1:1 video calls",
        "Resume + portfolio audit",
        "Direct intros to hiring partners",
      ],
      ctaText: "Enroll now",
      ctaBg: "bg-white hover:bg-gray-100 text-gray-900 border border-gray-200",
    },
  ];

  return (
    <section className="py-24 max-sm:py-14 text-gray-900 font-sans antialiased ">
      <div className=" flex flex-col items-center text-center">

        {/* Amber Badge */}
        <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
          Pricing
        </span>

        {/* Headline */}
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-8">
          <TextAnimation>Pick your path</TextAnimation>
        </h2>

        {/* Payment Toggle Switch */}
        <div className="flex items-center gap-3 mb-16 text-xs font-semibold text-gray-600">
          <span className={!isInstallments ? "text-gray-900 font-bold" : "text-gray-400"}>
            Pay once
          </span>
          <button
            onClick={() => setIsInstallments(!isInstallments)}
            className="w-12 h-6 bg-gray-900 rounded-full p-1 transition-colors relative"
            aria-label="Toggle Installments"
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform ${isInstallments ? "translate-x-6" : "translate-x-0"
                }`}
            />
          </button>
          <span className={isInstallments ? "text-gray-900 font-bold" : "text-gray-400"}>
            Pay in 3 installments
          </span>
        </div>

        {/* 3 Pricing Cards Grid */}
        <AnimateWrapper className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {pricingPlans.map((plan, idx) => {
            if (plan.popular) {
              return (
                /* Middle Most Popular Card: Outer Container */
                <div
                  key={idx}
                  className="relative flex flex-col justify-between text-left z-20"
                >
                  {/* ABSOLUTE Top Black Header Band (Sits behind the white card layer) */}
                  <div className="absolute -top-5 inset-x-0 h-12 bg-black text-white text-center rounded-t-2xl text-[10px] font-bold pt-1 tracking-wide uppercase">
                    {plan.popularTag}
                  </div>

                  {/* Main White Card Body (Sits on top with z-10 and bg-white) */}
                  <div className="relative z-10 bg-white border border-gray-200/80 rounded-3xl p-8 sm:p-10 flex flex-col justify-between flex-1 shadow-2xl overflow-hidden">
                    {/* 3D Green Clover Graphic in Top-Right */}
                    <img
                      src="/pricing/image1.avif"
                      alt="Clover Graphic"
                      className="absolute -top-3 -right-3 w-28 sm:w-32 h-auto object-contain pointer-events-none drop-shadow-md z-10"
                    />

                    <div>
                      {/* Plan Title */}
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        {plan.name}
                      </h3>

                      {/* Price */}
                      <div className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-1.5">
                        <CounterNumber key={plan.price}>{plan.price}</CounterNumber>
                      </div>
                      <div className="text-xs font-medium text-gray-500 mb-8 border-b border-gray-200/70 pb-6">
                        {plan.sub}
                      </div>

                      {/* Features List */}
                      <ul className="space-y-4 mb-8 z-10 relative">
                        {plan.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-3 text-xs sm:text-sm font-medium text-gray-800">
                            <span className="w-5 h-5 rounded-full bg-white border border-gray-200/80 flex items-center justify-center text-[10px] text-gray-600 font-bold shadow-2xs shrink-0">
                              ✓
                            </span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}

                    <PrimaryButton>{plan.ctaText}</PrimaryButton>
                  </div>
                </div>
              );
            }

            return (
              /* Regular Cards 1 & 3 */
              <div
                key={idx}
                className="bg-[#f4f5f7] border border-gray-200/80 rounded-3xl p-8 sm:p-10 flex flex-col justify-between text-left relative shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div>
                  {/* Plan Title */}
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-1.5">
                    <CounterNumber key={plan.price}>{plan.price}</CounterNumber>
                  </div>
                  <div className="text-xs font-medium text-gray-500 mb-8 border-b border-gray-200/70 pb-6">
                    {plan.sub}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-3 text-xs sm:text-sm font-medium text-gray-800">
                        <span className="w-5 h-5 rounded-full bg-white border border-gray-200/80 flex items-center justify-center text-[10px] text-gray-600 font-bold shadow-2xs shrink-0">
                          ✓
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button className="w-full py-4 rounded-full font-extrabold text-sm transition-all duration-200 active:scale-95 text-center mt-6 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200/80 shadow-sm">
                  {plan.ctaText}
                </button>
              </div>
            );
          })}
        </AnimateWrapper>

      </div >
    </section >
  );
}

export default PricingSection;
