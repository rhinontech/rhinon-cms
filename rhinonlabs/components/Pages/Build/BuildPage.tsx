"use client";

import React from "react";
import { BuildHero } from "./Hero";
import { WhoIsThisFor } from "./WhoIsThisFor";
import { WhatWeBuild } from "./WhatWeBuild";
import { BuildProcess } from "./BuildProcess";
import { Differentiator } from "./Differentiator";
import { ProductTypes } from "./ProductTypes";
import { StartupStage } from "./StartupStage";
import { Engagement } from "./Engagement";
import { MvpExamples } from "./MvpExamples";
import { FounderMessage } from "./FounderMessage";
import { BuildFAQ } from "./BuildFAQ";
import { IdeaForm } from "./IdeaForm";
import { CaseStudies } from "@/components/Pages/Home/CaseStudy/CaseStudies";

const BuildPage = () => {
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
      <CaseStudies />
      <BuildFAQ />
      <IdeaForm />
    </div>
  );
};

export default BuildPage;
