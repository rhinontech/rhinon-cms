import { Campaign, Lead, Template, User, Role, Permission, AiActivity } from "./types";

export const dummyPermissions: Permission[] = [
  { id: "perm_1", name: "manage_leads", description: "Can import, edit, and delete leads." },
  { id: "perm_2", name: "create_campaigns", description: "Can create and launch new outbound campaigns." },
  { id: "perm_3", name: "edit_templates", description: "Can create and modify messaging templates." },
  { id: "perm_4", name: "view_analytics", description: "Can view system-wide analytics and charts." },
  { id: "perm_5", name: "manage_team", description: "Can invite users and manage RBAC roles." },
];

export const dummyRoles: Role[] = [
  { id: "role_admin", name: "Administrator", permissions: ["perm_1", "perm_2", "perm_3", "perm_4", "perm_5"] },
  { id: "role_manager", name: "Campaign Manager", permissions: ["perm_1", "perm_2", "perm_3", "perm_4"] },
  { id: "role_sdr", name: "SDR Representative", permissions: ["perm_1", "perm_4"] },
];

export const dummyUsers: User[] = [
  {
    id: "user_1",
    name: "Admin",
    email: "admin@rhinonlabs.com",
    linkedinUrl: "https://linkedin.com/in/admin",
    linkedinConnected: false,
    isPrimaryAdmin: true,
    roleId: "role_admin",
    status: "Active",
    joinedAt: "2023-11-01T10:00:00Z"
  },
];

export const dummyTemplates: Template[] = [
  {
    id: "tpl_1",
    name: "Enterprise Cold Outreach",
    channel: "Cold Email",
    subject: "Scaling {{lead.company}}'s operations",
    body: "Hi {{lead.name}},\n\nI noticed that {{lead.company}} has been expanding rapidly. We help companies like yours automate outbound sales.\n\nWorth a quick chat next week?",
    aiInstructions: "Keep it under 3 sentences. Mention their recent funding round or product launch if applicable.",
    createdAt: "2024-02-10T08:00:00Z",
    updatedAt: "2024-02-15T10:00:00Z",
  },
  {
    id: "tpl_2",
    name: "Founder connection context",
    channel: "LinkedIn Post",
    body: "Hey {{lead.name}}, loved your recent post about Gen-AI. I build tools in a similar space. Would love to connect!",
    aiInstructions: "Reference a recent post or accomplishment from their profile.",
    createdAt: "2024-02-20T11:00:00Z",
    updatedAt: "2024-02-20T11:00:00Z",
  },
];

export const dummyCampaigns: Campaign[] = [
  {
    id: "cmp_1",
    name: "Q3 Enterprise SaaS Sweep",
    channel: "Cold Email",
    templateId: "tpl_1",
    stage: "Active",
    leadsProcessed: 284,
    leadsTotal: 500,
    dailyLimit: 50,
    startDate: "2024-03-01T08:00:00Z",
    createdAt: "2024-02-25T14:00:00Z",
    updatedAt: "2024-03-12T09:00:00Z",
  },
  {
    id: "cmp_2",
    name: "Series A Founders Connection",
    channel: "LinkedIn Post",
    templateId: "tpl_2",
    stage: "Paused",
    leadsProcessed: 15,
    leadsTotal: 100,
    dailyLimit: 20,
    startDate: "2024-03-10T08:00:00Z",
    createdAt: "2024-03-05T10:00:00Z",
    updatedAt: "2024-03-11T16:00:00Z",
  },
  {
    id: "cmp_3",
    name: "Dormant Leads Reactivation",
    channel: "Cold Email",
    templateId: null,
    stage: "Draft",
    leadsProcessed: 0,
    leadsTotal: 1250,
    dailyLimit: 100,
    startDate: "2024-04-01T08:00:00Z",
    createdAt: "2024-03-12T11:00:00Z",
    updatedAt: "2024-03-12T11:00:00Z",
  },
];

export const dummyLeads: Lead[] = [
  {
    id: "ld_1",
    name: "Elena Rodriguez",
    company: "Acme Corp",
    title: "VP of Sales",
    email: "elena@acmecorp.com",
    linkedinUrl: "https://linkedin.com/in/elenarodriguez",
    status: "New",
    campaignId: "cmp_1",
    addedAt: "2024-03-12T08:00:00Z",
  },
  {
    id: "ld_2",
    name: "Marcus Johnson",
    company: "TechFlow",
    title: "Founder & CEO",
    email: "marcus@techflow.io",
    status: "Emailed",
    campaignId: "cmp_1",
    addedAt: "2024-03-10T09:30:00Z",
    lastActivityAt: "2024-03-11T14:00:00Z",
  },
  {
    id: "ld_3",
    name: "Chloe Smith",
    company: "DesignHub",
    title: "Head of Marketing",
    email: "chloe@designhub.co",
    linkedinUrl: "https://linkedin.com/in/chloesmith",
    status: "Replied",
    campaignId: "cmp_1",
    addedAt: "2024-03-05T10:00:00Z",
    lastActivityAt: "2024-03-12T15:20:00Z",
  },
  {
    id: "ld_4",
    name: "David Kim",
    company: "Quantalytics",
    title: "Data Lead",
    email: "dkim@quantalytics.net",
    status: "Bounced",
    campaignId: "cmp_1",
    addedAt: "2024-03-08T11:15:00Z",
    lastActivityAt: "2024-03-09T08:10:00Z",
  },
  {
    id: "ld_5",
    name: "Priya Patel",
    company: "Nexus Ventures",
    title: "Partner",
    email: "priya@nexusvc.com",
    linkedinUrl: "https://linkedin.com/in/priyapatelvc",
    status: "Interested",
    campaignId: "cmp_2",
    addedAt: "2024-03-11T09:00:00Z",
    lastActivityAt: "2024-03-12T10:05:00Z",
  },
  {
    id: "ld_6",
    name: "Prabhat",
    company: "Rhinon Tech",
    title: "Lead Engineer",
    email: "prabhat@rhinon.tech",
    status: "New",
    campaignId: "cmp_1",
    addedAt: new Date().toISOString(),
  },
];

export const dummyAiActivities: AiActivity[] = [
  {
    id: "act_1",
    leadId: "ld_1",
    campaignId: "cmp_1",
    type: "DraftGenerated",
    content: "Hi Elena,\n\nI noticed Acme Corp recently acquired BetaStack. We help companies streamline operations post-M&A.\n\nWorth a quick chat next week?",
    timestamp: "2024-03-12T08:30:00Z",
  },
  {
    id: "act_2",
    leadId: "ld_2",
    campaignId: "cmp_1",
    type: "OutreachSent",
    content: "Email outreach sent: 'Scaling TechFlow's operations'",
    timestamp: "2024-03-11T14:00:00Z",
  },
];
