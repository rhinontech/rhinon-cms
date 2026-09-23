import React from "react";
import Hero from "./Hero/Hero";
import LearningExperienceSection from "./LearningExperienceSection/LearningExperienceSection";
import ActionCtaSection from "./ActionCtaSection/ActionCtaSection";
import RealCraftSection from "./RealCraftSection/RealCraftSection";
import StackedCardsSection from "./StackedCardsSection/StackedCardsSection";
import CurriculumSection from "./CurriculumSection/CurriculumSection";
import ProjectsCarouselSection from "./ProjectsCarouselSection/ProjectsCarouselSection";
import FourStepsSection from "./FourStepsSection/FourStepsSection";
import StudentShowcaseSection from "./StudentShowcaseSection/StudentShowcaseSection";
import InstructorSection from "./InstructorSection/InstructorSection";
import StarterKitSection from "./StarterKitSection/StarterKitSection";
import CommunitySection from "./CommunitySection/CommunitySection";
import FAQSection from "./FAQSection/FAQSection";
import TopicFAQSection from "./TopicFAQSection/TopicFAQSection";

export function Homepage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center">
      <div id="overview" className="w-full">
        <Hero />
      </div>
      <div className="w-full">
        <LearningExperienceSection />
      </div>
      <div className="w-full">
        <ActionCtaSection />
      </div>
      {/* <div className="w-full max-w-7xl mx-auto max-sm:px-5">
        <RealCraftSection />
      </div>
      <div className="w-full max-w-7xl mx-auto">
        <StackedCardsSection />
      </div>
      <div id="programs" className="w-full max-w-7xl  mx-auto max-sm:px-5">
        <CurriculumSection />
      </div>
      <div className="w-full max-w-7xl mx-auto">
        <ProjectsCarouselSection />
      </div>
      <div className="w-full max-w-7xl mx-auto">
        <FourStepsSection />
      </div>
      <div className="w-full max-w-7xl mx-auto">
        <StudentShowcaseSection />
      </div>
      <div id="mentorship" className="w-full max-w-7xl mx-auto max-sm:px-5">
        <InstructorSection />
      </div>
      <div className="w-full max-w-7xl mx-auto max-sm:px-5">
        <StarterKitSection />
      </div>
      <div id="community" className="w-full overflow-hidden">
        <CommunitySection />
      </div> */}
      <div id="faqs" className="w-full border-t border-gray-300  mx-auto">
        <TopicFAQSection />
      </div>
    </main>
  );
}


export default Homepage;













