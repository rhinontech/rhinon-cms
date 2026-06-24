import { sequelize } from "./database";
import { User, InboxEmail, CampaignTemplate, Campaign, Lead, CampaignActivity, syncDatabase } from "../models";
import type { InboxEmailFolder } from "../models/InboxEmail";
import type { LeadStatus } from "../models/Lead";
import type { CampaignStage, CampaignChannel } from "../models/Campaign";
import type { TemplateChannel } from "../models/CampaignTemplate";
import type { CampaignActivityType } from "../models/CampaignActivity";

// Beta/demo seed for the Emails (inbox) and Outreach modules. Dummy data only —
// no real client names. Idempotent: keyed on natural fields so it can be re-run.

const SUPERADMIN_EMAIL = "prabhat@rhinontech.in";

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

interface EmailSeed {
  threadKey: string;
  folder: InboxEmailFolder;
  fromName: string;
  fromEmail: string;
  toEmails: string[];
  subject: string;
  body: string;
  sentAt: Date;
  isRead?: boolean;
  isStarred?: boolean;
  hasAttachment?: boolean;
}

const EMAILS = (owner: string): EmailSeed[] => [
  // --- Inbox ---
  { threadKey: "thread-acme-listing", folder: "inbox", fromName: "Dana Wells", fromEmail: "dana.wells@acmeretail.test", toEmails: [owner],
    subject: "Re: Product listing page feedback", body: "Hi,\n\nThe new listing layout looks great. One thing — can we add a quick filter for 'in stock only'? A few customers asked for it.\n\nThanks,\nDana", sentAt: hoursAgo(2), isRead: false },
  { threadKey: "thread-globex-kpi", folder: "inbox", fromName: "Sam Okafor", fromEmail: "sam.okafor@globex.test", toEmails: [owner],
    subject: "Dashboard KPI requirements", body: "Hello,\n\nAttaching the final list of KPIs for the analytics dashboard. Top priority is revenue-by-region and churn rate.\n\nBest,\nSam", sentAt: hoursAgo(6), isRead: false, isStarred: true, hasAttachment: true },
  { threadKey: "thread-initech-kickoff", folder: "inbox", fromName: "Riley Quinn", fromEmail: "riley.quinn@initech.test", toEmails: [owner],
    subject: "Payments API — kickoff scheduling", body: "Hi team,\n\nCould we get a kickoff call on the calendar for next week? Tuesday or Wednesday afternoon works for us.\n\nRiley", sentAt: daysAgo(1), isRead: true },
  { threadKey: "thread-umbrella-hold", folder: "inbox", fromName: "Casey Tran", fromEmail: "casey.tran@umbrella.test", toEmails: [owner],
    subject: "Re: Project on hold", body: "Understood, thanks for the heads up. We'll revisit the health tracker once the new budget is approved next quarter.\n\nCasey", sentAt: daysAgo(2), isRead: true },
  { threadKey: "thread-invoice-june", folder: "inbox", fromName: "CloudHost Billing", fromEmail: "billing@cloudhost.test", toEmails: [owner],
    subject: "Your invoice for June is ready", body: "Hi,\n\nYour June invoice (#INV-20418) is now available. Total due: $214.00. No action needed if autopay is enabled.\n\nCloudHost", sentAt: daysAgo(3), isRead: false, hasAttachment: true },
  // --- Sent ---
  { threadKey: "thread-acme-listing", folder: "sent", fromName: "You", fromEmail: owner, toEmails: ["dana.wells@acmeretail.test"],
    subject: "Re: Product listing page feedback", body: "Hi Dana,\n\nGreat idea — we'll add an 'in stock only' filter to the listing page. Should be live by end of week.\n\nBest", sentAt: hoursAgo(1), isRead: true },
  { threadKey: "thread-globex-onboarding", folder: "sent", fromName: "You", fromEmail: owner, toEmails: ["sam.okafor@globex.test"],
    subject: "Globex onboarding — next steps", body: "Hi Sam,\n\nThanks for the KPI list. Next steps: we'll wire up the data refresh job and share a first draft of the dashboard by Friday.\n\nBest", sentAt: daysAgo(1), isRead: true },
  // --- Drafts ---
  { threadKey: "thread-northwind-closeout", folder: "drafts", fromName: "You", fromEmail: owner, toEmails: ["jordan.bell@northwind.test"],
    subject: "Project closeout summary", body: "Hi Jordan,\n\nHere's the closeout summary for the logistics suite. Everything is signed off and documentation has been handed over...\n\n[draft]", sentAt: hoursAgo(4), isRead: true },
  // --- Archive ---
  { threadKey: "thread-northwind-thanks", folder: "archive", fromName: "Jordan Bell", fromEmail: "jordan.bell@northwind.test", toEmails: [owner],
    subject: "Thanks for the handover", body: "Appreciate the smooth handover and documentation. The team is up and running. Pleasure working with you.\n\nJordan", sentAt: daysAgo(8), isRead: true },
];

interface TemplateSeed { name: string; channel: TemplateChannel; subject: string; body: string; aiInstructions: string }
const TEMPLATES: TemplateSeed[] = [
  { name: "Cold Intro — SaaS Founders", channel: "Cold Email", subject: "Quick idea for {{company}}",
    body: "Hi {{name}},\n\nNoticed {{company}} is scaling fast. We help teams like yours automate manual outreach and lead enrichment so your reps focus on closing.\n\nWorth a quick chat?\n\nBest", aiInstructions: "Concise, reference a scaling pain point, single clear CTA." },
  { name: "Follow-up Nudge", channel: "Email", subject: "Following up, {{name}}",
    body: "Hi {{name}},\n\nJust floating this back to the top of your inbox. Happy to send a short demo tailored to {{company}} if useful.\n\nBest", aiInstructions: "Gentle, low-pressure, emphasise time saved." },
];

interface CampaignSeed { name: string; channel: CampaignChannel; stage: CampaignStage; template: string; dailyLimit: number; leadsTotal: number; leadsProcessed: number; objective: string }
const CAMPAIGNS: CampaignSeed[] = [
  { name: "Q3 SaaS Outreach", channel: "Cold Email", stage: "Active", template: "Cold Intro — SaaS Founders", dailyLimit: 25, leadsTotal: 6, leadsProcessed: 3, objective: "Connect with 50 SaaS operators this quarter." },
  { name: "LinkedIn Connector Push", channel: "LinkedIn Connection", stage: "Draft", template: "Follow-up Nudge", dailyLimit: 15, leadsTotal: 4, leadsProcessed: 0, objective: "Grow first-degree network with target ICP." },
];

interface LeadSeed { name: string; company: string; title: string; email: string; status: LeadStatus; campaign?: string; location?: string; notes?: string }
const LEADS: LeadSeed[] = [
  { name: "Dana Wells", company: "Acme Retail", title: "Head of Operations", email: "dana.wells@acmeretail.test", status: "Interested", campaign: "Q3 SaaS Outreach", location: "Austin, TX", notes: "Replied, wants details." },
  { name: "Sam Okafor", company: "Globex Analytics", title: "VP Product", email: "sam.okafor@globex.test", status: "Emailed", campaign: "Q3 SaaS Outreach", location: "Denver, CO" },
  { name: "Riley Quinn", company: "Initech", title: "CTO", email: "riley.quinn@initech.test", status: "Enrolled", campaign: "Q3 SaaS Outreach", location: "Boston, MA" },
  { name: "Jordan Bell", company: "Northwind Logistics", title: "COO", email: "jordan.bell@northwind.test", status: "Replied", campaign: "Q3 SaaS Outreach", location: "Chicago, IL", notes: "Wants a call next week." },
  { name: "Casey Tran", company: "Umbrella Health", title: "Founder", email: "casey.tran@umbrella.test", status: "New", location: "Seattle, WA" },
  { name: "Morgan Reed", company: "Stark Components", title: "Director of Growth", email: "morgan.reed@starkco.test", status: "Enriched", location: "San Jose, CA" },
];

interface ActivitySeed { leadEmail: string; campaign: string; type: CampaignActivityType; content: string }
const ACTIVITIES: ActivitySeed[] = [
  { leadEmail: "riley.quinn@initech.test", campaign: "Q3 SaaS Outreach", type: "Other", content: "Lead enrolled in Q3 SaaS Outreach." },
  { leadEmail: "sam.okafor@globex.test", campaign: "Q3 SaaS Outreach", type: "OutreachSent", content: "Cold intro email sent to sam.okafor@globex.test." },
  { leadEmail: "dana.wells@acmeretail.test", campaign: "Q3 SaaS Outreach", type: "ReplyReceived", content: "Replied: 'Sounds interesting, send me details.'" },
  { leadEmail: "jordan.bell@northwind.test", campaign: "Q3 SaaS Outreach", type: "ReplyReceived", content: "Replied: 'Let's set up a call next week.'" },
];

async function seedComms() {
  await sequelize.authenticate();
  await syncDatabase();

  const admin = await User.findOne({ where: { companyEmail: SUPERADMIN_EMAIL } });
  if (!admin) {
    console.error(`Superadmin (${SUPERADMIN_EMAIL}) not found. Run 'npm run db:seed' first.`);
    process.exit(1);
  }
  const owner = admin.companyEmail!;

  // --- Emails ---
  for (const e of EMAILS(owner)) {
    await InboxEmail.findOrCreate({
      where: { ownerEmail: owner, folder: e.folder, subject: e.subject, fromEmail: e.fromEmail },
      defaults: {
        threadKey: e.threadKey,
        folder: e.folder,
        fromName: e.fromName,
        fromEmail: e.fromEmail,
        toEmails: e.toEmails,
        ccEmails: [],
        subject: e.subject,
        body: e.body,
        snippet: e.body.replace(/\n/g, " ").slice(0, 160),
        ownerEmail: owner,
        isRead: e.isRead ?? false,
        isStarred: e.isStarred ?? false,
        hasAttachment: e.hasAttachment ?? false,
        sentAt: e.sentAt,
      },
    });
  }
  console.log(`Emails ready: ${EMAILS(owner).length} (owner: ${owner})`);

  // --- Outreach templates ---
  const templates: Record<string, CampaignTemplate> = {};
  for (const t of TEMPLATES) {
    const [tpl] = await CampaignTemplate.findOrCreate({
      where: { name: t.name, createdById: admin.id },
      defaults: { name: t.name, channel: t.channel, subject: t.subject, body: t.body, aiInstructions: t.aiInstructions, createdById: admin.id },
    });
    templates[t.name] = tpl;
  }
  console.log(`Templates ready: ${TEMPLATES.length}`);

  // --- Campaigns ---
  const campaigns: Record<string, Campaign> = {};
  for (const c of CAMPAIGNS) {
    const [camp] = await Campaign.findOrCreate({
      where: { name: c.name, createdById: admin.id },
      defaults: {
        name: c.name, channel: c.channel, stage: c.stage, templateId: templates[c.template]?.id ?? null,
        dailyLimit: c.dailyLimit, leadsTotal: c.leadsTotal, leadsProcessed: c.leadsProcessed,
        startDate: daysAgo(7), objective: c.objective, createdById: admin.id,
      },
    });
    campaigns[c.name] = camp;
  }
  console.log(`Campaigns ready: ${CAMPAIGNS.length}`);

  // --- Leads ---
  const leads: Record<string, Lead> = {};
  for (const l of LEADS) {
    const [lead] = await Lead.findOrCreate({
      where: { email: l.email },
      defaults: {
        name: l.name, company: l.company, title: l.title, email: l.email, status: l.status,
        campaignId: l.campaign ? campaigns[l.campaign].id : null, location: l.location, notes: l.notes,
        source: "Manual", addedAt: daysAgo(6),
      },
    });
    leads[l.email] = lead;
  }
  console.log(`Leads ready: ${LEADS.length}`);

  // --- Activities ---
  for (const a of ACTIVITIES) {
    const lead = leads[a.leadEmail];
    if (!lead) continue;
    await CampaignActivity.findOrCreate({
      where: { leadId: lead.id, content: a.content },
      defaults: { leadId: lead.id, campaignId: campaigns[a.campaign]?.id ?? null, type: a.type, content: a.content, timestamp: daysAgo(2) },
    });
  }
  console.log(`Activities ready: ${ACTIVITIES.length}`);

  await sequelize.close();
  console.log("Emails + Outreach seed complete.");
}

seedComms().catch((err) => {
  console.error("Comms seed failed:", err);
  process.exit(1);
});
