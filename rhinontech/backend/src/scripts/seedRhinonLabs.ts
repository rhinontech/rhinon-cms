/**
 * One-time script: seeds Rhinon Labs blog topics, creates Work project + tasks.
 * Run from rhinontech/backend: npx tsx src/scripts/seedRhinonLabs.ts
 */

import "../models/index";
import { sequelize } from "../config/database";
import { BlogTopic } from "../models/BlogTopic";
import { Site } from "../models/Site";
import { User } from "../models/User";
import { runAsSystem, runForOrg } from "../services/tenantContext";

async function main() {
  await sequelize.authenticate();
  console.log("DB connected");

  // Dynamic imports to avoid circular deps at model registration time
  const { Project } = await import("../models/Project");
  const { Task } = await import("../models/Task");

  // 1. Find rhinonlabs site (cross-tenant query — it's a platform-level lookup)
  const site = await runAsSystem("seedRhinonLabs: find site", () =>
    (Site as any).findOne({ where: { slug: "rhinonlabs" } })
  );
  if (!site) throw new Error("rhinonlabs site not found");
  console.log("Site:", site.id);

  // 2. Find Prabhat (cross-tenant query)
  const prabhat = await runAsSystem("seedRhinonLabs: find user", () =>
    (User as any).findOne({ where: { companyEmail: "prabhat@rhinontech.in" } })
  );
  if (!prabhat) throw new Error("User prabhat@rhinontech.in not found");
  const userId: string = prabhat.id;
  const orgId: string = prabhat.organizationId;
  console.log("User:", userId, prabhat.fullName, "orgId:", orgId);

  // 3. Queue 3 blog topics
  const topics = [
    {
      title: "How Much Does Mobile App Development Cost in India in 2027?",
      keyword: "mobile app development cost india 2027",
      audience: "Founders and PMs comparing vendors and budgeting a mobile app build",
      notes: "Include real price ranges (₹5L–₹30L), factors that affect cost (complexity, platform, team location), and a comparison table. CTA: book a free scoping call with Rhinon Labs.",
      targetPage: "/services/mobile-app-development",
      withImages: true,
    },
    {
      title: "What Is an AI Agent Development Company (And Does Your Business Need One)?",
      keyword: "ai agent development company",
      audience: "Business owners and founders evaluating whether to hire an AI development company",
      notes: "Explain what AI agents are, what an AI agent dev company does, real use cases (customer support, lead qualification, internal ops), when to hire one vs build in-house. CTA: book a consultation.",
      targetPage: "/services/ai-agents",
      withImages: true,
    },
    {
      title: "How to Automate Employee Onboarding in a Small Company",
      keyword: "automate employee onboarding",
      audience: "Founders and HR managers at small companies (5–50 employees)",
      notes: "Cover the manual pain points, what can be automated (offer letters, account setup, task assignments, reminders), tools to use, and a step-by-step guide. Link to the free onboarding checklist tool at /tools/employee-onboarding-checklist. CTA: workflow automation service.",
      targetPage: "/services/workflow-automation",
      withImages: true,
    },
    {
      title: "How to Choose a Custom Software Development Company in India",
      keyword: "custom software development company india",
      audience: "Founders and business owners in India evaluating software vendors",
      notes: "Cover what to look for (portfolio, process, communication, pricing models), red flags, questions to ask before signing, fixed-price vs time-and-materials, and a vendor evaluation checklist. CTA: book a free scoping call with Rhinon Labs.",
      targetPage: "/services/mvp-development",
      withImages: true,
    },
    {
      title: "How to Hire App Developers in India: A Founder's Guide",
      keyword: "hire app developers india",
      audience: "Founders and PMs looking to hire app developers or a dev agency in India",
      notes: "Cover hiring options (freelancers vs agency vs in-house), cost ranges, how to evaluate portfolios and code quality, interview questions, contracts and IP ownership. Link to the mobile app cost blog. CTA: book a call with Rhinon Labs.",
      targetPage: "/services/mobile-app-development",
      withImages: true,
    },
    {
      title: "AI Agents for Business: 7 Real Use Cases That Save Hours Every Week",
      keyword: "ai agents for business",
      audience: "Business owners and ops leaders exploring practical AI agent use cases",
      notes: "Cover 7 concrete use cases: customer support, lead qualification, onboarding, reporting, email triage, data entry, scheduling. Real examples with time saved per use case. Link to the AI agent development company blog and /services/ai-agents. CTA: free automation audit.",
      targetPage: "/services/ai-agents",
      withImages: true,
    },
  ];

  await runForOrg(orgId, async () => {
    for (const t of topics) {
      const existing = await (BlogTopic as any).findOne({ where: { title: t.title, siteId: site.id } });
      if (existing) { console.log("Skip (exists):", t.title); continue; }
      await (BlogTopic as any).create({ ...t, siteId: site.id, organizationId: orgId, status: "Queued" });
      console.log("✓ Topic:", t.title);
    }

    // 4. Create Rhinon Labs project
    let project = await (Project as any).findOne({ where: { name: "Rhinon Labs" } });
    if (!project) {
      project = await (Project as any).create({
        name: "Rhinon Labs",
        status: "Active",
        visibility: "workspace",
        createdById: userId,
      });
      console.log("✓ Project created:", project.id);
    } else {
      console.log("Project already exists:", project.id);
    }

    // 5. Create 7 tasks
    const tasks = [
      { title: "Queue and generate 3 AI blog posts on Rhinon Labs", description: "Topics: mobile app cost (2027), AI agent development company, automate employee onboarding. Review AI drafts and publish on rhinonlabs.com.", dueDate: "2027-01-24", priority: "High" },
      { title: "Add focusKeyword to blog pipeline", description: "Backend model field, blogGenerator.ts copy, and editor SEO section — confirm after deploy.", dueDate: "2027-01-21", priority: "High" },
      { title: "Build Employee Onboarding Checklist free tool", description: "/tools/employee-onboarding-checklist live on rhinonlabs.com. Test form lead submission.", dueDate: "2027-01-28", priority: "High" },
      { title: "Build CRM ROI Calculator free tool", description: "/tools/crm-roi-calculator live on rhinonlabs.com. Verify calculator logic and book-a-call CTA.", dueDate: "2027-01-28", priority: "High" },
      { title: "Add /tools index + sitemap + footer/homepage links", description: "Deploy rhinonlabs.com with tools index, sitemap, footer nav, and LeadMagnet link.", dueDate: "2027-01-28", priority: "High" },
      { title: "Submit tools to Product Hunt and 3 Reddit threads", description: "After tools are live. Post to r/smallbusiness, r/entrepreneur, r/indiahackers for first backlinks.", dueDate: "2027-02-01", priority: "Medium" },
      { title: "Create LinkedIn content calendar for January 2027", description: "3 posts/week: builds, wins, lessons. Plan first 4 weeks posting dates + topics. Focus on AI agents and automation.", dueDate: "2027-01-21", priority: "High" },
    ];

    for (const t of tasks) {
      const existing = await (Task as any).findOne({ where: { title: t.title } });
      if (existing) { console.log("Skip (exists):", t.title); continue; }
      await (Task as any).create({
        ...t,
        projectId: project.id,
        assigneeId: userId,
        createdById: userId,
        status: "Pending",
      });
      console.log("✓ Task:", t.title);
    }
  });

  console.log("\nAll done.");
  await sequelize.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
