import Overlays from "@/components/site/Overlays";
import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import Ticker from "@/components/site/Ticker";
import BeforeAfter from "@/components/site/BeforeAfter";
import Calculator from "@/components/site/Calculator";
import Systems from "@/components/site/Systems";
import Process from "@/components/site/Process";
import Results from "@/components/site/Results";
import Faq from "@/components/site/Faq";
import Footer from "@/components/site/Footer";
import SiteEffects from "@/components/site/SiteEffects";
import Problem from "@/components/web/sections/Problem";
import Services from "@/components/web/sections/Services";
import Advantages from "@/components/web/sections/Advantages";
import CaseStudy from "@/components/web/sections/CaseStudy";
import MoreCases from "@/components/web/sections/MoreCases";
import FirstStep from "@/components/web/sections/FirstStep";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="fixed -top-16 left-3 z-300 rounded-[10px] bg-ink px-3.5 py-2.5 font-mono text-xs font-medium text-paper-2 uppercase transition-[top] duration-300 focus:top-3"
      >
        Skip to content
      </a>
      <Overlays />
      <Header />

      <main id="main">
        <Hero />
        <Ticker />
        <Problem />
        <BeforeAfter />
        <Calculator />
        <Services />
        <Systems />
        <Process />
        <Advantages />
        <CaseStudy />
        <MoreCases />
        <Results />
        <FirstStep />
        <Faq />
      </main>

      <Footer />
      <SiteEffects />
    </>
  );
}
