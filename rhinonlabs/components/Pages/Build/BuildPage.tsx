"use client";

import React from "react";
import dynamic from "next/dynamic";
import { BuildHero } from "./Hero";

// Dynamic import for below-the-fold sections to cut initial JS bundle & DOM size
const WhoIsThisFor = dynamic(() => import("./WhoIsThisFor").then((m) => m.WhoIsThisFor));
const WhatWeBuild = dynamic(() => import("./WhatWeBuild").then((m) => m.WhatWeBuild));
const BuildProcess = dynamic(() => import("./BuildProcess").then((m) => m.BuildProcess));
const Differentiator = dynamic(() => import("./Differentiator").then((m) => m.Differentiator));
const ProductTypes = dynamic(() => import("./ProductTypes").then((m) => m.ProductTypes));
const StartupStage = dynamic(() => import("./StartupStage").then((m) => m.StartupStage));
const Engagement = dynamic(() => import("./Engagement").then((m) => m.Engagement));
const MvpExamples = dynamic(() => import("./MvpExamples").then((m) => m.MvpExamples));
const FounderMessage = dynamic(() => import("./FounderMessage").then((m) => m.FounderMessage));
const BuildFAQ = dynamic(() => import("./BuildFAQ").then((m) => m.BuildFAQ));
const IdeaForm = dynamic(() => import("./IdeaForm").then((m) => m.IdeaForm));
const CaseStudies = dynamic(() => import("@/components/Pages/Home/CaseStudy/CaseStudies").then((m) => m.CaseStudies));
import type { CaseStudy } from "@/lib/api";

interface BuildPageProps {
  caseStudies?: CaseStudy[];
}

const BuildPage = ({ caseStudies }: BuildPageProps) => {
  return (
    <div className="relative flex flex-col selection:bg-violet-500/40">
      {/* Ambient colour drifting down the page so the long scroll never reads as flat black.
          Fixed and non-interactive; each blob is far enough apart to stay subtle. */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10%] top-[18%] h-[520px] w-[520px] rounded-full bg-blue-600/12 blur-[130px]" />
        <div className="absolute right-[-12%] top-[34%] h-[560px] w-[560px] rounded-full bg-violet-600/12 blur-[140px]" />
        <div className="absolute left-[5%] top-[54%] h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute right-[-8%] top-[72%] h-[500px] w-[500px] rounded-full bg-fuchsia-600/10 blur-[140px]" />
        <div className="absolute left-[-8%] bottom-[4%] h-[520px] w-[520px] rounded-full bg-indigo-600/12 blur-[140px]" />
      </div>

      <BuildHero />
      <WhoIsThisFor />
      <WhatWeBuild />
      <BuildProcess />
      <Differentiator />
      <ProductTypes />
      <StartupStage />
      <MvpExamples />
      <Engagement />
      <FounderMessage />
      {/* Published case studies from the CMS — the section hides itself when there are none. */}
      <CaseStudies items={caseStudies} />
      <BuildFAQ />
      <IdeaForm />
    </div>
  );
};

export default BuildPage;
