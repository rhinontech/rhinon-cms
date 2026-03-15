'use client'
import { motion } from "framer-motion";
import { Hero } from "./Hero/Hero";
import { Problem } from "./Problem/Problem";
import { Services } from "./Services/Services";
import { Results } from "./Results/Results";
import { Process } from "./Process/Process";
import { Integrations } from "./Integrations/Integrations";
import { Examples } from "./Examples/Examples";
import { ElevateCTA } from "@/components/Common/CTA/ElevateCTA";
import { CaseStudies } from "./CaseStudy/CaseStudies";
import { FAQ } from "@/components/Common/FAQ/FAQ";


const HomePage = () => {
  return (
    <div className="relative flex flex-col gap-10 selection:bg-[#1c2bff]/50">
      <Hero />
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
