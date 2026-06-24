import CaseStudyDetail from "@/components/Pages/CaseStudies/CaseStudyDetail";
import { getCaseStudy } from "@/lib/api";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cs = await getCaseStudy(slug);

  if (!cs) return { title: "Case Study Not Found" };

  const ogImage = cs.image || cs.images?.[0];
  return {
    title: `${cs.title} | Rhinon Labs`,
    description: cs.description,
    openGraph: {
      title: cs.title,
      description: cs.description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const cs = await getCaseStudy(slug);

  if (!cs) notFound();

  return <CaseStudyDetail caseStudy={cs} />;
}
