import type { Course } from "@/components/Pages/Courses/courseData";
import type { EventDetailModel } from "@/components/Pages/Events/shared/model";
import type { BlogPost } from "@/components/Pages/Blog/blogData";
import HomeHero from "./sections/HomeHero";
import Offerings from "./sections/Offerings";
import FeaturedCourse from "./sections/FeaturedCourse";
import { Hosts, LatestPosts, UpcomingEvents, WorkshopLibrary } from "./sections/LiveSections";
import { HomeCta, HomeFaq, Path } from "./sections/HomeClosing";

export function Homepage({
  course,
  upcoming,
  past,
  posts,
}: {
  course: Course;
  upcoming: EventDetailModel[];
  past: EventDetailModel[];
  posts: BlogPost[];
}) {
  return (
    <main className="w-full bg-white text-[#0B1B3D] font-[family-name:var(--font-plus-jakarta)]">
      <HomeHero course={course} nextEvent={upcoming[0]} />
      <Offerings course={course} upcomingCount={upcoming.length} />
      <FeaturedCourse course={course} />
      <UpcomingEvents upcoming={upcoming} />
      <Path />
      <Hosts events={[...upcoming, ...past]} />
      <WorkshopLibrary past={past} />
      <LatestPosts posts={posts} />
      <HomeFaq course={course} />
      <HomeCta course={course} />
    </main>
  );
}

export default Homepage;
