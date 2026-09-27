import { redirect } from "next/navigation";
import { COURSES } from "@/components/Pages/Courses/courseData";

// There is one course today, so /courses goes straight to it. Replace with a
// listing once a second course is added.
export default function Page() {
  redirect(`/courses/${COURSES[0].slug}`);
}
