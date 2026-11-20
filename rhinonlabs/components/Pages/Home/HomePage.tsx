import dynamic from "next/dynamic";
import Hero1 from "./Hero1/Hero";

// Dynamic import for below-the-fold sections to optimize initial mobile load & reduce DOM/TBT
const Problem = dynamic(() => import("./Problem/Problem").then((m) => m.Problem));
const Services = dynamic(() => import("./Services/Services").then((m) => m.Services));
const Results = dynamic(() => import("./Results/Results").then((m) => m.Results));
const Process = dynamic(() => import("./Process/Process").then((m) => m.Process));
const Integrations = dynamic(() => import("./Integrations/Integrations").then((m) => m.Integrations));
const Examples = dynamic(() => import("./Examples/Examples").then((m) => m.Examples));
const ElevateCTA = dynamic(() => import("@/components/Common/CTA/ElevateCTA").then((m) => m.ElevateCTA));
const CaseStudies = dynamic(() => import("./CaseStudy/CaseStudies").then((m) => m.CaseStudies));
const FAQ = dynamic(() => import("@/components/Common/FAQ/FAQ").then((m) => m.FAQ));

const HomePage = () => {
  return (
    <div className="relative flex flex-col gap-10 selection:bg-[#1c2bff]/50">
      <Hero1 />
      <Problem />
      <Services />
      <Results />
      <Process />
      <Integrations />
      <Examples />
      <ElevateCTA />
      <CaseStudies />
      <FAQ />
    </div>
  );
};

export default HomePage;
