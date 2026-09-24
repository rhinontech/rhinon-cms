/**
 * Seeds four demo blogs for the Uppercurve site — EdTech and agentic AI.
 *
 * Bodies use the block contract (paragraph html + image blocks) that
 * uppercurve's BlogDetails renders and the admin editor flattens on open, so a
 * seeded row reads well on the site AND edits cleanly in the CMS. `content` is
 * left empty, which is what the admin editor itself saves when blocks exist.
 * Images are public Unsplash URLs (already allowed in uppercurve/next.config.ts).
 *
 *   DATABASE_URL=... npx ts-node src/config/seedUppercurveBlogs.ts
 *   ... --replace     also deletes Uppercurve blogs NOT in this set. Rhinon Labs
 *                     blogs are never touched.
 */
import { sequelize } from "./database";
import { Blog, Organization, Site } from "../models";
import type { BlogBlock, BlogFaq } from "../models/Blog";
import { runAsSystem, runForOrg } from "../services/tenantContext";
import { Op } from "sequelize";

const unsplash = (id: string, width = 1600) =>
  `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`;

const AUTHORS = {
  ananya: {
    authorName: "Ananya Rao",
    authorRole: "Head of Learning Design, UpperCurve",
    authorAvatar: unsplash("1573496359142-b8d87734a5a2", 400),
  },
  rohan: {
    authorName: "Rohan Desai",
    authorRole: "Curriculum Architect, UpperCurve",
    authorAvatar: unsplash("1507003211169-0a1dd7228f2d", 400),
  },
  meera: {
    authorName: "Meera Krishnan",
    authorRole: "Lead Instructor, UpperCurve",
    authorAvatar: unsplash("1580489944761-15a19d654956", 400),
  },
};

type Section = { html: string } | { image: string; alt: string };

interface Seed {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  cover: string;
  author: keyof typeof AUTHORS;
  publishedAt: string;
  metaTitle: string;
  metaDescription: string;
  body: Section[];
  faqs: BlogFaq[];
}

const BLOGS: Seed[] = [
  {
    slug: "agentic-ai-in-education-explained",
    title: "Agentic AI in Education, Explained Without the Hype",
    excerpt:
      "A chatbot answers the question in front of it. An agent works toward a goal: it plans, uses tools, checks its own work and comes back later. Here is what that difference means in a real course.",
    category: "Artificial Intelligence",
    tags: ["agentic-ai", "edtech", "ai-literacy", "explainer"],
    cover: "1677442136019-21780ecad995",
    author: "rohan",
    publishedAt: "2026-09-22T09:00:00+05:30",
    metaTitle: "Agentic AI in Education, Explained | UpperCurve",
    metaDescription:
      "What makes an AI agent different from a chatbot, where agents genuinely help learners and course teams, and where a human must stay in the loop.",
    body: [
      {
        html: `
<p>Most of what schools and learning teams adopted in the last two years was a chat box. You ask, it answers, the conversation ends. That is useful, but it is not what people mean when they say <strong>agentic AI</strong>.</p>
<p>An agent is given a goal rather than a question. To reach it, the agent breaks the goal into steps, calls tools to get things done, looks at what happened, and decides what to do next. It keeps going until the goal is met, it gets stuck, or a person tells it to stop.</p>
<h2>Chatbot vs. agent: the practical difference</h2>
<p>Take a learner who is three weeks behind in a data-analysis course.</p>
<ul>
<li><strong>A chatbot</strong> waits for the learner to ask something. If they never ask, nothing happens.</li>
<li><strong>An agent</strong> notices the missed submissions in the LMS, reads which topics they covered, drafts a catch-up plan that fits the time left before the deadline, messages the learner, and flags the case to a mentor if there is no reply in two days.</li>
</ul>
<p>Same underlying model. The difference is the loop around it: a goal, access to tools, memory of what it has already done, and permission to act.</p>
<h2>The four parts of an agent</h2>
<ul>
<li><strong>Goal</strong> — a clear outcome, such as "every learner who is behind has a realistic catch-up plan".</li>
<li><strong>Tools</strong> — the actions it is allowed to take: read the gradebook, look up course material, send a message, book a calendar slot.</li>
<li><strong>Memory</strong> — what it has already tried with this learner, so it does not repeat itself.</li>
<li><strong>Checks</strong> — rules it must verify before acting, and the points where a human has to approve.</li>
</ul>
<p>If any of those four is vague, the agent will be too.</p>`,
      },
      { image: "1551288049-bebda4e38f71", alt: "Dashboard of learner activity signals an agent can act on" },
      {
        html: `
<h2>Where agents genuinely help in learning</h2>
<p>The best early uses are the ones where the work is repetitive, the rules are clear and the cost of a mistake is small:</p>
<ul>
<li>Spotting learners who are drifting before the drop-out point, not after it.</li>
<li>Turning a learner's wrong answers into a personalised revision set for the week.</li>
<li>Preparing first-draft feedback on assignments against a rubric, for a mentor to review.</li>
<li>Handling scheduling, reminders and resource links so mentors spend their time teaching.</li>
</ul>
<h2>Where they should not be left alone</h2>
<p>Agents take actions, which means their mistakes are actions too. Anything that affects a learner's grade, record or wellbeing needs a person in the loop. A sensible default is simple: the agent can <em>draft</em> anything, but it can only <em>send</em> or <em>submit</em> things that are low-stakes and reversible.</p>
<blockquote>The question is not "can the model do this?" It is "what happens when it does this wrong, and who notices?"</blockquote>
<h2>How to start</h2>
<p>Pick one workflow your team already runs by hand every week. Write down each step, the systems it touches and the decision points. That document is your agent's first specification — and it often shows that half of the process can be automated with no AI at all.</p>
<p>Then build the smallest version, keep a human approving every action for the first few weeks, and only widen its permissions once you have seen it be right, repeatedly, on your real data.</p>`,
      },
    ],
    faqs: [
      {
        question: "Is agentic AI just a chatbot with more features?",
        answer:
          "No. A chatbot responds to one message at a time. An agent pursues a goal across many steps, uses tools such as your LMS or calendar, and decides its own next action. The model inside can be the same; the loop around it is what makes it an agent.",
      },
      {
        question: "Do we need a new platform to use AI agents in a course?",
        answer:
          "Usually not. Most useful agents connect to systems you already run — the LMS, a shared drive, email or chat. The work is in defining the goal, the allowed actions and the approval points.",
      },
      {
        question: "Is it safe to let an agent message learners directly?",
        answer:
          "Start with the agent drafting and a person sending. Once you have reviewed enough of its drafts to trust it on a specific, low-stakes message type such as reminders, let it send those on its own.",
      },
    ],
  },
  {
    slug: "from-tutor-bot-to-learning-agent",
    title: "From Tutor Bot to Learning Agent: AI That Teaches Instead of Tells",
    excerpt:
      "Handing learners instant answers feels helpful and quietly stops them learning. A good learning agent plans practice, asks before it explains, and remembers what you got wrong last week.",
    category: "Learning & Growth",
    tags: ["ai-tutor", "learning-science", "agentic-ai", "study-skills"],
    cover: "1620712943543-bcc4688e7485",
    author: "meera",
    publishedAt: "2026-09-15T09:00:00+05:30",
    metaTitle: "From Tutor Bot to Learning Agent | UpperCurve",
    metaDescription:
      "How to design an AI tutor that builds understanding instead of handing out answers: questioning first, spaced practice, error memory and clear hand-offs to mentors.",
    body: [
      {
        html: `
<p>The easiest AI tutor to build is one that answers every question correctly and instantly. It is also one of the least useful. When the answer arrives before the learner has had to think, the thinking never happens — and neither does the learning.</p>
<p>Agentic design gives us a better option. Instead of a bot that reacts to questions, we can build an agent whose goal is that the learner <em>can do it on their own next week</em>. That goal changes almost every decision the system makes.</p>
<h2>Ask before you explain</h2>
<p>A learning agent's first move on a question should usually be a question back: what have you tried, where did it stop making sense, what do you expect the answer to look like? This is not a trick to slow people down. Retrieving what you already know is the part that builds memory.</p>
<p>The agent then gives the smallest hint that moves the learner forward, and only escalates to a worked explanation when hints stop working.</p>
<h2>Plan practice, not just answers</h2>
<p>Because an agent can act over time, it can do what a one-off chat cannot:</p>
<ul>
<li><strong>Spaced review</strong> — bring a topic back a few days later, then a week later, instead of covering it once.</li>
<li><strong>Interleaving</strong> — mix problem types so the learner has to decide which method applies, not just repeat the one the chapter just taught.</li>
<li><strong>Error memory</strong> — keep a short record of each learner's recurring mistakes and build the next practice set around them.</li>
</ul>`,
      },
      { image: "1434030216411-0b793f4b4173", alt: "Learner working through practice problems in a notebook" },
      {
        html: `
<h2>Know when to hand over to a human</h2>
<p>An agent that tutors needs clear exit points. Frustration that keeps rising, the same misconception surviving three different explanations, or anything suggesting a learner is struggling beyond the coursework — these should route to a mentor, with a short summary so the learner does not have to repeat themselves.</p>
<blockquote>A good tutor agent measures itself by how rarely the learner needs it for the same thing twice.</blockquote>
<h2>Designing the guardrails</h2>
<p>Writing the rules down is most of the work. For each course, decide:</p>
<ul>
<li>Which questions the agent must never answer outright, such as graded assignment questions.</li>
<li>Which material it is allowed to draw on — ideally only your course content, with citations back to it.</li>
<li>How it should respond when it is not sure: say so, and point to the source or a mentor.</li>
</ul>
<p>Test those rules before learners do. Collect twenty or thirty real learner questions, including the awkward ones, and check every change to the agent against that set. It is the difference between a tutor that works in a demo and one that still works in week six of a cohort.</p>`,
      },
    ],
    faqs: [
      {
        question: "Won't learners get frustrated if the AI will not just give the answer?",
        answer:
          "Some will at first. The fix is to make the hints genuinely useful and fast, and to explain up front why the tutor works this way. Learners tend to accept it once they notice they are solving more on their own.",
      },
      {
        question: "How is a learning agent different from an adaptive learning platform?",
        answer:
          "Adaptive platforms usually pick the next item from a fixed question bank. A learning agent can also converse, generate new practice from your material, schedule follow-ups and hand cases to a mentor. The best setups combine both.",
      },
      {
        question: "What should a tutor agent be grounded in?",
        answer:
          "Your own course material first. Grounding the agent in the syllabus, notes and worked examples keeps its explanations consistent with how the course teaches, and lets it cite where an idea comes from.",
      },
    ],
  },
  {
    slug: "agentic-workflow-assignment-feedback",
    title: "Your First Agentic Workflow: Assignment Feedback for a Course Team",
    excerpt:
      "A step-by-step look at building a feedback agent that reads submissions, applies your rubric and drafts comments — while a mentor stays in charge of every grade.",
    category: "Product & Business",
    tags: ["agentic-workflows", "assessment", "course-operations", "edtech"],
    cover: "1521737604893-d14cc237f11d",
    author: "ananya",
    publishedAt: "2026-09-08T09:00:00+05:30",
    metaTitle: "Build an Agentic Feedback Workflow for Your Course | UpperCurve",
    metaDescription:
      "A practical guide to a first agentic workflow in education: narrow tools, an evaluation set of graded work, and a mentor review queue that keeps humans in charge of grades.",
    body: [
      {
        html: `
<p>Feedback is where course teams lose the most hours. It is also where learners feel the delay most: a comment that arrives two weeks after the assignment is feedback on a version of themselves that no longer exists.</p>
<p>That makes assignment feedback a good first agentic workflow. The task is well defined, there is already a rubric, and a mentor can review everything before it reaches the learner.</p>
<h2>Step 1: Write down the process you already run</h2>
<p>Before touching a model, map the current process. For most teams it looks something like this:</p>
<ol>
<li>A submission lands in the LMS.</li>
<li>A mentor opens it next to the rubric.</li>
<li>They score each criterion and write comments.</li>
<li>Someone checks for consistency across mentors.</li>
<li>The feedback is released to the learner.</li>
</ol>
<p>The agent takes over the slow middle — steps 2 and 3 — as a draft. Steps 4 and 5 stay human.</p>
<h2>Step 2: Give the agent tools, not just a prompt</h2>
<p>A workflow becomes agentic when the model can act. Here, that means a short list of narrowly scoped tools:</p>
<ul>
<li><strong>Fetch submission</strong> — read one learner's submission.</li>
<li><strong>Get rubric</strong> — read the rubric and exemplar answers for that assignment.</li>
<li><strong>Search course material</strong> — find the lesson a comment should point back to.</li>
<li><strong>Save draft feedback</strong> — store scores and comments for review.</li>
</ul>
<p>Notice what is missing: there is no tool to publish grades. Leaving out the dangerous tool is the most reliable guardrail you have.</p>`,
      },
      { image: "1501504905252-473c47e087f8", alt: "Mentor reviewing drafted feedback on a laptop" },
      {
        html: `
<h2>Step 3: Build an evaluation set before you trust it</h2>
<p>Take 30 to 50 past submissions that mentors have already graded. Run the agent on them and compare: where does it agree with the mentors, where does it drift, and does it drift in the same direction every time? Keep this set and re-run it after every prompt or model change. Without it, you are guessing.</p>
<h2>Step 4: Put the review step where it hurts least</h2>
<p>The mentor now opens a queue of drafts instead of a pile of raw submissions. For each one they accept, edit or reject. Track the edit rate per rubric criterion — it tells you exactly where the agent needs work, and when it is ready to take on more.</p>
<blockquote>Measure the agent by how much a mentor has to change, not by how impressive its comments sound.</blockquote>
<h2>What it costs, roughly</h2>
<p>Model costs per submission are usually small next to mentor time, but they add up at cohort scale. Estimate with your real numbers: submissions per week, average length, and how many tool calls an average run takes. Cache the rubric and course material where your provider allows it, since they are the same for every learner.</p>
<h2>What to automate next</h2>
<p>Once the feedback loop is stable, the same pattern — clear goal, narrow tools, evaluation set, human review — carries over to other work: drafting weekly progress notes, preparing office-hour agendas from common mistakes, or checking new course material against the syllabus.</p>`,
      },
    ],
    faqs: [
      {
        question: "Will an AI feedback agent replace mentors?",
        answer:
          "No. In this design the agent drafts and the mentor decides. The point is to move mentor time from typing repetitive comments to reviewing, correcting and adding the judgement only they can add.",
      },
      {
        question: "How do we stop the agent from being too generous or too harsh?",
        answer:
          "Keep an evaluation set of already-graded submissions and compare the agent's scores with your mentors' on every change. If it drifts consistently in one direction on a criterion, tighten that criterion's rubric language or add exemplars.",
      },
      {
        question: "Which LMS does this work with?",
        answer:
          "Any LMS that lets you read submissions and write draft feedback through an API or an export. The agent's tools are thin wrappers around those calls, so the pattern stays the same across platforms.",
      },
    ],
  },
  {
    slug: "edtech-careers-when-agents-do-the-busywork",
    title: "Careers in EdTech When Agents Do the Busywork",
    excerpt:
      "As AI agents take over scheduling, first drafts and routine support, the valuable work in education shifts. These are the roles growing around it — and the skills to start building now.",
    category: "Careers & Interviews",
    tags: ["careers", "agentic-ai", "edtech", "upskilling"],
    cover: "1573164713988-8665fc963095",
    author: "rohan",
    publishedAt: "2026-08-29T09:00:00+05:30",
    metaTitle: "EdTech Careers in the Age of AI Agents | UpperCurve",
    metaDescription:
      "The edtech roles growing around AI agents — learning engineers, workflow designers, evaluation designers — and the skills that make you hireable for them.",
    body: [
      {
        html: `
<p>Every wave of automation in education has produced the same headline: the machines are coming for teachers. It has never quite happened that way. What changes is the work around teaching — and right now, AI agents are changing it faster than most job descriptions.</p>
<p>When an agent can draft feedback, answer routine questions and chase late submissions, the scarce skills move elsewhere. If you are building a career in edtech, that is where to look.</p>
<h2>The roles taking shape</h2>
<ul>
<li><strong>Learning engineer</strong> — combines learning science with building. Designs how an AI tutor should behave, then tests whether learners actually learn more.</li>
<li><strong>AI workflow designer</strong> — maps a team's processes, decides what an agent should do and what stays human, and writes the rules in between.</li>
<li><strong>Evaluation designer</strong> — builds the test sets and rubrics that tell a team whether an agent is getting better or worse. Few people do this well, and every serious team needs it.</li>
<li><strong>Mentor or facilitator</strong> — the human role that grows rather than shrinks. With the admin handled, the job becomes coaching, motivation and judgement.</li>
</ul>`,
      },
      { image: "1522202176988-66273c2fd55f", alt: "Learners collaborating on laptops during a cohort session" },
      {
        html: `
<h2>Skills worth building now</h2>
<h3>1. Specifying work clearly</h3>
<p>Agents are only as good as the goal and rules they are given. Writing a precise, testable description of a task — inputs, steps, edge cases, what "done" looks like — is quickly becoming a core professional skill.</p>
<h3>2. Evaluating AI output</h3>
<p>Anyone can judge one answer. The valuable skill is judging a hundred of them systematically: building a sample, defining what good looks like, and spotting patterns in the failures.</p>
<h3>3. Understanding how people learn</h3>
<p>Retrieval practice, spacing, feedback timing, motivation. Teams that pair agent-building with real learning science build products that work; teams that skip it build very fast ways to hand learners answers.</p>
<h3>4. Enough technical fluency to build a prototype</h3>
<p>You do not need to be a machine-learning engineer. You do need to be comfortable connecting a model to a spreadsheet, a document store or an LMS, and reading the results critically.</p>
<h2>How to show it in an interview</h2>
<p>Credentials help less than evidence. Bring one small thing you built and can explain end to end: the problem, the agent's tools, what went wrong, how you measured it and what you changed. A two-page write-up of a working prototype says more than a list of courses.</p>
<blockquote>The strongest portfolio piece is not the most impressive demo. It is the one where you can show what failed and how you found out.</blockquote>
<p>The busywork is going to the agents. The judgement — what to teach, how to know it worked, when a learner needs a person — is staying with people. Build a career around that.</p>`,
      },
    ],
    faqs: [
      {
        question: "Do I need to learn to code for a career in AI-powered edtech?",
        answer:
          "It helps, but it is not the entry point for most roles. Clear task specification, evaluation and learning design matter more for workflow and learning-engineering roles. Basic scripting and comfort with APIs make you noticeably more effective.",
      },
      {
        question: "Which edtech roles are least likely to be automated?",
        answer:
          "Roles built on judgement and relationships: mentoring, facilitation, curriculum decisions and evaluation design. Agents are taking over the repetitive tasks around those roles rather than the roles themselves.",
      },
      {
        question: "What should a first portfolio project look like?",
        answer:
          "Something small and real: an agent that drafts study plans from a syllabus, or one that turns quiz mistakes into revision sets. Document the goal, the tools it uses, how you tested it and what you changed afterwards.",
      },
    ],
  },
];

function blocksFor(seed: Seed): BlogBlock[] {
  return seed.body.map((section, i) =>
    "html" in section
      ? { id: `${seed.slug}-${i}`, type: "paragraph", html: section.html.trim().replace(/\n/g, "") }
      : { id: `${seed.slug}-${i}`, type: "image", url: unsplash(section.image), alt: section.alt, credit: "Photo: Unsplash" }
  );
}

/** Same ~200 wpm count over paragraph blocks as the admin editor's computeReadTime. */
function readTimeFor(blocks: BlogBlock[]): string {
  const words = blocks
    .flatMap((b) => (b.type === "paragraph" ? b.html.replace(/<[^>]*>/g, " ").split(/\s+/) : []))
    .filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

async function seed() {
  const replace = process.argv.includes("--replace");
  await sequelize.authenticate();

  const { org, site } = await runAsSystem("seed-blogs:resolve-site", async () => {
    const organization = await Organization.findOne({ where: { isPlatform: true } });
    if (!organization) throw new Error("No platform organization found.");
    const uppercurve = await Site.findOne({
      where: { organizationId: organization.id, slug: "uppercurve" } as never,
    });
    if (!uppercurve) throw new Error("The platform org has no 'uppercurve' site.");
    return { org: organization, site: uppercurve };
  });

  await runForOrg(org.id, async () => {
    const slugs = BLOGS.map((b) => b.slug);
    // Legacy rows may predate siteId and only carry domain="uppercurve".
    const onUppercurve = { [Op.or]: [{ siteId: site.id }, { domain: "uppercurve" }] };

    if (replace) {
      const stale = await Blog.findAll({ where: { ...onUppercurve, slug: { [Op.notIn]: slugs } } });
      for (const row of stale) {
        console.log(`  deleted  ${row.slug}  (${row.title})`);
        await row.destroy();
      }
    }

    for (const seedBlog of BLOGS) {
      const contentBlocks = blocksFor(seedBlog);
      const payload = {
        title: seedBlog.title,
        slug: seedBlog.slug,
        excerpt: seedBlog.excerpt,
        content: "",
        contentBlocks,
        faqs: seedBlog.faqs,
        category: seedBlog.category,
        tags: seedBlog.tags,
        coverImage: unsplash(seedBlog.cover),
        ...AUTHORS[seedBlog.author],
        readTime: readTimeFor(contentBlocks),
        publishedAt: new Date(seedBlog.publishedAt),
        metaTitle: seedBlog.metaTitle,
        metaDescription: seedBlog.metaDescription,
        status: "Published" as const,
        domain: "uppercurve" as const,
        siteId: site.id,
        organizationId: org.id,
      };

      // Slugs are unique per org, not per site — never overwrite a Rhinon Labs post.
      const existing = await Blog.findOne({ where: { slug: seedBlog.slug } });
      if (existing && existing.siteId !== site.id && existing.domain !== "uppercurve") {
        console.warn(`  skipped  ${seedBlog.slug}  (slug already used by another site's blog)`);
        continue;
      }
      if (existing) {
        await existing.update(payload as never);
        console.log(`  updated  ${seedBlog.slug}  [${seedBlog.category}]`);
      } else {
        await Blog.create(payload as never);
        console.log(`  created  ${seedBlog.slug}  [${seedBlog.category}]`);
      }
    }

    const total = await Blog.count({ where: onUppercurve });
    console.log(`\n  ${BLOGS.length} seeded · ${total} blog(s) now on the ${site.get("slug")} site.`);
  });

  await sequelize.close();
}

seed().catch((err) => {
  console.error("Blog seed failed:", err.message);
  process.exit(1);
});
