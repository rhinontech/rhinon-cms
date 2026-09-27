import type { Course } from "../courseData";
import Hero from "./sections/Hero";
import Curriculum from "./sections/Curriculum";
import Builds from "./sections/Builds";
import Cohort from "./sections/Cohort";
import Roles from "./sections/Roles";
import Certificate from "./sections/Certificate";
import Testimonials from "./sections/Testimonials";
import Pricing from "./sections/Pricing";
import { CourseCta, CourseFaq } from "./sections/Closing";

/**
 * One course's landing page. Nothing between <main> and the curriculum may
 * clip overflow, or the stacking module cards lose their sticky positioning.
 */
export default function CourseLanding({ course }: { course: Course }) {
  return (
    <main className="w-full bg-white text-[#0B1B3D] font-[family-name:var(--font-plus-jakarta)]">
      <Hero course={course} />
      <Curriculum course={course} />
      <Builds course={course} />
      <Cohort course={course} />
      <Roles course={course} />
      <Certificate course={course} />
      <Testimonials course={course} />
      <Pricing course={course} />
      <CourseFaq course={course} />
      <CourseCta course={course} />
    </main>
  );
}
