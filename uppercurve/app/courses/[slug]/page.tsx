import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseLanding from "@/components/Pages/Courses/CourseLanding/CourseLanding";
import { COURSES, getCourse } from "@/components/Pages/Courses/courseData";

export const dynamicParams = false;

export function generateStaticParams() {
  return COURSES.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const course = getCourse((await params).slug);
  if (!course) return { title: "Course not found — UpperCurve" };
  return {
    title: course.metaTitle,
    description: course.metaDescription,
    openGraph: { title: course.metaTitle, description: course.metaDescription },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const course = getCourse((await params).slug);
  if (!course) notFound();
  return <CourseLanding course={course} />;
}
