/**
 * Feature pages: /features/<slug>. Each one answers a single search (keyword map,
 * docs/RHINONTECH_WEBSITE_REVAMP.md §3.2) with one capability of a parent product.
 * Claims must match the live product (claims register §2.6); facts below were checked in
 * the backend (deals.ts convert-to-project, public.ts client portal, Lead/Deal models).
 */

export type Feature = {
  slug: string;
  name: string;
  /** Parent product slug; the breadcrumb and the main link point to it. */
  product: string;
  keyword: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  sub: string;
  steps: { title: string; body: string }[];
  details: string[];
  related: string[];
  faq: { q: string; a: string }[];
};

export const FEATURES: Feature[] = [
  {
    slug: "crm-with-project-management",
    name: "CRM with project management",
    product: "projects",
    keyword: "crm with project management",
    metaTitle: "CRM with Project Management Built In",
    metaDescription: "A CRM with project management in the same app: convert a won deal into a project in one click, with the client attached and a portal they can follow.",
    h1: "A CRM with project management built in",
    sub: "Most teams keep deals in one tool and projects in another, and retype the brief in between. In Rhinon the deal and the project are one record.",
    steps: [
      { title: "Win the deal", body: "Move the deal through your pipeline, with every email on the lead's timeline." },
      { title: "Convert it", body: "One click turns the won deal into a project. The client and account come with it, and the project keeps a link to the deal." },
      { title: "Deliver and share", body: "Plan the work in list, board, calendar or Gantt views and give the client a portal to follow it." },
    ],
    details: ["The project remembers which deal it came from, so 'what did this client sign for?' has an answer", "Tasks can link to leads, deals and accounts", "Sprints for teams that work in iterations", "Team chat and docs sit in the same workspace"],
    related: ["crm", "projects", "docs"],
    faq: [
      { q: "Does a won deal become a project automatically?", a: "You convert it with one click when you are ready, so a deal marked won by mistake doesn't create a project." },
      { q: "Do I need two products for this?", a: "No. The CRM and Projects are part of the same workspace and are free for up to 5 people." },
    ],
  },
  {
    slug: "client-portal",
    name: "Client portal",
    product: "projects",
    keyword: "client portal software",
    metaTitle: "Client Portal Software for Agencies",
    metaDescription: "Give each client a portal to follow their project's tasks and send requests, with no account to create. Internal files and comments stay private.",
    h1: "A client portal for every project",
    sub: "Clients follow the work themselves instead of asking for a status update. They open a link, see where their project stands and send requests in the same place.",
    steps: [
      { title: "Share the link", body: "Each project can have a portal. Send the private link to your client; they don't need an account." },
      { title: "They see the work", body: "The portal shows the project's tasks in list, board, Gantt and calendar views." },
      { title: "They send requests", body: "Clients log requests in the portal, and your team can turn a request into a task." },
    ],
    details: ["Internal files, comments and team members' details are never shown in the portal", "Only projects you make visible to the workspace can have a portal; team and private projects never do", "Anyone with the link can view it, so share it only with your client", "Requests and tasks stay in the same project"],
    related: ["projects", "crm", "ai-agent"],
    faq: [
      { q: "Do clients need to sign up?", a: "No. They open a private link." },
      { q: "Can clients see our internal comments?", a: "No. The portal shows tasks and requests. Files, comments, activity and team details stay internal." },
      { q: "Can I brand the portal?", a: "Not yet. Custom branding for the portal is not available today." },
    ],
  },
  {
    slug: "lead-management",
    name: "Lead management",
    product: "crm",
    keyword: "lead management software",
    metaTitle: "Lead Management Software for Small Teams",
    metaDescription: "Lead management software that collects leads from your website, AI chats and spreadsheets into one list, spots duplicates and keeps every conversation on one timeline.",
    h1: "Lead management that never loses an enquiry",
    sub: "Leads arrive from your website, your AI Agent, your campaigns and old spreadsheets. Rhinon puts them in one list with an owner, a stage and the full history.",
    steps: [
      { title: "Collect", body: "Import a spreadsheet, point your website forms at the CRM, or let the AI Agent save the visitors it talks to." },
      { title: "Clean up", body: "Duplicates are flagged so a repeat enquiry joins the lead you already have." },
      { title: "Follow up", body: "Assign an owner, move the lifecycle stage and reach out with an approved Outreach draft." },
    ],
    details: ["Every email and activity on one timeline per lead", "Website visit history for leads who came from your campaigns", "Saved views and lists for segments you return to", "Roles decide who can open the CRM"],
    related: ["crm", "ai-agent", "outreach"],
    faq: [
      { q: "Can I import my existing leads?", a: "Yes. Upload a spreadsheet and map its columns." },
      { q: "Do website enquiries arrive by themselves?", a: "Yes. Forms on your site can post straight into the CRM, and the AI Agent saves the visitors it talks to." },
    ],
  },
  {
    slug: "sales-pipeline",
    name: "Sales pipeline",
    product: "crm",
    keyword: "sales pipeline software",
    metaTitle: "Sales Pipeline Software with a Deals Board",
    metaDescription: "Sales pipeline software with a deals board, your own stages, deal values and close dates, lost reasons and reports, connected to projects once a deal is won.",
    h1: "Sales pipeline software that ends in a project, not a spreadsheet",
    sub: "See every deal on a board, move it through your own stages, and when it is won, turn it into the project that delivers it.",
    steps: [
      { title: "Set your stages", body: "Name the stages that match how you sell, from first call to signed." },
      { title: "Work the board", body: "Drag deals between stages. Each one carries its value, expected close date and owner." },
      { title: "Learn from it", body: "Record why deals are lost and read the pipeline reports to see what is moving." },
    ],
    details: ["Deal values in your currency, including ₹", "Lost reasons captured when a deal closes", "Pipeline reports and saved views", "Convert a won deal into a project in one click"],
    related: ["crm", "projects", "outreach"],
    faq: [
      { q: "Can I have different stages for different services?", a: "You set your own pipeline stages to match how you sell." },
      { q: "Does it forecast revenue?", a: "Each deal has a value and expected close date, and reports show the pipeline by stage. Advanced forecasting is not built in." },
    ],
  },
];

export const featureBySlug = (slug: string): Feature | undefined => FEATURES.find((f) => f.slug === slug);
