export const metrics = [
  { label: "Active Campaigns", value: "12", delta: "+2 this week" },
  { label: "Leads Processed Today", value: "1,280", delta: "+14.2%" },
  { label: "Emails Sent", value: "8,952", delta: "+6.4%" },
  { label: "Reply Rate", value: "22.8%", delta: "+1.7%" },
];

export const leads = [
  {
    name: "Alicia Moreno",
    company: "Northgate Labs",
    email: "alicia@northgate.dev",
    campaign: "Q3 Expansion",
    status: "Replied",
  },
  {
    name: "Jared Kim",
    company: "Asterion Data",
    email: "jared@asterion.ai",
    campaign: "Founder Outreach",
    status: "Emailed",
  },
  {
    name: "Mina Rossi",
    company: "Rivet Systems",
    email: "mina@rivet.systems",
    campaign: "Warm Pipeline",
    status: "New",
  },
  {
    name: "Dev Patel",
    company: "Clarity Motion",
    email: "dev@claritymotion.com",
    campaign: "Q3 Expansion",
    status: "Bounced",
  },
];

export const activity = [
  "Campaign 'Q3 Outreach' finished processing 500 leads.",
  "Gemini generated 85 personalized email drafts.",
  "Team member 'Nora' approved 26 pending replies.",
  "Lead cohort import completed with 1,200 contacts.",
];

export const campaigns = [
  { name: "Q3 Expansion", stage: "Active", progress: 74 },
  { name: "Founder Outreach", stage: "Draft", progress: 18 },
  { name: "Reactivation Sprint", stage: "Completed", progress: 100 },
];
