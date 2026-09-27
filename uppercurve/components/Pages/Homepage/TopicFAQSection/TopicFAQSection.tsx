"use client";

import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

interface TopicCategory {
  id: string;
  name: string;
  faqs: FAQItem[];
}

interface TopicFAQSectionProps {
  academyName?: string;
}

export function TopicFAQSection({ academyName = "UpperCurve Academy" }: TopicFAQSectionProps) {
  const [activeTopicId, setActiveTopicId] = useState<string>("program");
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const topics: TopicCategory[] = [
    {
      id: "program",
      name: "Program",
      faqs: [
        {
          question: `What is ${academyName}?`,
          answer: (
            <div className="space-y-4 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                {academyName} is a structured upskilling institution for engineers across Software Engineering, AI, and Data domains who want to transition into strong product-based roles.
              </p>
              <p>
                Our programs are built on deep core engineering principles and real production thinking. At the same time, we ensure learners understand how to work effectively in an Applied GenAI-driven ecosystem, where AI enhances engineering workflows rather than replaces them.
              </p>
              <p>
                With live mentorship, structured practice, peer learning, and career guidance, we help working professionals move from execution-focused roles to ownership-driven roles in serious product companies.
              </p>
            </div>
          ),
        },
        {
          question: `Who is eligible for ${academyName}?`,
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                Working tech professionals, software engineers, and passionate learners looking to switch to high-growth product companies or upgrade their core skills in Software Engineering, Machine Learning, and Applied AI are eligible.
              </p>
              <p>
                A basic familiarity with programming fundamentals is recommended. Our admissions team conducts a short profile review to recommend the best cohort for your career stage.
              </p>
            </div>
          ),
        },
        {
          question: "When are the live classes held?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                Live sessions are scheduled on weekday evenings and weekends (usually 8:00 PM – 10:00 PM IST or Saturday/Sunday mornings) to accommodate working professionals and college schedules without conflict.
              </p>
            </div>
          ),
        },
        {
          question: "What if I miss a live lecture?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                Every live class is recorded in high definition and uploaded to your learning dashboard within a few hours, accompanied by structured session notes, code repositories, and assignments.
              </p>
              <p>
                You can also attend dedicated weekly doubt-resolution sessions or schedule a 1:1 slot with teaching assistants to clear any questions from missed sessions.
              </p>
            </div>
          ),
        },
        {
          question: `Does ${academyName} give certificates?`,
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                Yes. Upon successful completion of all core curriculum modules, capstone production projects, and assessments, you will receive a verifiable industry-recognized Certificate of Completion.
              </p>
            </div>
          ),
        },
        {
          question: `Is ${academyName}'s certification worth it?`,
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                Yes. The certification signifies hands-on mastery of production-grade architectures and verified project portfolios evaluated by senior industry engineers, providing strong credibility during recruitment interviews.
              </p>
            </div>
          ),
        },
      ],
    },
    {
      id: "teaching",
      name: "Teaching",
      faqs: [
        {
          question: "How is the curriculum structured?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                The curriculum follows a modular, project-first pedagogy designed by tech leads from top tier product companies. Each module combines foundational theory, live live-coding sessions, weekly graded assignments, and a real-world capstone project.
              </p>
            </div>
          ),
        },
        {
          question: "What is the balance between theory and hands-on coding?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                Over 70% of the program is dedicated to hands-on implementation, debugging, and building real systems from scratch rather than passive video lectures.
              </p>
            </div>
          ),
        },
        {
          question: "How is Applied GenAI integrated into the coursework?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                You learn how to leverage LLMs, prompt engineering, RAG pipelines, and AI copilot tooling within real developer workflows to deliver 10x engineering velocity.
              </p>
            </div>
          ),
        },
        {
          question: "How are assignments reviewed and evaluated?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                Your code is reviewed via automated test suites as well as line-by-line qualitative reviews by teaching assistants, focusing on clean code, edge cases, and architectural best practices.
              </p>
            </div>
          ),
        },
      ],
    },
    {
      id: "mentors",
      name: "Mentors",
      faqs: [
        {
          question: "Who are the instructors and mentors?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                Our instructors and mentors are Staff Engineers, Tech Leads, and Engineering Managers actively working at top product companies including Google, Microsoft, Amazon, Uber, and high-growth unicorns.
              </p>
            </div>
          ),
        },
        {
          question: "How does 1:1 mentorship work?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                You are paired with experienced mentors for personalized 1:1 sessions covering career roadmaps, mock technical interviews, resume roasts, and deep architectural guidance.
              </p>
            </div>
          ),
        },
        {
          question: "Can I schedule extra doubt-clearing sessions?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                Yes. Our teaching assistants and mentors host daily doubt-resolution hours where you can drop in and get instant help with blockers on your assignments.
              </p>
            </div>
          ),
        },
      ],
    },
    {
      id: "placements",
      name: "Placements & Outcomes",
      faqs: [
        {
          question: "What placement and career support is provided?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                Our career assistance program includes comprehensive resume rebuilding, LinkedIn profile optimization, GitHub portfolio curation, behavioral prep, and direct referral connections to 200+ hiring partners.
              </p>
            </div>
          ),
        },
        {
          question: "How many mock interviews are conducted?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                Learners undergo multiple realistic mock interviews with senior industry interviewers replicating exact rounds of top product companies, complete with detailed feedback scorecards.
              </p>
            </div>
          ),
        },
        {
          question: "What is the average salary hike or placement timeline?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                Graduates typically transition within 3 to 6 months of completing the curriculum, with alumni achieving average compensation increases between 60% and 130%.
              </p>
            </div>
          ),
        },
      ],
    },
    {
      id: "tuition",
      name: "Tuition Fee",
      faqs: [
        {
          question: "What are the payment options and EMI plans?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                We offer flexible payment options including upfront discounts, zero-cost EMI plans spanning 6 to 18 months through partner NBFCs, and credit card monthly installment facilities.
              </p>
            </div>
          ),
        },
        {
          question: "Are there any scholarships or financial discounts?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                Yes. Merit-based scholarships and early-application fee waivers are available for candidates demonstrating exceptional problem-solving potential during our diagnostic entrance assessment.
              </p>
            </div>
          ),
        },
        {
          question: "What is the refund or withdrawal policy?",
          answer: (
            <div className="space-y-3 text-gray-600 text-sm sm:text-[15px] leading-relaxed">
              <p>
                We offer a trial refund window during the first 7 days of the program. If you feel the program isn’t the right fit for any reason, you can request a 100% refund with zero questions asked.
              </p>
            </div>
          ),
        },
      ],
    },
  ];

  const currentTopic = topics.find((t) => t.id === activeTopicId) || topics[0];

  const handleTopicChange = (id: string) => {
    setActiveTopicId(id);
    setOpenIndex(0); // Reset to open first item in the newly selected category
  };

  return (
    <section className="w-full py-16 sm:py-24 bg-white text-gray-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Horizontal Tabs Bar */}
        <div className="flex md:hidden overflow-x-auto no-scrollbar gap-2 pb-2 mb-6 border-b border-gray-200">
          {topics.map((topic) => {
            const isActive = topic.id === activeTopicId;
            return (
              <button
                key={topic.id}
                onClick={() => handleTopicChange(topic.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${isActive
                  ? "bg-[#edf4ff] text-[#2563eb] border-b-2 border-[#2563eb]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                {topic.name}
              </button>
            );
          })}
        </div>

        {/* Desktop 2-Column Layout */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          {/* Left Column: Topics Sidebar */}
          <div className="hidden md:flex flex-col w-56 lg:w-64 shrink-0 space-y-1">
            {topics.map((topic) => {
              const isActive = topic.id === activeTopicId;
              return (
                <button
                  key={topic.id}
                  onClick={() => handleTopicChange(topic.id)}
                  className={`text-left px-5 py-3.5 text-base font-semibold transition-all rounded-r-xl border-l-[3px] cursor-pointer ${isActive
                    ? "bg-[#edf4ff] text-[#2563eb] border-[#2563eb]"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50/80"
                    }`}
                >
                  {topic.name}
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Topic Card with Accordion Questions */}
          <div className="flex-1 w-full border border-gray-100 rounded-2xl shadow-sm bg-white overflow-hidden">
            {/* Topic Blue Header */}
            <div className="bg-[#edf4ff] border-b border-blue-100/70 px-6 sm:px-8 py-4">
              <h3 className="text-lg sm:text-xl font-bold text-[#2563eb]">
                {currentTopic.name}
              </h3>
            </div>

            {/* Questions List */}
            <div className="divide-y divide-gray-100">
              {currentTopic.faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={index}
                    className={`transition-colors ${isOpen ? "bg-white" : "hover:bg-gray-50/50"
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="w-full text-left px-6 sm:px-8 py-5 flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span
                        className={`text-base sm:text-lg font-bold transition-colors ${isOpen ? "text-[#1E1B4B]" : "text-gray-700"
                          }`}
                      >
                        {faq.question}
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#2563eb]" : ""
                          }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Animated Accordion Content */}
                    <div
                      className={`grid transition-all duration-200 ease-in-out ${isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                        }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 sm:px-8 pb-6 pt-1">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TopicFAQSection;
