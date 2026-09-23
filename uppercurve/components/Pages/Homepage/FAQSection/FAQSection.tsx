"use client";

import { AnimateWrapper, TextAnimation } from "@/components/Animations";
import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default as in screenshot

  const faqs: FAQItem[] = [
    {
      question: "Who is UpperCurve for?",
      answer: "Students and early-career professionals who want practical skills, real project experience, mentorship, and momentum toward their next opportunity.",
    },
    {
      question: "What kind of programs do you run?",
      answer: "Programs evolve with technology and industry demand — think AI and technology tracks, software and engineering, product and business, career accelerators, fellowships, and industry projects. The formats stay constant: practical learning, real projects, mentorship, and community.",
    },
    {
      question: "Do I need prior experience?",
      answer: "It depends on the program. Many start from fundamentals, and each program lists what you should know before joining. Ambition and consistency matter more than credentials.",
    },
    {
      question: "How much time does it take?",
      answer: "Most programs are designed to fit alongside college or a full-time job, with a mix of live sessions and self-paced work. Exact commitments are listed per program.",
    },
    {
      question: "Do you help with careers?",
      answer: "Career preparation is built into everything we do — mentorship, portfolio and interview guidance, and real industry exposure. We focus on making you genuinely ready for opportunities, not on making guarantees.",
    },
    {
      question: "Is this just another course platform?",
      answer: "No. Courses are one way we deliver value, but UpperCurve is a career growth ecosystem: programs, projects, mentorship, events, and a community of ambitious people — built to keep you moving forward.",
    },
  ];

  return (
    <section className=" py-24 max-sm:py-14  text-gray-900 font-sans antialiased ">
      <div className=" flex flex-col items-center text-center">

        {/* Top Question Mark Badge */}
        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md mb-6 hover:scale-105 transition-transform cursor-pointer">
          <span className="text-lg">❓</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-14">
          <TextAnimation> Questions? </TextAnimation> <br /><TextAnimation> Good </TextAnimation>
        </h2>

        {/* FAQ Accordion List */}
        <AnimateWrapper className="w-full max-w-3xl space-y-3 mb-12">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#f4f5f7] border border-gray-200/60 rounded-2xl overflow-hidden text-left"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 flex items-center justify-between font-bold text-base text-gray-900 hover:text-black transition-colors"
                >
                  <span>{faq.question}</span>
                  <div className="w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 ml-4">
                    {isOpen ? "−" : "+"}
                  </div>
                </button>

                {/* Animated Height & Opacity Container */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm font-medium text-gray-500 leading-relaxed border-t border-gray-200/40">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </AnimateWrapper>

        {/* Bottom Contact Link */}
        <AnimateWrapper as="p" className="text-xs font-semibold text-gray-500">
          Do you have any questions?{" "}
          <a href="#contact" className="text-gray-900 underline font-bold hover:text-black">
            Get in touch with us
          </a>
        </AnimateWrapper>

      </div >
    </section >
  );
}

export default FAQSection;
