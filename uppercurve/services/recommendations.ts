import type { BlogPost } from "@/components/Pages/Blog/blogData";
import type { EventDetailModel } from "@/components/Pages/Events/shared/model";
import type { Course } from "@/components/Pages/Courses/courseData";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "up", "about", "into", "over", "after", "is", "are", "was",
  "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "but", "if", "then", "else", "when", "where", "why", "how", "all", "any",
  "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very", "can", "will",
  "just", "should", "now", "our", "your", "their", "its", "this", "that", "these", "those"
]);

function extractKeywords(text: string): Set<string> {
  const words = (text || "")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

function calculateScore(sourceKeywords: Set<string>, targetText: string): number {
  if (!sourceKeywords.size || !targetText) return 0;
  const targetWords = extractKeywords(targetText);
  let score = 0;
  for (const word of targetWords) {
    if (sourceKeywords.has(word)) {
      score += 1;
    }
  }
  return score;
}

/**
 * Returns dynamic blog posts most relevant to a given course.
 */
export function getRelatedBlogsForCourse(
  blogs: BlogPost[],
  course: Course,
  limit = 3
): BlogPost[] {
  if (!blogs || !blogs.length) return [];

  const courseText = [
    course.title,
    course.titleAccent,
    course.tagline,
    course.heroCard?.body,
    ...(course.tools || []),
    course.modules?.map((m) => `${m.title} ${m.topics?.join(" ") || ""}`).join(" ") || "",
  ].join(" ");

  const courseKeywords = extractKeywords(courseText);

  const scored = blogs.map((blog) => {
    const blogText = [
      blog.title,
      blog.excerpt,
      blog.category,
      ...(blog.tags || []),
    ].join(" ");

    return {
      blog,
      score: calculateScore(courseKeywords, blogText),
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.blog.dateISO || "").localeCompare(a.blog.dateISO || "");
  });

  return scored.slice(0, limit).map((item) => item.blog);
}

/**
 * Returns dynamic blog posts most relevant to a given event.
 */
export function getRelatedBlogsForEvent(
  blogs: BlogPost[],
  event: EventDetailModel,
  limit = 3
): BlogPost[] {
  if (!blogs || !blogs.length) return [];

  const eventText = [
    event.title,
    event.subtitle,
    event.category,
  ].join(" ");

  const eventKeywords = extractKeywords(eventText);

  const scored = blogs.map((blog) => {
    const blogText = [
      blog.title,
      blog.excerpt,
      blog.category,
      ...(blog.tags || []),
    ].join(" ");

    return {
      blog,
      score: calculateScore(eventKeywords, blogText),
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.blog.dateISO || "").localeCompare(a.blog.dateISO || "");
  });

  return scored.slice(0, limit).map((item) => item.blog);
}

/**
 * Returns dynamic events most relevant to a given blog post.
 * Prioritizes active/upcoming events where registration is open.
 */
export function getRelatedEventsForBlog(
  events: EventDetailModel[],
  blog: BlogPost,
  limit = 2
): EventDetailModel[] {
  if (!events || !events.length) return [];

  const blogText = [
    blog.title,
    blog.excerpt,
    blog.category,
    ...(blog.tags || []),
  ].join(" ");

  const blogKeywords = extractKeywords(blogText);

  // Split into upcoming vs past
  const upcoming = events.filter((e) => !e.isPast);
  const candidates = upcoming.length > 0 ? upcoming : events;

  const scored = candidates.map((event) => {
    const eventText = [
      event.title,
      event.subtitle,
      event.category,
    ].join(" ");

    return {
      event,
      score: calculateScore(blogKeywords, eventText),
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // If scores tie, sort by earliest upcoming date
    return (a.event.startsAt ?? "9999").localeCompare(b.event.startsAt ?? "9999");
  });

  return scored.slice(0, limit).map((item) => item.event);
}

/**
 * Returns the dynamic course most relevant to a given blog post.
 */
export function getRelatedCourseForBlog(
  courses: Course[],
  blog: BlogPost
): Course | undefined {
  if (!courses || !courses.length) return undefined;
  if (courses.length === 1) return courses[0];

  const blogText = [
    blog.title,
    blog.excerpt,
    blog.category,
    ...(blog.tags || []),
  ].join(" ");

  const blogKeywords = extractKeywords(blogText);

  let bestCourse = courses[0];
  let maxScore = -1;

  for (const course of courses) {
    const courseText = [
      course.title,
      course.titleAccent,
      course.tagline,
      course.heroCard?.body,
    ].join(" ");

    const score = calculateScore(blogKeywords, courseText);
    if (score > maxScore) {
      maxScore = score;
      bestCourse = course;
    }
  }

  return bestCourse;
}
