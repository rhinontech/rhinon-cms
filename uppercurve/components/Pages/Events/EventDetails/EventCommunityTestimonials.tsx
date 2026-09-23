"use client";

import React from "react";

const serifStyle = { fontFamily: 'Georgia, "Times New Roman", Times, serif' };

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  companyLogo: React.ReactNode;
  imageUrl: string;
}

export function EventCommunityTestimonials() {
  const testimonials: Testimonial[] = [
    {
      id: "tushan",
      name: "Tushan Kumar Singh",
      role: "PM Intern",
      quote:
        "I learned to look at product roles beyond tasks—understanding user needs, prioritizing ruthlessly, and backing up decisions with real reasoning. The mentor interactions were especially powerful in helping me simplify complex problems and navigate real-world challenges.",
      companyLogo: (
        <span className="text-white text-base sm:text-lg font-medium tracking-tight font-poppins">
          droom
        </span>
      ),
      imageUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "snehal",
      name: "Snehal Ved",
      role: "Associate Product Manager",
      quote:
        "For me, the real transformation came from learning how to think more deeply about user journeys and business impact. I used to focus mostly on execution, but now I start by questioning the 'why' behind every feature. The guidance I received helped me shift from doing tasks to thinking like a true product owner.",
      companyLogo: (
        <div className="flex items-center gap-1">
          <span className="text-white text-xs sm:text-sm font-medium tracking-tight font-poppins">
            InsuranceDekho
          </span>
        </div>
      ),
      imageUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "hemant",
      name: "Hemant Kumar",
      role: "Student",
      quote:
        "I wanted to break into product but didn't know how to showcase my skills. Learning to think like a PM—prioritizing, understanding users, and writing specs—made all the difference. The guidance and feedback made the transition feel real and achievable.",
      companyLogo: (
        <svg className="w-6 h-6 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
        </svg>
      ),
      imageUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "aadhar",
      name: "Aadhar Singh Bhadauria",
      role: "Student",
      quote:
        "The environment really encouraged experimentation. I got to work on real scenarios, build mock features, and even go through product reviews—something I'd never done before. It gave me the confidence to take my first step into product.",
      companyLogo: (
        <svg className="w-6 h-6 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
        </svg>
      ),
      imageUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "aravinda",
      name: "Aravinda Reddy",
      role: "Student",
      quote:
        "I was interested in product for a long time but didn't know where to start. This experience gave me structure, practical frameworks, and real problem-solving tools that completely changed the trajectory of my learning. It helped me build and ship with conviction.",
      companyLogo: (
        <span className="text-white text-xs sm:text-sm font-medium tracking-wider font-poppins uppercase">
          Razorpay
        </span>
      ),
      imageUrl:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "pooja",
      name: "Pooja Sharma",
      role: "Associate Product Specialist",
      quote:
        "The hands-on AI PRD workshops and opportunity discovery frameworks immediately translated to my work. My manager noticed the change in how I formulate problem statements and drive roadmap discussions with engineering.",
      companyLogo: (
        <span className="text-white text-xs sm:text-sm font-medium tracking-wider font-poppins uppercase">
          Swiggy
        </span>
      ),
      imageUrl:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
    },
  ];

  return (
    <section className="w-full bg-white py-14 sm:py-20 px-4 sm:px-6 flex justify-center border-b border-gray-100 select-none overflow-hidden">
      <div className="w-full max-w-7xl flex flex-col items-center">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14 font-poppins">
          <span className="block text-xs sm:text-sm font-medium tracking-widest uppercase text-indigo-600 mb-2">
            COMMUNITY VOICES
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-900 tracking-tight leading-tight">
            Hear from the Community
          </h2>
        </div>

        {/* Infinite Moving Testimonial Cards Marquee (Right to Left) */}
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div
            className="flex w-max items-stretch gap-6 sm:gap-7 animate-marquee hover:[animation-play-state:paused] py-3"
            style={{ animationDuration: "36s" }}
          >
            {/* Duplicated 3 times for seamless infinite right-to-left loop */}
            {[...Array(3)].flatMap(() => testimonials).map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="w-[310px] sm:w-[350px] min-h-[460px] flex flex-col justify-between rounded-3xl border border-gray-200/90 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-indigo-300 transition-all duration-300 overflow-hidden shrink-0 group relative"
              >
                {/* Top Subtle Grid Background */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

                {/* Content Area */}
                <div className="relative z-10 p-6 sm:p-7 flex flex-col text-left">
                  {/* Name & Role */}
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 tracking-tight font-poppins leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium font-poppins mt-0.5 mb-4">
                    {item.role}
                  </p>

                  {/* Quote */}
                  <p
                    className="text-xs sm:text-[13px] text-gray-600 leading-relaxed font-normal"
                    style={serifStyle}
                  >
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                {/* Bottom Bar with Cutout Photo & Company Logo */}
                <div className="relative h-28 sm:h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 px-5 flex items-end justify-between overflow-visible mt-4">
                  {/* Participant Cutout Portrait Photo on Left */}
                  <div className="absolute -bottom-0 left-4 w-24 sm:w-28 h-32 sm:h-36 overflow-hidden rounded-t-2xl z-10 filter contrast-105 group-hover:scale-105 transition-transform duration-300">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover object-top filter grayscale contrast-125"
                    />
                  </div>

                  {/* Empty left spacer for photo */}
                  <div className="w-24 sm:w-28 shrink-0" />

                  {/* Company Logo on Right */}
                  <div className="pb-5 pr-1 flex items-center justify-end z-20">
                    {item.companyLogo}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default EventCommunityTestimonials;
