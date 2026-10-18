import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Company from "@/components/sections/Company";
import Advantages from "@/components/sections/Advantages";
import Path from "@/components/sections/Path";
import CaseStudy from "@/components/sections/CaseStudy";
import MoreCases from "@/components/sections/MoreCases";
import FirstStep from "@/components/sections/FirstStep";
import Team from "@/components/sections/Team";
import WhyUs from "@/components/sections/WhyUs";
import Pricing from "@/components/sections/Pricing";
import Belief from "@/components/sections/Belief";
import News from "@/components/sections/News";
import Newsletter from "@/components/sections/Newsletter";
import Faq from "@/components/sections/Faq";
import Contact from "@/components/sections/Contact";

// Section order mirrors the original page.
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Company />
        <Advantages />
        <Path />
        <CaseStudy />
        <MoreCases />
        <FirstStep />
        <Team />
        <WhyUs />
        <Pricing />
        <Belief />
        <News />
        <Newsletter />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
