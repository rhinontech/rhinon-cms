"use client";

import React from "react";

export function CommunityTestimonials() {
  const testimonials = [
    {
      name: "Rohan Verma",
      role: "Fullstack Developer at Zeta",
      avatar: "RV",
      color: "bg-blue-600",
      content:
        "The WhatsApp signals are pure gold. While everyone else was arguing on Twitter about AI hype, UpperCurve dropped an end-to-end RAG repository that I adapted for our team sprint within two days.",
      badge: "Production RAG Workshop",
    },
    {
      name: "Pooja Sundaram",
      role: "Software Engineer at Swiggy",
      avatar: "PS",
      color: "bg-emerald-600",
      content:
        "Attended their live build jam last month. The mentors actually answer technical questions and debug your code in real-time. Easily the highest quality developer community in India right now.",
      badge: "48h Build Jam",
    },
    {
      name: "Aditya Nair",
      role: "CS Senior & Open-Source Contributor",
      avatar: "AN",
      color: "bg-purple-600",
      content:
        "I was tired of basic Udemy courses. UpperCurve's community breaks down the latest research papers and agentic frameworks into practical code. Landed my first AI engineer internship through the peer network!",
      badge: "Career Switcher",
    },
  ];

  return (
    <section className="w-full py-20 bg-[#F8FAFC] font-sans border-b border-gray-200/80">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-black uppercase tracking-widest text-[#0066FF] mb-2">
            Member Experiences
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-3">
            What builders say about the community.
          </h2>
          <p className="text-sm text-gray-600">
            Join thousands of developers leveling up their technical skills together.
          </p>
        </div>

        {/* Testimonials 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200/90 rounded-3xl p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Top Quote Icon & Stars */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex text-amber-400 text-sm tracking-tighter">
                    {"★★★★★"}
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                    {t.badge}
                  </span>
                </div>

                {/* Content */}
                <p className="text-sm text-gray-700 leading-relaxed italic mb-6">
                  &ldquo;{t.content}&rdquo;
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div
                  className={`w-10 h-10 rounded-full ${t.color} text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-black text-gray-900 leading-none">
                    {t.name}
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-1 leading-none">
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CommunityTestimonials;
