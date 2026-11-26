import type { MockKey } from "@/content/products";

/** The deeper half of each feature page. Same claims rules as content/features.ts. */
export type FeatureDepth = {
  mock: MockKey;
  /** The problem this feature solves, in two or three plain paragraphs. */
  why: { title: string; paras: string[] };
  /** How each kind of business uses it; slugs are solution pages. */
  uses: { solution: string; line: string }[];
  compare: string[];
  faq: { q: string; a: string }[];
};

export const FEATURE_DEPTH: Record<string, FeatureDepth> = {
  "crm-with-project-management": {
    mock: "work",
    why: {
      title: "The gap between 'won' and 'started' is where clients get lost.",
      paras: [
        "In most small service businesses the sales side lives in a CRM and the delivery side lives in a project tool. When a deal is won, someone copies the client's details, the scope and the contacts from one to the other. Things go missing, the kick-off is late, and the delivery team starts without the notes from the sales calls.",
        "When the CRM and projects are one product, there is nothing to copy. The project is created from the deal, the client and their contacts are already attached, and anyone on the project can open the deal to see what was promised.",
      ],
    },
    uses: [
      { solution: "agencies", line: "Convert the signed pitch into a project with the client attached, and share the client portal on day one." },
      { solution: "it-services", line: "The scoping notes stay linked to the project, so the sprint board starts with the context the sales call produced." },
      { solution: "consultancies", line: "Each agreed engagement becomes a project with your standard phases, and the partner who won it can still see the history." },
    ],
    compare: ["hubspot-alternative", "pipedrive-alternative", "clickup-alternative"],
    faq: [
      { q: "Do I need to set up an integration between the CRM and projects?", a: "No. They are the same product, so there is nothing to connect or keep in sync." },
      { q: "Can I convert a deal into an existing project?", a: "Converting a won deal creates a new project with the client attached, and each deal can be converted once, so you never get duplicate projects. Project templates are not built yet." },
      { q: "Which project views are there?", a: "List, board, calendar and Gantt, plus sprints for teams that work in iterations." },
    ],
  },
  "client-portal": {
    mock: "work",
    why: {
      title: "Status updates eat the week. A portal gives the time back.",
      paras: [
        "Clients want to know where their project stands, and the usual answer is a weekly email, a status call or a stream of WhatsApp messages to whoever they know best. Each one interrupts the person doing the work.",
        "A client portal turns that around. The client opens a private link whenever they like, sees the project's tasks in the view that suits them, and sends requests in the same place, where your team can turn them into tasks instead of losing them in a chat.",
      ],
    },
    uses: [
      { solution: "agencies", line: "Clients see the creative rounds on a board and send change requests that become tasks for the designer." },
      { solution: "it-services", line: "Clients follow the sprint on a Gantt or board instead of asking for a weekly status email." },
      { solution: "consultancies", line: "Clients track an engagement's phases while internal notes and files stay private." },
    ],
    compare: ["honeybook-alternative", "teamwork-alternative", "clickup-alternative"],
    faq: [
      { q: "Can a client see other clients' projects?", a: "No. Each portal link shows one project only." },
      { q: "Can I turn off a portal?", a: "Portals only exist for projects visible to the workspace. Team and private projects never have one." },
      { q: "Is the portal included on the free plan?", a: "Yes. Projects and the client portal are free for up to 5 people." },
    ],
  },
  "lead-management": {
    mock: "crm",
    why: {
      title: "Leads leak from the gaps between tools.",
      paras: [
        "Enquiries arrive from a website form, a chat, a campaign reply or a spreadsheet someone kept from an event. When each source lands somewhere different, nobody can say how many leads came in this week, or who is following up which one.",
        "Lead management puts every source in one list. Each lead has an owner, a stage and a timeline of every email and activity, and duplicates are flagged so a repeat enquiry joins the lead you already have instead of starting a second conversation.",
      ],
    },
    uses: [
      { solution: "startups", line: "Import the founder's prospect spreadsheet once and work it as a real pipeline from then on." },
      { solution: "agencies", line: "The AI Agent saves every website visitor it talks to, so enquiries outside office hours are not lost." },
      { solution: "professional-services", line: "Leads from each service line land in one list with an owner, so follow-up does not depend on memory." },
    ],
    compare: ["freshsales-alternative", "pipedrive-alternative", "hubspot-alternative"],
    faq: [
      { q: "What happens to a lead the AI Agent talks to?", a: "It is saved in the CRM with the conversation attached, so your team can follow up with the context." },
      { q: "Can I export my leads?", a: "Yes. Export any filtered list of leads as a spreadsheet." },
      { q: "Is lead management free?", a: "Yes. The CRM is free for up to 5 people. The AI Agent that captures website visitors is on Starter." },
    ],
  },
  "sales-pipeline": {
    mock: "crm",
    why: {
      title: "A pipeline should end with the work starting, not a spreadsheet.",
      paras: [
        "A deals board shows what is likely to close and what is stuck. For a service business, though, closing is the middle of the story: the next step is delivering what was sold.",
        "Rhinon's pipeline works like any good deals board, with your stages, values, close dates and lost reasons. The difference is the last step: a won deal turns into the project that delivers it, with the client already attached.",
      ],
    },
    uses: [
      { solution: "agencies", line: "Enquiry → Discovery call → Pitch sent → Negotiation → Won, with the follow-up for each pitch drafted by Outreach." },
      { solution: "consultancies", line: "Introduction → Scoping → Proposal → Agreed → Won, with every partner's emails on the deal." },
      { solution: "startups", line: "One pipeline for founder-led deals, fed by AI-drafted outreach you approve." },
    ],
    compare: ["pipedrive-alternative", "freshsales-alternative", "zoho-alternative"],
    faq: [
      { q: "Can I record why deals are lost?", a: "Yes. A lost reason is captured when a deal closes, and reports show the pipeline by stage." },
      { q: "Are deal values shown in rupees?", a: "Deal values are shown in your currency, including ₹." },
      { q: "Is the pipeline free?", a: "Yes. The CRM and pipeline are free for up to 5 people." },
    ],
  },
};
