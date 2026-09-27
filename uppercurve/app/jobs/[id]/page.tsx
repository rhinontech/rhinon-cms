import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobDetailsPage from "@/components/Pages/Jobs/JobDetails/JobDetailsPage";
import { getJobById, DUMMY_JOBS } from "@/components/Pages/Jobs/jobData";

export function generateStaticParams() {
  return DUMMY_JOBS.map((j) => ({ id: j.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = getJobById(id);

  if (!job) {
    return { title: "Job not found — UpperCurve" };
  }

  return {
    title: `${job.title} at ${job.company} — UpperCurve Careers`,
    description: `Apply for ${job.title} role at ${job.company} in ${job.location}. ${job.description.slice(0, 150)}...`,
    openGraph: {
      title: `${job.title} at ${job.company} — UpperCurve Careers`,
      description: `Apply for ${job.title} role at ${job.company} in ${job.location}.`,
      type: "website",
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = getJobById(id);

  if (!job) {
    notFound();
  }

  return <JobDetailsPage job={job} />;
}
