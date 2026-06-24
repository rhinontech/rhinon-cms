import CaseStudiesIndex from "@/components/Pages/CaseStudies/CaseStudiesIndex";
import { getCaseStudies } from "@/lib/api";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Case Studies | Rhinon Labs",
  description:
    "How we've built operational platforms, dashboards, and internal tools that help scaling teams move faster with less manual work.",
};

export default async function Page() {
  const caseStudies = await getCaseStudies();
  return <CaseStudiesIndex caseStudies={caseStudies} />;
}
