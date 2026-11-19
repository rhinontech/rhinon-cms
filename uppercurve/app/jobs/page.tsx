import type { Metadata } from "next";
import JobsPage from "@/components/Pages/Jobs/JobsPage";

export const metadata: Metadata = {
  title: "Product Jobs in India | UpperCurve",
  description:
    "Find curated Product and AI Roles at leading tech companies. Filter by level and location and take the next step in your tech career.",
  alternates: {
    canonical: "/jobs",
  },
  robots: {
    index: false,
    follow: true,
  },
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
