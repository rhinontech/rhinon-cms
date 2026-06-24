import { sequelize } from "./database";
import { User, Lead, CampaignTemplate, Campaign, CampaignActivity } from "../models";

async function seedOutreach() {
  await sequelize.authenticate();
  console.log("Database connected for Outreach seeding...");

  const admin = await User.findOne({ where: { companyEmail: "prabhat@rhinontech.in" } });
  if (!admin) {
    console.error("Admin user not found. Please run main seed first.");
    return;
  }

  // 1. Seed Templates
  console.log("Seeding templates...");
  const templates = await CampaignTemplate.bulkCreate([
    {
      name: "Initial Tech Outreach",
      subject: "Scaling {{company}}'s operations with AI",
      body: "Hi {{name}},\n\nI've been following {{company}} and noticed your impressive growth. We help companies like yours optimize their workflows using Gemini 2.0.\n\nWould you be open to a quick chat?\n\nBest,\nPrabhat",
      aiInstructions: "Keep it professional but concise. Mention a potential pain point related to scaling manual tasks.",
      createdById: admin.id
    },
    {
      name: "Follow-up: Just checking in",
      subject: "Quick follow up / {{company}}",
      body: "Hi {{name}},\n\nJust wanted to make sure my previous email didn't get buried. I really think our AI solutions could save {{company}} significant time on data enrichment.\n\nBest,\nPrabhat",
      aiInstructions: "Gentle nudge, focus on time-saving benefits.",
      createdById: admin.id
    }
  ]);

  // 2. Seed Campaigns
  console.log("Seeding campaigns...");
  const campaigns = await Campaign.bulkCreate([
    {
      name: "Q2 SaaS Founders Outreach",
      stage: "Active",
      templateId: templates[0].id,
      dailyLimit: 25,
      leadsTotal: 10,
      leadsProcessed: 4,
      startDate: new Date(),
      objective: "Connect with 50 founders in the SaaS space.",
      createdById: admin.id
    },
    {
      name: "Dormant Leads Re-engagement",
      stage: "Draft",
      templateId: templates[1].id,
      dailyLimit: 10,
      leadsTotal: 5,
      leadsProcessed: 0,
      startDate: new Date(),
      objective: "Re-engage old leads who didn't reply to the first sequence.",
      createdById: admin.id
    }
  ]);

  // 3. Seed Leads
  console.log("Seeding leads...");
  const leads = await Lead.bulkCreate([
    {
      name: "Elon Musk",
      company: "Tesla",
      title: "CEO",
      email: "elon@tesla.com",
      status: "Enrolled",
      campaignId: campaigns[0].id,
      source: "Manual",
      notes: "High priority lead."
    },
    {
      name: "Jensen Huang",
      company: "NVIDIA",
      title: "CEO",
      email: "jensen@nvidia.com",
      status: "Emailed",
      campaignId: campaigns[0].id,
      source: "Manual",
      notes: "Sent initial outreach."
    },
    {
      name: "Sam Altman",
      company: "OpenAI",
      title: "CEO",
      email: "sam@openai.com",
      status: "Interested",
      campaignId: campaigns[0].id,
      source: "Manual",
      notes: "Replied and interested in a demo."
    },
    {
      name: "Mark Zuckerberg",
      company: "Meta",
      title: "CEO",
      email: "zuck@meta.com",
      status: "New",
      source: "Manual"
    },
    {
      name: "Sundar Pichai",
      company: "Google",
      title: "CEO",
      email: "sundar@google.com",
      status: "Enriched",
      source: "Manual"
    }
  ]);

  // 4. Seed Activities
  console.log("Seeding activities...");
  await CampaignActivity.bulkCreate([
    {
      campaignId: campaigns[0].id,
      leadId: leads[0].id,
      type: "Other",
      content: "Lead enrolled in Q2 SaaS Founders Outreach"
    },
    {
      campaignId: campaigns[0].id,
      leadId: leads[1].id,
      type: "OutreachSent",
      content: "Initial Tech Outreach sent to jensen@nvidia.com"
    },
    {
      campaignId: campaigns[0].id,
      leadId: leads[2].id,
      type: "Other",
      content: "Lead replied: 'Interesting, let's talk next week.'"
    }
  ]);

  console.log("Outreach seeding completed successfully!");
  await sequelize.close();
}

seedOutreach().catch(err => {
  console.error("Outreach seed failed:", err);
  process.exit(1);
});
