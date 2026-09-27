/**
 * Seeds one demo event per EventCategory for the Uppercurve site.
 *
 * All seven categories exist in the enum but nothing exercised them, so the
 * admin list, the category filters and the public /events grid were all being
 * judged on a single "test even" row. Content is AI / EdTech throughout, which
 * is what Uppercurve actually runs.
 *
 * eventDetails carries BOTH shapes on purpose: the public site reads
 * tagline/about/agenda/takeaways (uppercurve/services/eventService.ts), while
 * the admin workshop form reads the sectionN, whatsapp and certificate keys
 * (EditEvent/Components/WorkshopEventForm.tsx). Writing both means a seeded row
 * renders on the site AND opens cleanly in the editor.
 *
 *   DATABASE_URL=... npx ts-node src/config/seedUppercurveEvents.ts
 *   ... --replace     also deletes events NOT in this set (asks for nothing —
 *                     intended for beta, where the only row is scratch data)
 */
import { sequelize } from "./database";
import { Event, Organization, Site } from "../models";
import { runAsSystem, runForOrg } from "../services/tenantContext";
import { Op } from "sequelize";

type Speaker = { name: string; company: string; designation: string; photoUrl?: string };

interface Seed {
  slug: string;
  banner: string;
  title: string;
  subtitle: string;
  category: string;
  type: "Workshop" | "Hackathon" | "Teardown";
  cta: "Join Waitlist" | "Register Now";
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  locationType: "Online" | "Offline" | "Hybrid";
  location: string;
  attendees: number;
  tags: string[];
  /** Who the event is for — rendered as "Built for"; distinct from topic tags. */
  audience: string[];
  speakers: Speaker[];
  tagline: string;
  about: string[];
  agenda: { time: string; item: string }[];
  takeaways: string[];
}

const EVENTS: Seed[] = [
  {
    slug: "ai-classroom-community-meetup",
    banner: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&q=80&auto=format&fit=crop",
    title: "The AI Classroom: Educators' Community Meetup",
    subtitle: "A practitioner circle for teachers building with generative AI",
    category: "Community",
    type: "Workshop",
    cta: "Join Waitlist",
    startDate: "2026-10-11",
    endDate: "2026-10-11",
    startTime: "6:00 PM",
    endTime: "8:00 PM",
    locationType: "Hybrid",
    location: "Bengaluru · UpperCurve Campus + Zoom",
    attendees: 120,
    tags: ["community", "educators", "generative-ai", "edtech"],
    audience: ["K-12 teachers", "Higher-ed faculty", "Instructional designers", "EdTech founders"],
    speakers: [
      { photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format&fit=crop", name: "Ananya Rao", company: "UpperCurve", designation: "Head of Learning Design" },
      { photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&auto=format&fit=crop", name: "Vikram Shetty", company: "Nudge Labs", designation: "Founder" },
    ],
    tagline: "Teachers, instructional designers and edtech builders comparing what actually works.",
    about: [
      "An open floor for educators who have moved past the demo stage and are running AI inside real classrooms and cohorts.",
      "Three short talks, then structured table discussions on assessment integrity, lesson prep and the tools that quietly failed.",
    ],
    agenda: [
      { time: "6:00 PM", item: "Welcome and what changed this quarter in AI for education" },
      { time: "6:20 PM", item: "Three practitioner talks: assessment, lesson prep, student support" },
      { time: "7:10 PM", item: "Table discussions by segment — K-12, higher ed, upskilling" },
      { time: "7:45 PM", item: "Open networking" },
    ],
    takeaways: [
      "A shared prompt library contributed by everyone in the room",
      "Honest accounts of what failed, not just the wins",
      "A standing peer group that meets monthly",
    ],
  },
  {
    slug: "prompt-engineering-for-educators",
    banner: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=80&auto=format&fit=crop",
    title: "Prompt Engineering for Educators",
    subtitle: "Turn a blank chat box into a reliable teaching assistant",
    category: "Normal",
    type: "Workshop",
    cta: "Register Now",
    startDate: "2026-10-18",
    endDate: "2026-10-18",
    startTime: "11:00 AM",
    endTime: "2:00 PM",
    locationType: "Online",
    location: "Online · Zoom",
    attendees: 300,
    tags: ["prompting", "teaching", "workshop", "ai-literacy"],
    audience: ["Teachers new to AI tools", "Tutors and teaching assistants", "Curriculum leads"],
    speakers: [
      { photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&auto=format&fit=crop", name: "Meera Krishnan", company: "UpperCurve", designation: "Lead Instructor" },
    ],
    tagline: "A hands-on session on writing prompts that hold up across a whole class, not one lucky demo.",
    about: [
      "Most prompt advice collapses the moment thirty students use it at once. This workshop is about prompts that survive that.",
      "You will build and stress-test a rubric grader, a Socratic tutor and a lesson planner, and learn to spot where each one breaks.",
    ],
    agenda: [
      { time: "11:00 AM", item: "Why prompts break at scale: context, ambiguity and drift" },
      { time: "11:45 AM", item: "Build along: a rubric-faithful grading assistant" },
      { time: "12:45 PM", item: "Build along: a Socratic tutor that refuses to hand over answers" },
      { time: "1:30 PM", item: "Red-teaming your own prompts, and Q&A" },
    ],
    takeaways: [
      "Three working prompt templates you can use on Monday",
      "A checklist for testing a prompt before it reaches students",
      "Guidance on where AI should not be in the loop at all",
    ],
  },
  {
    slug: "ai-teaching-assistant-micro-certificate",
    banner: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1600&q=80&auto=format&fit=crop",
    title: "Micro-Certificate: Building an AI Teaching Assistant",
    subtitle: "Four evenings, one shipped assistant, one assessed certificate",
    category: "MicroCertificate",
    type: "Workshop",
    cta: "Register Now",
    startDate: "2026-11-03",
    endDate: "2026-11-06",
    startTime: "7:00 PM",
    endTime: "9:00 PM",
    locationType: "Online",
    location: "Online · Zoom",
    attendees: 80,
    tags: ["micro-certificate", "rag", "assessment", "edtech"],
    audience: ["Educators with course material to ground", "Learning engineers", "EdTech product teams"],
    speakers: [
      { photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop", name: "Rohan Desai", company: "UpperCurve", designation: "Curriculum Architect" },
      { photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&auto=format&fit=crop", name: "Priya Nambiar", company: "Lumen Learning Systems", designation: "ML Engineer" },
    ],
    tagline: "A short, assessed programme that ends with an assistant grounded in your own course material.",
    about: [
      "Four guided evenings that take you from course PDFs to a retrieval-grounded assistant your students can actually use.",
      "Assessment is a live review of what you built, so the certificate says you shipped something rather than that you attended.",
    ],
    agenda: [
      { time: "Evening 1", item: "Scoping the assistant: what it must refuse to do" },
      { time: "Evening 2", item: "Grounding it in your material — chunking, retrieval, citations" },
      { time: "Evening 3", item: "Guardrails, hallucination checks and escalation to a human" },
      { time: "Evening 4", item: "Live review, assessment and certification" },
    ],
    takeaways: [
      "A deployed assistant grounded in your own syllabus",
      "An evaluation set you can re-run after every change",
      "An assessed micro-certificate, not an attendance badge",
    ],
  },
  {
    slug: "genai-course-design-micro-certificate",
    banner: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1600&q=80&auto=format&fit=crop",
    title: "GenAI Micro-Certificate: Designing Courses With AI",
    subtitle: "Curriculum design when the content writes itself",
    category: "GenAiMicroCertificate",
    type: "Workshop",
    cta: "Register Now",
    startDate: "2026-11-17",
    endDate: "2026-11-20",
    startTime: "6:30 PM",
    endTime: "8:30 PM",
    locationType: "Online",
    location: "Online · Zoom",
    attendees: 75,
    tags: ["genai", "curriculum", "instructional-design", "micro-certificate"],
    audience: ["Instructional designers", "Course creators", "Academic programme leads"],
    speakers: [
      { photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format&fit=crop", name: "Ananya Rao", company: "UpperCurve", designation: "Head of Learning Design" },
      { photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&auto=format&fit=crop", name: "Daniel Mathew", company: "Grade One Labs", designation: "Director of Programmes" },
    ],
    tagline: "Generation is cheap now. This is about what stays expensive: sequencing, assessment and judgement.",
    about: [
      "When a model can draft a module in seconds, the scarce skill becomes deciding what to teach, in what order, and how to know it landed.",
      "You will rebuild one of your own modules end to end, using AI for drafting and keeping the design decisions firmly human.",
    ],
    agenda: [
      { time: "Evening 1", item: "Outcomes first: what the model cannot decide for you" },
      { time: "Evening 2", item: "Drafting at speed without losing the thread" },
      { time: "Evening 3", item: "Assessment design that AI cannot trivially defeat" },
      { time: "Evening 4", item: "Peer critique and certification" },
    ],
    takeaways: [
      "One of your own modules, rebuilt and reviewed",
      "An assessment bank designed for an AI-saturated classroom",
      "A generation workflow that keeps your voice in the material",
    ],
  },
  {
    slug: "building-with-claude-for-learning-teams",
    banner: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&q=80&auto=format&fit=crop",
    title: "Building With Claude for Learning Teams",
    subtitle: "A two-day intensive on projects, context and tool use for education workflows",
    category: "Claude",
    type: "Workshop",
    cta: "Register Now",
    startDate: "2026-12-02",
    endDate: "2026-12-03",
    startTime: "3:00 PM",
    endTime: "6:00 PM",
    locationType: "Online",
    location: "Online · Zoom",
    attendees: 150,
    tags: ["claude", "tool-use", "learning-teams", "workflows"],
    audience: ["Learning and development teams", "Content operations leads", "Curriculum teams"],
    speakers: [
      { photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop", name: "Rohan Desai", company: "UpperCurve", designation: "Curriculum Architect" },
    ],
    tagline: "A working session on long-context workflows for teams that produce a lot of learning material.",
    about: [
      "Built for learning teams drowning in source material: curriculum docs, transcripts, question banks and feedback.",
      "We work through long-context patterns, reusable project setups and connecting a model to the systems your content already lives in.",
    ],
    agenda: [
      { time: "Day 1 · 3:00 PM", item: "Long context in practice: what to put in, what to leave out" },
      { time: "Day 1 · 4:30 PM", item: "Reusable project setups for a content team" },
      { time: "Day 2 · 3:00 PM", item: "Tool use: reaching your LMS, drive and question bank" },
      { time: "Day 2 · 4:30 PM", item: "Cost, latency and where to keep a human" },
    ],
    takeaways: [
      "A project template your whole team can share",
      "Patterns for feeding in large material without losing accuracy",
      "A realistic view of running costs at team scale",
    ],
  },
  {
    slug: "claude-one-day-edtech-build",
    banner: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1600&q=80&auto=format&fit=crop",
    title: "Claude One-Day: Ship an EdTech Prototype",
    subtitle: "Arrive with an idea, leave with something people can click",
    category: "ClaudeOneDay",
    type: "Hackathon",
    cta: "Register Now",
    startDate: "2026-12-13",
    endDate: "2026-12-13",
    startTime: "9:30 AM",
    endTime: "7:00 PM",
    locationType: "Offline",
    location: "Bengaluru · UpperCurve Campus",
    attendees: 60,
    tags: ["hackathon", "claude", "prototype", "edtech"],
    audience: ["Educators with a product idea", "Developers curious about EdTech", "Student founders"],
    speakers: [
      { photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&auto=format&fit=crop", name: "Priya Nambiar", company: "Lumen Learning Systems", designation: "ML Engineer" },
      { photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&auto=format&fit=crop", name: "Vikram Shetty", company: "Nudge Labs", designation: "Founder" },
    ],
    tagline: "One room, one day, one working prototype judged by people who run real learning products.",
    about: [
      "A single-day build for educators and developers who want to stop describing an idea and start demoing it.",
      "Teams of up to three, mentors circulating all day, and a demo round where the only thing that counts is what runs.",
    ],
    agenda: [
      { time: "9:30 AM", item: "Problem framing and team formation" },
      { time: "10:30 AM", item: "Build block one, with mentors on the floor" },
      { time: "2:00 PM", item: "Build block two and a midpoint reality check" },
      { time: "5:30 PM", item: "Demos and judging" },
    ],
    takeaways: [
      "A prototype that runs, not a slide about one",
      "Direct mentor feedback while you are still building",
      "A shortlist route into the UpperCurve incubation track",
    ],
  },
  {
    slug: "internal-cohort-ai-facilitator-training",
    banner: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1600&q=80&auto=format&fit=crop",
    title: "Internal Cohort: AI Facilitator Training",
    subtitle: "For UpperCurve instructors and teaching assistants only",
    category: "InternalCohort",
    type: "Teardown",
    cta: "Join Waitlist",
    startDate: "2027-01-12",
    endDate: "2027-01-14",
    startTime: "10:00 AM",
    endTime: "4:00 PM",
    locationType: "Offline",
    location: "Bengaluru · UpperCurve Campus",
    attendees: 25,
    tags: ["internal", "facilitation", "teardown", "staff"],
    audience: ["UpperCurve instructors", "Teaching assistants", "Programme leads"],
    speakers: [
      { photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&auto=format&fit=crop", name: "Meera Krishnan", company: "UpperCurve", designation: "Lead Instructor" },
      { photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format&fit=crop", name: "Ananya Rao", company: "UpperCurve", designation: "Head of Learning Design" },
    ],
    tagline: "A closed three-day teardown of our own sessions, so the teaching improves before the next cohort.",
    about: [
      "Internal only. We watch recordings of our own sessions and pull them apart — pacing, questioning, the moments learners disengaged.",
      "Day three rebuilds the weakest session in the catalogue with the whole faculty in the room.",
    ],
    agenda: [
      { time: "Day 1", item: "Teardown: recordings, transcripts and where attention dropped" },
      { time: "Day 2", item: "Facilitation craft — questioning, silence, handling the confident wrong answer" },
      { time: "Day 3", item: "Rebuild the weakest session together and re-run it" },
    ],
    takeaways: [
      "A shared facilitation rubric every instructor is assessed against",
      "One rebuilt session, ready for the next cohort",
      "A feedback loop that runs every quarter",
    ],
  },
];

function detailsFor(seed: Seed) {
  const [firstAbout, ...restAbout] = seed.about;
  return {
    // Read by uppercurve's own EventDetails card and the seeded list view.
    tagline: seed.tagline,
    about: seed.about,
    agenda: seed.agenda,
    takeaways: seed.takeaways,

    // Read by the ported Workshop layout (WorkShopDescription).
    section2_iconPoints: {
      sectionName: "What this session covers",
      points: seed.agenda.map((slot) => ({
        title: `${slot.time} — ${slot.item}`,
        subtitles: [] as unknown[],
      })),
    },
    section3_coloredTags: { sectionName: "Topics", names: seed.tags },
    section4_Header: { sectionName: "What you will walk away with", names: seed.takeaways },

    // Read by the ported Teardown/Hackathon layout (HackathonDescription).
    DetailHeader: { Header: seed.title, Subtitle: seed.tagline },
    section1_carousel: {
      sectionName: "About this event",
      description: firstAbout,
      note: restAbout.join(" "),
      points: seed.takeaways.map((text) => ({ title: text, subPoints: [] as unknown[] })),
    },
    eventFlow: {
      sectionName: "How the day runs",
      items: seed.agenda.map((slot) => ({
        title: slot.time,
        subPoints: [{ text: slot.item }],
      })),
    },
    exclusiveBenefits: {
      sectionName: "What is included",
      items: seed.takeaways.map((text) => ({ title: text.split(" ").slice(0, 3).join(" "), description: text })),
    },
    whoShouldAttend: {
      sectionName: "Who should attend",
      names: seed.audience,
    },

    whatsappLink: { Link: "", studentLink: "", professionalLink: "" },
    certificateSection: {
      header: seed.category.includes("Certificate") ? "Certificate of completion" : "",
      subheading: "",
      certificateUrl: "",
    },
  };
}

async function seed() {
  const replace = process.argv.includes("--replace");
  await sequelize.authenticate();

  const { org, site } = await runAsSystem("seed-events:resolve-site", async () => {
    const organization = await Organization.findOne({ where: { isPlatform: true } });
    if (!organization) throw new Error("No platform organization found.");
    const uppercurve = await Site.findOne({
      where: { organizationId: organization.id, slug: "uppercurve" } as never,
    });
    if (!uppercurve) throw new Error("The platform org has no 'uppercurve' site.");
    return { org: organization, site: uppercurve };
  });

  await runForOrg(org.id, async () => {
    const slugs = EVENTS.map((e) => e.slug);

    if (replace) {
      const stale = await Event.findAll({ where: { eventSlug: { [Op.notIn]: slugs } } });
      for (const row of stale) {
        console.log(`  deleted  ${row.get("eventSlug")}  (${row.get("eventTitle")})`);
        await row.destroy();
      }
    }

    for (const seedEvent of EVENTS) {
      const payload = {
        eventTitle: seedEvent.title,
        eventSubtitle: seedEvent.subtitle,
        eventSlug: seedEvent.slug,
        eventStartDate: seedEvent.startDate,
        eventEndDate: seedEvent.endDate,
        eventStartTime: seedEvent.startTime,
        eventEndTime: seedEvent.endTime,
        speakers: seedEvent.speakers,
        eventCreativeUrl: seedEvent.banner,
        numberOfAttendees: seedEvent.attendees,
        isPublished: true,
        eventType: seedEvent.type,
        eventCategory: seedEvent.category,
        ctaType: seedEvent.cta,
        location: seedEvent.location,
        locationType: seedEvent.locationType,
        tags: seedEvent.tags,
        eventDetails: detailsFor(seedEvent),
        canAcceptResponse: true,
        // Legacy blog-shaped columns the list view still reads.
        title: seedEvent.title,
        slug: seedEvent.slug,
        status: "Published",
        excerpt: seedEvent.tagline,
        content: seedEvent.about.join("\n\n"),
        siteId: site.id,
        organizationId: org.id,
      };

      const existing = await Event.findOne({ where: { eventSlug: seedEvent.slug } });
      if (existing) {
        await existing.update(payload as never);
        console.log(`  updated  ${seedEvent.slug}  [${seedEvent.category}]`);
      } else {
        await Event.create(payload as never);
        console.log(`  created  ${seedEvent.slug}  [${seedEvent.category}]`);
      }
    }

    const total = await Event.count();
    console.log(`\n  ${EVENTS.length} seeded · ${total} event(s) now on the ${site.get("slug")} site.`);
  });

  await sequelize.close();
}

seed().catch((err) => {
  console.error("Event seed failed:", err.message);
  process.exit(1);
});
