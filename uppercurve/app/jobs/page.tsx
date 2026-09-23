import type { Metadata } from "next";
import JobsPage from "@/components/Pages/Jobs/JobsPage";

export const metadata: Metadata = {
  title: "Jobs & Careers — UpperCurve",
  description:
    "Explore curated job opportunities, internships, and fellowships in AI, tech, and engineering with UpperCurve.",
  openGraph: {
    title: "Jobs & Careers — UpperCurve",
    description:
      "Explore curated job opportunities, internships, and fellowships in AI, tech, and engineering with UpperCurve.",
    type: "website",
  },
};

export default function Page() {
  return <JobsPage />;
}
