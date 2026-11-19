import { EventDetailModel } from "@/components/Pages/Events/shared/model";
import { ApiEvent } from "@/services/eventService";
import { Course } from "@/components/Pages/Courses/courseData";
import { BlogPost } from "@/components/Pages/Blog/blogData";

export const SITE_URL = "https://www.uppercurve.in";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PARENT_ORG_ID = "https://www.rhinontech.com/#organization";

/**
 * Sitewide Organization and WebSite schema graph.
 */
export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "UpperCurve",
        url: SITE_URL,
        logo: `${SITE_URL}/uppercurve_logo_nav.png`,
        description:
          "UpperCurve is a career growth platform where ambitious people learn practical skills, build real experience, connect with the right people, and move their careers forward.",
        sameAs: [
          "https://www.linkedin.com/company/uppercurve",
          "https://x.com/uppercurve",
        ],
        parentOrganization: {
          "@type": "Organization",
          "@id": PARENT_ORG_ID,
          name: "Rhinon Tech",
          url: "https://www.rhinontech.com",
        },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: "UpperCurve",
        publisher: {
          "@id": ORGANIZATION_ID,
        },
      },
    ],
  };
}

/**
 * Event detail schema graph (Event + BreadcrumbList + FAQPage).
 */
export function buildEventSchema(
  event: EventDetailModel,
  api: ApiEvent
): Record<string, unknown> {
  const eventUrl = `${SITE_URL}/events/${event.slug}`;
  const isOnline =
    event.mode === "Online" ||
    !event.location ||
    event.location.toLowerCase().includes("online");

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Event",
      "@id": `${eventUrl}#event`,
      name: event.title,
      description:
        event.subtitle ||
        (event.about && event.about.length > 0
          ? event.about.join(" ")
          : event.title),
      startDate: event.startsAt || api.eventStartDate,
      endDate: api.eventEndDate || event.startsAt || api.eventStartDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: isOnline
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
      location: isOnline
        ? {
            "@type": "VirtualLocation",
            url: eventUrl,
          }
        : {
            "@type": "Place",
            name: event.location,
            address: event.location,
          },
      image: event.bannerUrl ? [event.bannerUrl] : undefined,
      organizer: {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "UpperCurve",
        url: SITE_URL,
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: eventUrl,
        validFrom: api.createdAt || "2026-01-01",
      },
      performer: event.speakers.map((s) => ({
        "@type": "Person",
        name: s.name,
        jobTitle: s.designation,
        worksFor: s.company
          ? {
              "@type": "Organization",
              name: s.company,
            }
          : undefined,
      })),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${eventUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Events",
          item: `${SITE_URL}/events`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: event.title,
          item: eventUrl,
        },
      ],
    },
  ];

  if (event.faqs && event.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${eventUrl}#faq`,
      mainEntity: event.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/**
 * Course detail schema graph (Course + hasCourseInstance + BreadcrumbList + FAQPage).
 */
export function buildCourseSchema(course: Course): Record<string, unknown> {
  const courseUrl = `${SITE_URL}/courses/${course.slug}`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Course",
      "@id": `${courseUrl}#course`,
      name: `${course.title} ${course.titleAccent}`.trim(),
      description: course.metaDescription || course.tagline,
      provider: {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "UpperCurve",
        url: SITE_URL,
      },
      hasCourseInstance: [
        {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: "PT6W",
          instructor: course.instructor
            ? [
                {
                  "@type": "Person",
                  name: course.instructor.name,
                  description: course.instructor.bio,
                  image: course.instructor.photoUrl,
                },
              ]
            : undefined,
        },
      ],
      offers: [
        {
          "@type": "Offer",
          category: "Paid",
          priceCurrency: "INR",
          price: "49999",
          url: courseUrl,
          availability: "https://schema.org/InStock",
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${courseUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Courses",
          item: courseUrl,
        },
      ],
    },
  ];

  if (course.faqs && course.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${courseUrl}#faq`,
      mainEntity: course.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/**
 * Blog detail schema graph (BlogPosting + BreadcrumbList + FAQPage).
 */
export function buildBlogSchema(post: BlogPost): Record<string, unknown> {
  const blogUrl = `${SITE_URL}/blog/${post.slug}`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "BlogPosting",
      "@id": `${blogUrl}#article`,
      isPartOf: {
        "@type": "Blog",
        "@id": `${SITE_URL}/blog#blog`,
        name: "UpperCurve Blog",
        publisher: {
          "@id": ORGANIZATION_ID,
        },
      },
      headline: post.title,
      description: post.excerpt,
      image: post.coverImage ? [post.coverImage] : undefined,
      datePublished: post.dateISO,
      dateModified: post.dateISO,
      author: {
        "@type": "Person",
        name: post.authorName || "UpperCurve Academy",
        jobTitle: post.authorRole || "Mentor",
      },
      publisher: {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "UpperCurve",
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/uppercurve_logo_nav.png`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": blogUrl,
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${blogUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: `${SITE_URL}/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: blogUrl,
        },
      ],
    },
  ];

  if (post.faqs && post.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${blogUrl}#faq`,
      mainEntity: post.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/**
 * Blog collection schema graph (CollectionPage + ItemList).
 */
export function buildBlogCollectionSchema(
  posts: BlogPost[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/blog#collection`,
        url: `${SITE_URL}/blog`,
        name: "UpperCurve Blog Articles",
        description: "Practical AI Guides & Insights for Aspiring Engineers",
        publisher: {
          "@id": ORGANIZATION_ID,
        },
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/blog#itemlist`,
        itemListElement: posts.slice(0, 20).map((post, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: `${SITE_URL}/blog/${post.slug}`,
          name: post.title,
        })),
      },
    ],
  };
}

/**
 * Events collection schema graph (CollectionPage + ItemList).
 */
export function buildEventCollectionSchema(
  events: EventDetailModel[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/events#collection`,
        url: `${SITE_URL}/events`,
        name: "UpperCurve AI Events & Workshops",
        description: "AI Events, Workshops & Certificates",
        publisher: {
          "@id": ORGANIZATION_ID,
        },
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/events#itemlist`,
        itemListElement: events.slice(0, 20).map((event, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: `${SITE_URL}/events/${event.slug}`,
          name: event.title,
        })),
      },
    ],
  };
}

