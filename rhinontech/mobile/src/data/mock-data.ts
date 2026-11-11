import type { Attachment } from "./mock-more";
import type { Tone } from "./tone";

/* ────────────────────────────────────────────────────────────────────────────
 * Dummy data for the prototype. Fictional people and companies, one coherent day:
 * Wednesday 11 November 2026, 9:41 AM, signed in as an engineering lead who also
 * approves things for their team.
 * ──────────────────────────────────────────────────────────────────────────── */

export const TODAY = {
  iso: "2026-11-11",
  label: "Wed 11 Nov",
  year: 2026,
  month: 10,
  day: 11,
} as const;

export const ME = {
  id: "me",
  name: "Kabir Mehra",
  first: "Kabir",
  role: "Engineering Lead",
  dept: "Engineering",
  email: "kabir@rhinontech.in",
  phone: "+91 98765 43210",
  joined: "Mar 2022",
  manager: "Vikram Sethi",
  location: "Pune · Hybrid",
} as const;

/* ── People ──────────────────────────────────────────────────────────────── */

export type Person = {
  id: string;
  name: string;
  role: string;
  dept: string;
  email: string;
  phone: string;
  online: boolean;
  location: string;
};

export const PEOPLE: Person[] = [
  {
    id: "aanya",
    name: "Aanya Rao",
    role: "Product Designer",
    dept: "Design",
    email: "aanya@rhinontech.in",
    phone: "+91 98100 11001",
    online: true,
    location: "Bengaluru",
  },
  {
    id: "dev",
    name: "Dev Malhotra",
    role: "Backend Engineer",
    dept: "Engineering",
    email: "dev@rhinontech.in",
    phone: "+91 98100 11002",
    online: true,
    location: "Pune",
  },
  {
    id: "meera",
    name: "Meera Kapoor",
    role: "HR Partner",
    dept: "People Ops",
    email: "meera@rhinontech.in",
    phone: "+91 98100 11003",
    online: false,
    location: "Mumbai",
  },
  {
    id: "rohan",
    name: "Rohan Iyer",
    role: "Sales Lead",
    dept: "Sales",
    email: "rohan@rhinontech.in",
    phone: "+91 98100 11004",
    online: true,
    location: "Delhi",
  },
  {
    id: "zoya",
    name: "Zoya Khan",
    role: "QA Engineer",
    dept: "Engineering",
    email: "zoya@rhinontech.in",
    phone: "+91 98100 11005",
    online: false,
    location: "Pune",
  },
  {
    id: "vikram",
    name: "Vikram Sethi",
    role: "Head of Engineering",
    dept: "Engineering",
    email: "vikram@rhinontech.in",
    phone: "+91 98100 11006",
    online: false,
    location: "Pune",
  },
  {
    id: "neha",
    name: "Neha Joshi",
    role: "Frontend Engineer",
    dept: "Engineering",
    email: "neha@rhinontech.in",
    phone: "+91 98100 11007",
    online: true,
    location: "Hyderabad",
  },
  {
    id: "arjun",
    name: "Arjun Nair",
    role: "DevOps Engineer",
    dept: "Engineering",
    email: "arjun@rhinontech.in",
    phone: "+91 98100 11008",
    online: false,
    location: "Pune",
  },
  {
    id: "tara",
    name: "Tara Bose",
    role: "Content Lead",
    dept: "Marketing",
    email: "tara@rhinontech.in",
    phone: "+91 98100 11009",
    online: true,
    location: "Kolkata",
  },
  {
    id: "isha",
    name: "Isha Reddy",
    role: "Recruiter",
    dept: "People Ops",
    email: "isha@rhinontech.in",
    phone: "+91 98100 11010",
    online: false,
    location: "Hyderabad",
  },
];

export const nameOf = (id: string): string =>
  id === "me" ? ME.name : (PEOPLE.find((p) => p.id === id)?.name ?? id);

export const personOf = (id: string): Person => PEOPLE.find((p) => p.id === id) ?? PEOPLE[0]!;

/* ── Brands (Inbox, CRM and Outreach are split per brand) ────────────────── */

export type BrandId = "tech" | "labs" | "uppercurve";
export const BRANDS: { id: BrandId; name: string; tone: Tone; domain: string }[] = [
  { id: "tech", name: "Rhinon Tech", tone: "coral", domain: "rhinontech.in" },
  { id: "labs", name: "Rhinon Labs", tone: "cobalt", domain: "rhinonlabs.com" },
  { id: "uppercurve", name: "Uppercurve", tone: "leaf", domain: "uppercurve.in" },
];

/* ── Work ────────────────────────────────────────────────────────────────── */

export type Priority = "High" | "Medium" | "Low";
export type TaskStatus = "Pending" | "In progress" | "Done";
export type DueGroup = "overdue" | "today" | "week" | "later";

export type Subtask = { id: string; title: string; done: boolean };
export type Comment = { id: string; by: string; text: string; at: string };
export type Task = {
  id: string;
  title: string;
  project: string;
  priority: Priority;
  status: TaskStatus;
  due: string;
  group: DueGroup;
  assignee: string;
  est: number;
  description: string;
  subtasks: Subtask[];
  comments: Comment[];
  tags: string[];
};

export type Project = {
  id: string;
  name: string;
  tone: Tone;
  status: "Active" | "Paused" | "Pipeline" | "Completed";
  progress: number;
  members: string[];
  tasks: number;
  due: string;
  contact: string;
};

export const PROJECTS: Project[] = [
  {
    id: "atlas",
    name: "Atlas Billing",
    tone: "cobalt",
    status: "Active",
    progress: 0.72,
    members: ["dev", "neha", "zoya", "arjun"],
    tasks: 38,
    due: "30 Nov",
    contact: "Priya Nambiar",
  },
  {
    id: "portal",
    name: "Client Portal",
    tone: "coral",
    status: "Active",
    progress: 0.48,
    members: ["neha", "aanya", "dev"],
    tasks: 24,
    due: "12 Dec",
    contact: "Sameer Patil",
  },
  {
    id: "mobile",
    name: "Mobile App",
    tone: "leaf",
    status: "Active",
    progress: 0.31,
    members: ["aanya", "neha", "me"],
    tasks: 52,
    due: "20 Jan",
    contact: "Internal",
  },
  {
    id: "site",
    name: "Website Relaunch",
    tone: "sun",
    status: "Paused",
    progress: 0.85,
    members: ["tara", "aanya"],
    tasks: 19,
    due: "TBD",
    contact: "Tanvi Shah",
  },
  {
    id: "onboarding",
    name: "Onboarding Revamp",
    tone: "violet",
    status: "Pipeline",
    progress: 0.08,
    members: ["meera", "isha", "aanya"],
    tasks: 9,
    due: "Q1",
    contact: "Internal",
  },
];

export const projectTone = (name: string): Tone =>
  PROJECTS.find((p) => p.name === name)?.tone ?? "ink";

export const TEAMS: {
  id: string;
  name: string;
  tone: Tone;
  members: string[];
  open: number;
  lead: string;
}[] = [
  {
    id: "eng",
    name: "Engineering",
    tone: "cobalt",
    members: ["dev", "neha", "zoya", "arjun"],
    open: 41,
    lead: "me",
  },
  { id: "design", name: "Design", tone: "violet", members: ["aanya"], open: 12, lead: "aanya" },
  { id: "sales", name: "Sales", tone: "coral", members: ["rohan"], open: 17, lead: "rohan" },
  {
    id: "people",
    name: "People Ops",
    tone: "leaf",
    members: ["meera", "isha"],
    open: 8,
    lead: "meera",
  },
];

export const TASKS: Task[] = [
  {
    id: "t1",
    title: "Fix invoice export timeout on large accounts",
    project: "Atlas Billing",
    priority: "High",
    status: "In progress",
    due: "Overdue · 1 day",
    group: "overdue",
    assignee: "me",
    est: 6,
    description:
      "Exports over 20k rows time out at the gateway. Stream the CSV instead of building it in memory, and add a progress notice for the client.",
    subtasks: [
      { id: "s1", title: "Reproduce with the Bluepine dataset", done: true },
      { id: "s2", title: "Switch to a streamed response", done: true },
      { id: "s3", title: "Add row-count guard and retry", done: true },
      { id: "s4", title: "Load test at 50k rows", done: false },
      { id: "s5", title: "Write release note", done: false },
    ],
    comments: [
      {
        id: "c1",
        by: "zoya",
        text: "Reproduced on staging — it fails at roughly 24k rows every time.",
        at: "Tue, 4:12 PM",
      },
      {
        id: "c2",
        by: "dev",
        text: "Streaming branch is up. @Kabir can you review before standup?",
        at: "Tue, 6:40 PM",
      },
    ],
    tags: ["bug", "client-visible"],
  },
  {
    id: "t2",
    title: "Review Aanya's onboarding flow designs",
    project: "Onboarding Revamp",
    priority: "Medium",
    status: "Pending",
    due: "Today · 4:00 PM",
    group: "today",
    assignee: "me",
    est: 1.5,
    description:
      "Frames are in the shared file. Check the e-sign step and the empty states for documents.",
    subtasks: [
      { id: "s1", title: "Walk through the e-sign step", done: false },
      { id: "s2", title: "Check empty and error states", done: false },
    ],
    comments: [
      {
        id: "c1",
        by: "aanya",
        text: "Sharing the final frames now. The signature pad is the part I'm least sure about.",
        at: "Today, 9:05 AM",
      },
    ],
    tags: ["design-review"],
  },
  {
    id: "t3",
    title: "Ship client portal request form",
    project: "Client Portal",
    priority: "High",
    status: "In progress",
    due: "Today · 6:00 PM",
    group: "today",
    assignee: "me",
    est: 4,
    description:
      "Clients can raise a request from the public project page. It lands in Work as a client request, ready to convert to a task.",
    subtasks: [
      { id: "s1", title: "Form validation and rate limit", done: true },
      { id: "s2", title: "Confirmation email", done: false },
      { id: "s3", title: "QA pass on mobile Safari", done: false },
    ],
    comments: [],
    tags: ["feature"],
  },
  {
    id: "t4",
    title: "Reply to Northwind about the SLA question",
    project: "Atlas Billing",
    priority: "Medium",
    status: "Pending",
    due: "Today · 5:30 PM",
    group: "today",
    assignee: "me",
    est: 0.5,
    description:
      "Priya asked whether the 99.9% target is measured monthly or quarterly. Confirm with Vikram first.",
    subtasks: [],
    comments: [],
    tags: ["client"],
  },
  {
    id: "t5",
    title: "Security patch: bump the pgvector client",
    project: "Atlas Billing",
    priority: "High",
    status: "Done",
    due: "Today · done 9:20 AM",
    group: "today",
    assignee: "me",
    est: 1,
    description: "Patch release fixes a parameter-handling issue. Rolled out to beta, then prod.",
    subtasks: [{ id: "s1", title: "Bump and run the suite", done: true }],
    comments: [],
    tags: ["security"],
  },
  {
    id: "t6",
    title: "Prep the sprint demo",
    project: "Mobile App",
    priority: "Medium",
    status: "Pending",
    due: "Thu 12 Nov",
    group: "week",
    assignee: "me",
    est: 2,
    description: "Three screens, five minutes. Rehearse the clock-in flow on a real device.",
    subtasks: [
      { id: "s1", title: "Pick the three flows", done: true },
      { id: "s2", title: "Record a fallback video", done: false },
    ],
    comments: [],
    tags: ["demo"],
  },
  {
    id: "t7",
    title: "Update API rate-limit docs",
    project: "Website Relaunch",
    priority: "Low",
    status: "Pending",
    due: "Fri 13 Nov",
    group: "week",
    assignee: "me",
    est: 1,
    description: "The limits changed in October. Update the table and the 429 examples.",
    subtasks: [],
    comments: [],
    tags: ["docs"],
  },
  {
    id: "t8",
    title: "Plan Q1 hiring with Meera",
    project: "Onboarding Revamp",
    priority: "Medium",
    status: "Pending",
    due: "Mon 16 Nov",
    group: "later",
    assignee: "me",
    est: 2,
    description: "Two backend roles and one QA. Agree the scorecard and the interview loop.",
    subtasks: [],
    comments: [],
    tags: ["hiring"],
  },
  {
    id: "t9",
    title: "Weekly report to leadership",
    project: "Mobile App",
    priority: "Low",
    status: "Done",
    due: "Today · done 9:02 AM",
    group: "today",
    assignee: "me",
    est: 0.5,
    description: "Sent. Highlights: streaming export, portal form, three patch releases.",
    subtasks: [],
    comments: [],
    tags: ["report"],
  },
];

/* ── Time: attendance and leave ──────────────────────────────────────────── */

export type Mark = "present" | "late" | "absent" | "leave" | "holiday";
/** November 2026, day -> mark. Weekends are derived from the calendar. Day 11 is today. */
export const ATTENDANCE_NOV: Record<number, Mark> = {
  2: "present",
  3: "leave",
  4: "present",
  5: "late",
  6: "present",
  9: "holiday",
  10: "present",
};

export type Regularization = {
  id: string;
  date: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  times: string;
};
export const REGULARIZATIONS: Regularization[] = [
  {
    id: "r1",
    date: "Fri 30 Oct",
    reason: "Forgot to clock out after the client call.",
    status: "Approved",
    times: "09:20 – 18:40",
  },
];

export type LeaveType = {
  id: string;
  name: string;
  short: string;
  total: number;
  used: number;
  pending: number;
  tone: Tone;
};
export const LEAVE_TYPES: LeaveType[] = [
  { id: "casual", name: "Casual", short: "CL", total: 12, used: 5, pending: 2, tone: "sun" },
  { id: "sick", name: "Sick", short: "SL", total: 8, used: 3, pending: 0, tone: "sky" },
  { id: "earned", name: "Earned", short: "EL", total: 18, used: 4, pending: 0, tone: "leaf" },
  { id: "comp", name: "Comp-off", short: "CO", total: 2, used: 1, pending: 0, tone: "violet" },
];

export type LeaveRequest = {
  id: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  note?: string;
};
export const LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "l1",
    type: "Casual",
    from: "2026-11-21",
    to: "2026-11-23",
    days: 1,
    reason: "Cousin's wedding in Jaipur",
    status: "Pending",
  },
  {
    id: "l2",
    type: "Sick",
    from: "2026-11-03",
    to: "2026-11-03",
    days: 1,
    reason: "Fever",
    status: "Approved",
    note: "Get well soon.",
  },
  {
    id: "l3",
    type: "Earned",
    from: "2026-10-12",
    to: "2026-10-14",
    days: 3,
    reason: "Short trip",
    status: "Approved",
  },
  {
    id: "l4",
    type: "Casual",
    from: "2026-09-06",
    to: "2026-09-06",
    days: 1,
    reason: "Personal errand",
    status: "Rejected",
    note: "Release day — please pick another date.",
  },
];

export const WHOS_OFF: { who: string; when: string; kind: string }[] = [
  { who: "zoya", when: "Today", kind: "Sick" },
  { who: "aanya", when: "Thu – Fri", kind: "Casual" },
  { who: "dev", when: "Mon 16", kind: "Sick" },
];

/* ── Approvals (you are a manager) ───────────────────────────────────────── */

export type Approval = {
  id: string;
  kind: "leave" | "attendance" | "reimbursement";
  who: string;
  title: string;
  detail: string;
  when: string;
  amount?: number;
  note?: string;
};
export const APPROVALS: Approval[] = [
  {
    id: "a1",
    kind: "leave",
    who: "aanya",
    title: "Casual leave · 2 days",
    detail: "Thu 12 – Fri 13 Nov",
    when: "2h ago",
    note: "Family function",
  },
  {
    id: "a2",
    kind: "reimbursement",
    who: "rohan",
    title: "Client dinner",
    detail: "Receipt attached · Oct",
    when: "Yesterday",
    amount: 4200,
  },
  {
    id: "a3",
    kind: "attendance",
    who: "zoya",
    title: "Missed clock-out",
    detail: "Mon 9 Nov · left 6:30 PM",
    when: "Yesterday",
    note: "Forgot to punch out after the release call.",
  },
  {
    id: "a4",
    kind: "leave",
    who: "dev",
    title: "Sick leave · 1 day",
    detail: "Mon 16 Nov",
    when: "Yesterday",
    note: "Dental appointment",
  },
  {
    id: "a5",
    kind: "reimbursement",
    who: "neha",
    title: "Cab to client site",
    detail: "Receipt attached · Nov",
    when: "2 days ago",
    amount: 980,
  },
];

/* ── Inbox ───────────────────────────────────────────────────────────────── */

export type Message = {
  id: string;
  from: string;
  email: string;
  at: string;
  body: string;
  mine?: boolean;
};
export type Thread = {
  id: string;
  brand: BrandId;
  folder: "inbox" | "sent" | "archive";
  starred: boolean;
  unread: boolean;
  subject: string;
  labels: { text: string; tone: Tone }[];
  attachment: boolean;
  files?: Attachment[] | undefined;
  day: string;
  time: string;
  messages: Message[];
  copilot?: string;
};

export const THREADS: Thread[] = [
  {
    id: "th1",
    brand: "tech",
    folder: "inbox",
    starred: false,
    unread: true,
    subject: "Re: Atlas pricing for 40 seats",
    labels: [{ text: "Lead reply", tone: "coral" }],
    attachment: false,
    day: "Today",
    time: "9:32 AM",
    messages: [
      {
        id: "m1",
        from: "Rohan Iyer",
        email: "rohan@rhinontech.in",
        at: "Mon, 4:10 PM",
        mine: false,
        body: "Hi Priya,\n\nThanks for the walkthrough on Friday. Attached is the pricing for 40 seats on the annual plan, with the onboarding support we discussed.\n\nHappy to adjust the seat count if your team grows.\n\nRohan",
      },
      {
        id: "m2",
        from: "Priya Nambiar",
        email: "priya@northwind.example",
        at: "Today, 9:32 AM",
        body: "Thanks for the walkthrough. Could you share the annual figure with and without the SLA add-on?\n\nOur finance team closes the quarter on the 28th, so a quick turnaround helps.\n\nAlso — is the 99.9% uptime target measured monthly or quarterly?\n\nPriya",
      },
    ],
    copilot:
      "Hi Priya — happy to. Annual with the SLA add-on is ₹21.6L; without it, ₹18.4L. The 99.9% target is measured monthly. I'll send a one-page summary by end of day so finance can close on the 28th.",
  },
  {
    id: "th2",
    brand: "tech",
    folder: "inbox",
    starred: false,
    unread: true,
    subject: "Invoice export failing on large accounts",
    labels: [{ text: "Support", tone: "sky" }],
    attachment: true,
    day: "Today",
    time: "8:57 AM",
    messages: [
      {
        id: "m1",
        from: "Sameer Patil",
        email: "sameer@bluepine.example",
        at: "Today, 8:57 AM",
        body: "Hello team,\n\nSince Monday our finance users can't export invoices for the full quarter — it spins for a minute and then shows a gateway error. Smaller date ranges work.\n\nScreenshot attached. This is blocking our month-end close.\n\nSameer",
      },
    ],
    copilot:
      "Hi Sameer — thanks for the screenshot. We've reproduced this and a fix is in review today. Until it ships, exporting in two-month ranges will work. I'll confirm here as soon as it's live.",
  },
  {
    id: "th3",
    brand: "tech",
    folder: "inbox",
    starred: true,
    unread: true,
    subject: "Offer letter — please review and sign",
    labels: [{ text: "HR", tone: "leaf" }],
    attachment: true,
    day: "Tue",
    time: "5:14 PM",
    messages: [
      {
        id: "m1",
        from: "Meera Kapoor",
        email: "meera@rhinontech.in",
        at: "Tue, 5:14 PM",
        body: "Hi Kabir,\n\nThe offer letter for the backend role is ready for your review. Once you're happy with the compensation band, I'll send it for e-signature.\n\nCould you confirm by Friday?\n\nMeera",
      },
    ],
  },
  {
    id: "th4",
    brand: "tech",
    folder: "inbox",
    starred: true,
    unread: false,
    subject: "Demo recording and next steps",
    labels: [{ text: "Sales", tone: "violet" }],
    attachment: true,
    day: "Tue",
    time: "11:02 AM",
    messages: [
      {
        id: "m1",
        from: "Rohan Iyer",
        email: "rohan@rhinontech.in",
        at: "Tue, 11:02 AM",
        body: "Recording of the Northwind demo is attached. Priya liked the approvals view and asked about SSO. Can we have a one-pager on that by Friday?",
      },
    ],
  },
  {
    id: "th5",
    brand: "tech",
    folder: "inbox",
    starred: false,
    unread: false,
    subject: "Intro: Kestrel Health <> Rhinon",
    labels: [{ text: "Lead reply", tone: "coral" }],
    attachment: false,
    day: "Sun",
    time: "6:40 PM",
    messages: [
      {
        id: "m1",
        from: "Tanvi Shah",
        email: "tanvi@kestrel.example",
        at: "Sun, 6:40 PM",
        body: "Hi Kabir, Rohan suggested we talk. We run clinics in four cities and our scheduling tools don't talk to each other. Do you have time next week for a 20-minute call?",
      },
    ],
  },
  {
    id: "th6",
    brand: "tech",
    folder: "inbox",
    starred: false,
    unread: false,
    subject: "Your weekly Rhinon digest",
    labels: [],
    attachment: false,
    day: "Today",
    time: "7:00 AM",
    messages: [
      {
        id: "m1",
        from: "Rhinon Digest",
        email: "digest@rhinontech.in",
        at: "Today, 7:00 AM",
        body: "This week: 14 tasks closed, 3 releases shipped, 2 client requests converted to tasks. Top contributor: Dev Malhotra.",
      },
    ],
  },
  {
    id: "th7",
    brand: "tech",
    folder: "sent",
    starred: false,
    unread: false,
    subject: "Re: Security patch rollout window",
    labels: [],
    attachment: false,
    day: "Mon",
    time: "3:20 PM",
    messages: [
      {
        id: "m1",
        from: "Kabir Mehra",
        email: "kabir@rhinontech.in",
        at: "Mon, 3:20 PM",
        mine: true,
        body: "Window is Tuesday 11 PM IST. Arjun will run the rollout, Zoya will smoke-test. I'll be on call.",
      },
    ],
  },
  {
    id: "th8",
    brand: "tech",
    folder: "archive",
    starred: false,
    unread: false,
    subject: "Domain DNS verified",
    labels: [],
    attachment: false,
    day: "Mon",
    time: "10:12 AM",
    messages: [
      {
        id: "m1",
        from: "AWS Notifications",
        email: "no-reply@aws.example",
        at: "Mon, 10:12 AM",
        body: "Your domain rhinontech.in has been verified for sending. DKIM status: successful.",
      },
    ],
  },
  {
    id: "th9",
    brand: "labs",
    folder: "inbox",
    starred: false,
    unread: true,
    subject: "Case study quote — approval needed",
    labels: [{ text: "Content", tone: "cobalt" }],
    attachment: false,
    day: "Today",
    time: "8:10 AM",
    messages: [
      {
        id: "m1",
        from: "Tara Bose",
        email: "tara@rhinontech.in",
        at: "Today, 8:10 AM",
        body: "The Harbor & Co case study is ready. We need your approval on the quote in paragraph three before it goes live.",
      },
    ],
  },
  {
    id: "th10",
    brand: "uppercurve",
    folder: "inbox",
    starred: false,
    unread: true,
    subject: "New startup idea submitted: PetPass",
    labels: [{ text: "Idea", tone: "sun" }],
    attachment: false,
    day: "Tue",
    time: "9:45 PM",
    messages: [
      {
        id: "m1",
        from: "Uppercurve Forms",
        email: "forms@uppercurve.in",
        at: "Tue, 9:45 PM",
        body: "A founder submitted an idea through the /build campaign: PetPass — a shared health record for pet owners and vets. Stays out of the CRM until converted.",
      },
    ],
  },
];

/* ── Chat ────────────────────────────────────────────────────────────────── */

export type ChatMsg = {
  id: string;
  from: string;
  text: string;
  at: string;
  attachment?: Attachment | undefined;
};
export type Chat = {
  id: string;
  kind: "dm" | "channel" | "group";
  name: string;
  tone: Tone;
  members: string[];
  unread: number;
  time: string;
  pinned: boolean;
  messages: ChatMsg[];
};

export const CHATS: Chat[] = [
  {
    id: "c1",
    kind: "channel",
    name: "engineering",
    tone: "cobalt",
    members: ["dev", "neha", "zoya", "arjun"],
    unread: 3,
    time: "9:38",
    pinned: true,
    messages: [
      {
        id: "1",
        from: "arjun",
        text: "Beta deploy is green ✅ — schema sync was additive only.",
        at: "9:12",
      },
      {
        id: "2",
        from: "zoya",
        text: "Smoke tests pass. Export looks good on 30k rows.",
        at: "9:20",
      },
      {
        id: "3",
        from: "dev",
        text: "Nice. Streaming branch is ready for review whenever you are @Kabir",
        at: "9:31",
      },
      {
        id: "4",
        from: "neha",
        text: "Portal form is on staging too, try it on your phone 📱",
        at: "9:38",
      },
    ],
  },
  {
    id: "c2",
    kind: "dm",
    name: "Aanya Rao",
    tone: "violet",
    members: ["aanya"],
    unread: 1,
    time: "9:05",
    pinned: false,
    messages: [
      {
        id: "1",
        from: "aanya",
        text: "Morning! Sharing the final onboarding frames now.",
        at: "9:04",
      },
      {
        id: "2",
        from: "aanya",
        text: "The signature pad is the part I'm least sure about — would love your take.",
        at: "9:05",
      },
    ],
  },
  {
    id: "c3",
    kind: "channel",
    name: "sales-wins",
    tone: "coral",
    members: ["rohan", "tara"],
    unread: 0,
    time: "Tue",
    pinned: false,
    messages: [
      { id: "1", from: "rohan", text: "Harbor & Co signed the annual plan 🎉", at: "Tue 4:40" },
      { id: "2", from: "tara", text: "Case study goes live this week!", at: "Tue 4:52" },
      {
        id: "3",
        from: "me",
        text: "Great work, both. Let's get their logo on the site.",
        at: "Tue 5:01",
      },
    ],
  },
  {
    id: "c4",
    kind: "dm",
    name: "Meera Kapoor",
    tone: "leaf",
    members: ["meera"],
    unread: 0,
    time: "Tue",
    pinned: false,
    messages: [
      {
        id: "1",
        from: "meera",
        text: "Offer letters for the backend role go out Friday.",
        at: "Tue 5:20",
      },
      { id: "2", from: "me", text: "Perfect — I'll confirm the band today.", at: "Tue 5:42" },
    ],
  },
  {
    id: "c5",
    kind: "group",
    name: "Design crit",
    tone: "rose",
    members: ["aanya", "zoya", "neha"],
    unread: 0,
    time: "Mon",
    pinned: false,
    messages: [
      { id: "1", from: "zoya", text: "Can we move crit to 4 PM tomorrow?", at: "Mon 2:10" },
      { id: "2", from: "aanya", text: "Works for me 👍", at: "Mon 2:14" },
    ],
  },
  {
    id: "c6",
    kind: "dm",
    name: "Dev Malhotra",
    tone: "sky",
    members: ["dev"],
    unread: 0,
    time: "Mon",
    pinned: false,
    messages: [
      { id: "1", from: "dev", text: "Pushed the fix, can you review?", at: "Mon 6:02" },
      { id: "2", from: "me", text: "On it after standup.", at: "Mon 6:10" },
    ],
  },
];

/* ── Pay ─────────────────────────────────────────────────────────────────── */

export type PayLine = { label: string; amount: number };
export type Payslip = {
  id: string;
  month: string;
  short: string;
  paidOn: string;
  earnings: PayLine[];
  deductions: PayLine[];
};

const BASE_EARNINGS: PayLine[] = [
  { label: "Basic", amount: 72500 },
  { label: "House rent allowance", amount: 36250 },
  { label: "Travel allowance", amount: 12000 },
  { label: "Medical allowance", amount: 1250 },
  { label: "Special allowance", amount: 23000 },
];

function slip(
  id: string,
  month: string,
  short: string,
  paidOn: string,
  extraEarn: PayLine[] = [],
  tds = 11820,
): Payslip {
  return {
    id,
    month,
    short,
    paidOn,
    earnings: [...BASE_EARNINGS, ...extraEarn],
    deductions: [
      { label: "Provident fund", amount: 8700 },
      { label: "Professional tax", amount: 200 },
      { label: "Income tax (TDS)", amount: tds },
    ],
  };
}

export const PAYSLIPS: Payslip[] = [
  slip("oct-2026", "October 2026", "Oct", "31 Oct 2026"),
  slip("sep-2026", "September 2026", "Sep", "30 Sep 2026", [
    { label: "Reimbursements", amount: 3420 },
  ]),
  slip("aug-2026", "August 2026", "Aug", "31 Aug 2026"),
  slip("jul-2026", "July 2026", "Jul", "31 Jul 2026"),
  slip("jun-2026", "June 2026", "Jun", "30 Jun 2026"),
  slip("may-2026", "May 2026", "May", "31 May 2026"),
  slip("apr-2026", "April 2026", "Apr", "30 Apr 2026"),
  slip(
    "mar-2026",
    "March 2026",
    "Mar",
    "31 Mar 2026",
    [{ label: "Performance bonus", amount: 60000 }],
    20820,
  ),
  slip("feb-2026", "February 2026", "Feb", "28 Feb 2026"),
  slip("jan-2026", "January 2026", "Jan", "31 Jan 2026"),
  slip("dec-2025", "December 2025", "Dec", "31 Dec 2025"),
  slip("nov-2025", "November 2025", "Nov", "30 Nov 2025"),
];

export const gross = (p: Payslip) => p.earnings.reduce((s, l) => s + l.amount, 0);
export const deducted = (p: Payslip) => p.deductions.reduce((s, l) => s + l.amount, 0);
export const net = (p: Payslip) => gross(p) - deducted(p);

export type Claim = {
  id: string;
  title: string;
  category: string;
  amount: number;
  month: string;
  status: "Pending" | "Approved" | "Rejected" | "Paid";
  payout: "With payslip" | "Direct";
  note?: string;
};
export const CLAIMS: Claim[] = [
  {
    id: "cl1",
    title: "Cab to client site",
    category: "Travel",
    amount: 640,
    month: "Nov 2026",
    status: "Pending",
    payout: "With payslip",
  },
  {
    id: "cl2",
    title: "Client lunch — Pune",
    category: "Meals",
    amount: 1850,
    month: "Oct 2026",
    status: "Approved",
    payout: "With payslip",
  },
  {
    id: "cl3",
    title: "Conference pass",
    category: "Learning",
    amount: 12000,
    month: "Sep 2026",
    status: "Paid",
    payout: "Direct",
  },
  {
    id: "cl4",
    title: "Home-office monitor",
    category: "Equipment",
    amount: 9500,
    month: "Aug 2026",
    status: "Rejected",
    payout: "With payslip",
    note: "Needs an invoice with the company GSTIN.",
  },
];

export const SALARY_STRUCTURE = {
  annual: 1740000,
  variable: "10% variable, paid quarterly",
  bank: "HDFC Bank ••4821",
  pan: "ABCPM••••Q",
  uan: "1012 •••• 4471",
};

/* ── CRM ─────────────────────────────────────────────────────────────────── */

export const STAGES: { id: string; name: string; tone: Tone }[] = [
  { id: "lead", name: "Lead", tone: "sky" },
  { id: "qualified", name: "Qualified", tone: "sun" },
  { id: "proposal", name: "Proposal", tone: "cobalt" },
  { id: "negotiation", name: "Negotiation", tone: "violet" },
  { id: "won", name: "Won", tone: "leaf" },
];

export type Deal = {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: string;
  owner: string;
  close: string;
  contact: string;
  note: string;
};
export const DEALS: Deal[] = [
  {
    id: "d1",
    title: "Atlas — 40 seats",
    company: "Northwind Logistics",
    value: 1840000,
    stage: "proposal",
    owner: "rohan",
    close: "28 Nov",
    contact: "Priya Nambiar",
    note: "Wants SLA add-on priced separately. Finance closes the quarter on the 28th.",
  },
  {
    id: "d2",
    title: "Portal pilot",
    company: "Bluepine Retail",
    value: 620000,
    stage: "qualified",
    owner: "rohan",
    close: "15 Dec",
    contact: "Sameer Patil",
    note: "Export bug is blocking month-end. Fix first, then talk expansion.",
  },
  {
    id: "d3",
    title: "Scheduling suite",
    company: "Kestrel Health",
    value: 2400000,
    stage: "negotiation",
    owner: "rohan",
    close: "05 Dec",
    contact: "Tanvi Shah",
    note: "Four clinics. Asked for SSO and an on-prem data option.",
  },
  {
    id: "d4",
    title: "Starter plan",
    company: "Orbit Foods",
    value: 310000,
    stage: "lead",
    owner: "rohan",
    close: "30 Dec",
    contact: "Nikhil Rao",
    note: "Inbound from the website chat. Needs a demo.",
  },
  {
    id: "d5",
    title: "Studio workspace",
    company: "Lumen Studios",
    value: 980000,
    stage: "proposal",
    owner: "rohan",
    close: "20 Nov",
    contact: "Ira Dsouza",
    note: "Proposal sent Monday. Follow up Thursday.",
  },
  {
    id: "d6",
    title: "Annual plan",
    company: "Harbor & Co",
    value: 1200000,
    stage: "won",
    owner: "rohan",
    close: "Signed Tue",
    contact: "Manav Gill",
    note: "Signed Tuesday. Case study in progress.",
  },
];

export type Lead = {
  id: string;
  name: string;
  company: string;
  title: string;
  status: "New" | "Contacted" | "Interested" | "Replied";
  source: string;
  last: string;
};
export const LEADS: Lead[] = [
  {
    id: "ld1",
    name: "Priya Nambiar",
    company: "Northwind Logistics",
    title: "VP Operations",
    status: "Replied",
    source: "Outreach",
    last: "Replied today",
  },
  {
    id: "ld2",
    name: "Tanvi Shah",
    company: "Kestrel Health",
    title: "COO",
    status: "Interested",
    source: "Referral",
    last: "Call booked",
  },
  {
    id: "ld3",
    name: "Nikhil Rao",
    company: "Orbit Foods",
    title: "Head of Ops",
    status: "New",
    source: "Website chat",
    last: "Yesterday",
  },
  {
    id: "ld4",
    name: "Ira Dsouza",
    company: "Lumen Studios",
    title: "Founder",
    status: "Contacted",
    source: "Outreach",
    last: "2 days ago",
  },
  {
    id: "ld5",
    name: "Manav Gill",
    company: "Harbor & Co",
    title: "CEO",
    status: "Interested",
    source: "Event",
    last: "Won",
  },
];

/* ── Notifications, meetings ─────────────────────────────────────────────── */

export type Notif = {
  id: string;
  kind: "task" | "leave" | "chat" | "inbox" | "pay" | "approval";
  title: string;
  body: string;
  time: string;
  unread: boolean;
  to: string;
  group: "Today" | "Earlier";
};
export const NOTIFS: Notif[] = [
  {
    id: "n1",
    kind: "task",
    title: "Aanya assigned you a task",
    body: "Review onboarding flow designs · due today 4 PM",
    time: "8:50 AM",
    unread: true,
    to: "/work/t2",
    group: "Today",
  },
  {
    id: "n2",
    kind: "task",
    title: "Task overdue",
    body: "Fix invoice export timeout on large accounts",
    time: "8:00 AM",
    unread: true,
    to: "/work/t1",
    group: "Today",
  },
  {
    id: "n3",
    kind: "chat",
    title: "Dev mentioned you in #engineering",
    body: "“Streaming branch is ready for review whenever you are @Kabir”",
    time: "9:31 AM",
    unread: true,
    to: "/chat/c1",
    group: "Today",
  },
  {
    id: "n4",
    kind: "approval",
    title: "5 approvals are waiting",
    body: "2 leave, 1 attendance, 2 reimbursements",
    time: "7:15 AM",
    unread: true,
    to: "/approvals",
    group: "Today",
  },
  {
    id: "n5",
    kind: "inbox",
    title: "Priya Nambiar replied",
    body: "Re: Atlas pricing for 40 seats",
    time: "9:32 AM",
    unread: false,
    to: "/inbox/th1",
    group: "Today",
  },
  {
    id: "n6",
    kind: "leave",
    title: "Your leave request is pending",
    body: "21 Nov · Casual · with Vikram Sethi",
    time: "Tue",
    unread: false,
    to: "/leave",
    group: "Earlier",
  },
  {
    id: "n7",
    kind: "pay",
    title: "October payslip is ready",
    body: "Paid on 31 Oct",
    time: "31 Oct",
    unread: false,
    to: "/pay/oct-2026",
    group: "Earlier",
  },
];

export type Meeting = {
  id: string;
  title: string;
  start: string;
  end: string;
  day: "Today" | "Tomorrow";
  kind: "internal" | "client";
  where: string;
  people: string[];
  state: "next" | "later";
};
export const MEETINGS: Meeting[] = [
  {
    id: "mt1",
    title: "Daily standup",
    start: "10:00",
    end: "10:20",
    day: "Today",
    kind: "internal",
    where: "Google Meet",
    people: ["dev", "neha", "zoya", "arjun"],
    state: "next",
  },
  {
    id: "mt2",
    title: "Sprint planning",
    start: "11:30",
    end: "12:15",
    day: "Today",
    kind: "internal",
    where: "Google Meet",
    people: ["dev", "neha", "aanya"],
    state: "later",
  },
  {
    id: "mt3",
    title: "Northwind walkthrough",
    start: "14:00",
    end: "14:45",
    day: "Today",
    kind: "client",
    where: "Google Meet",
    people: ["rohan"],
    state: "later",
  },
  {
    id: "mt4",
    title: "1:1 with Aanya",
    start: "16:00",
    end: "16:30",
    day: "Today",
    kind: "internal",
    where: "Room 3",
    people: ["aanya"],
    state: "later",
  },
  {
    id: "mt5",
    title: "Design crit",
    start: "16:00",
    end: "17:00",
    day: "Tomorrow",
    kind: "internal",
    where: "Google Meet",
    people: ["aanya", "zoya", "neha"],
    state: "later",
  },
  {
    id: "mt6",
    title: "Hiring sync",
    start: "15:00",
    end: "15:30",
    day: "Tomorrow",
    kind: "internal",
    where: "Room 1",
    people: ["meera", "isha"],
    state: "later",
  },
];

export const CELEBRATIONS: { who: string; what: string; tone: Tone }[] = [
  { who: "meera", what: "Birthday today", tone: "rose" },
  { who: "dev", what: "3 years at Rhinon", tone: "sun" },
  { who: "isha", what: "Joined this week", tone: "leaf" },
];
