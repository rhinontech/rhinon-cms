import Link from "next/link";
import { links, pageMeta } from "@/components/site";
import { Aurora, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { CtaBand } from "@/components/blocks";
import { JsonLd, breadcrumbNode, graphJsonLd } from "@/components/schema";

/*
 * Customer-facing changes only, newest first. Add an entry when a change is LIVE in production,
 * not when it is merged; platform-only tools (deploys, GitHub, Content, Lead Finder) never appear.
 */

export const metadata = pageMeta({
  title: "Changelog",
  description: "What's new in Rhinon Tech: recent releases across the AI Agent, CRM, Outreach, Projects, team chat and HR.",
  path: "/changelog",
});

type Entry = { product: string; slug?: string; title: string; body: string };

const MONTHS: { month: string; entries: Entry[] }[] = [
  {
    month: "November 2026",
    entries: [
      { product: "Projects", slug: "projects", title: "Sprints", body: "Plan work in sprints alongside the list, board, calendar and Gantt views." },
      { product: "Projects", slug: "projects", title: "Board columns you control", body: "Add, rename and remove board columns to match how your team works." },
      { product: "Chat & Meetings", slug: "chat", title: "Video calls", body: "Group calls in team chat now support video as well as voice." },
      { product: "Chat & Meetings", slug: "chat", title: "Calendar and meeting links", body: "A built-in calendar, with meeting links in your invites." },
      { product: "Workspace", title: "Real-time notifications", body: "Notifications arrive in the app as they happen." },
    ],
  },
  {
    month: "October 2026",
    entries: [
      { product: "AI Agent", slug: "ai-agent", title: "The AI Agent for your website", body: "Train it on your site, files and help articles. It answers visitors, saves leads to the CRM and hands over to your team live, with tickets, a help center and pop-up campaigns." },
      { product: "AI Agent", slug: "ai-agent", title: "Call a visitor from the dashboard", body: "Your team can start a voice call with a website visitor from the live chat." },
      { product: "Chat & Meetings", slug: "chat", title: "Team chat", body: "Direct messages, groups, channels and threads, with group calls." },
      { product: "Outreach", slug: "outreach", title: "Visits from campaign links", body: "See when a lead clicks through from a personalised campaign link and what they looked at." },
      { product: "Inbox", slug: "inbox", title: "Reply from your own mailbox", body: "Connect your mailbox and send replies from your own address." },
      { product: "HR", slug: "hr", title: "Hiring", body: "Job openings, candidates and interviews, next to employee records." },
      { product: "HR", slug: "hr", title: "Salary revisions and promotion letters", body: "Record a revision and generate the letter in one step." },
      { product: "Payroll", slug: "payroll", title: "Reimbursements on payslips", body: "Employees submit claims; approved amounts are added to the next payslip." },
      { product: "Workspace", title: "Two-factor sign-in and an audit log", body: "Turn on two-factor authentication for your account, and see who changed what in the workspace audit log." },
      { product: "Workspace", title: "Export or delete your data", body: "Download your workspace's data, or delete the workspace, from Settings." },
      { product: "Inbox", slug: "inbox", title: "Send from your own domain", body: "Connect your company's email domain and send from your own addresses." },
    ],
  },
  {
    month: "September 2026",
    entries: [
      { product: "Workspace", title: "Self-serve sign-up", body: "Anyone can create a Rhinon Tech workspace and invite their team, with each workspace kept separate from every other." },
      { product: "Workspace", title: "Roles and permissions", body: "Choose what each role can view or change, product by product, enforced on the server." },
      { product: "Outreach", slug: "outreach", title: "Live send console", body: "Watch a campaign send in real time, with each email's status as it goes out." },
    ],
  },
  {
    month: "August 2026",
    entries: [
      { product: "CRM", slug: "crm", title: "Deals, pipelines and reports", body: "Accounts, deals and your own pipeline stages on a board, with a deal drawer and CRM reports." },
      { product: "CRM", slug: "crm", title: "Duplicate leads, found and merged", body: "Repeat enquiries are flagged and can be merged into the lead you already have." },
      { product: "CRM", slug: "crm", title: "Turn leads into deals in bulk", body: "Select several leads and convert them into deals in one step." },
      { product: "Outreach", slug: "outreach", title: "Sequence stats and open tracking", body: "See how each sequence performs, including which emails were opened." },
      { product: "Projects", slug: "projects", title: "Teams and task tools", body: "Group people into teams, and plan tasks with due dates, a toolbar and workflows." },
      { product: "Chat & Meetings", slug: "chat", title: "Meeting scheduling", body: "Share your availability and let people book a time, with calendar invites by email." },
      { product: "Docs", slug: "docs", title: "File attachments", body: "Attach files to a doc, with inline previews for images." },
    ],
  },
  {
    month: "July 2026",
    entries: [
      { product: "Outreach", slug: "outreach", title: "AI-drafted campaign emails", body: "Outreach researches each lead and drafts a personal email for you to approve." },
      { product: "CRM", slug: "crm", title: "Import leads from a spreadsheet", body: "Upload a CSV and map its columns to bring your leads in." },
      { product: "HR", slug: "hr", title: "E-signed offer letters and NDAs", body: "Candidates sign with a typed or drawn signature, with no account needed." },
      { product: "HR", slug: "hr", title: "Letter templates with AI rewrite", body: "Edit offer letter and NDA templates, and ask AI to rewrite a selected sentence." },
      { product: "Attendance & Leave", slug: "attendance", title: "Breaks", body: "Record breaks during the working day alongside clock-ins." },
      { product: "Docs", slug: "docs", title: "Sharing", body: "Choose who in the workspace can open each doc." },
      { product: "Payroll", slug: "payroll", title: "Final settlement for leavers", body: "Run a final settlement payslip when someone leaves, with an email to them." },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <>
      <section className="relative pb-16 pt-16 sm:pt-24">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <SectionHead as="h1" eyebrow="Changelog" title={<>What&apos;s new in <span className="text-aurora">Rhinon Tech.</span></>} sub="Changes you can use today, newest first." />
        </div>
      </section>
      <section className="border-t border-line py-16 sm:py-20">
        <div className="mx-auto max-w-[900px] space-y-16 px-5">
          {MONTHS.map((m) => (
            <Reveal key={m.month}>
              <div>
                <h2 className="font-display text-[30px] font-semibold">{m.month}</h2>
                <ul className="mt-6 space-y-3">
                  {m.entries.map((e) => (
                    <li key={e.title} className="rounded-2xl border border-line bg-white p-6">
                      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                        {e.slug ? <Link href={`/product/${e.slug}`} className="hover:text-ink">{e.product}</Link> : e.product}
                      </p>
                      <p className="font-display mt-2 text-[20px] font-semibold">{e.title}</p>
                      <p className="mt-1.5 text-[15px] leading-7 text-ink-soft">{e.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand title={<>Try the latest <span className="text-aurora-soft">for free.</span></>} sub="Set up a workspace in a few minutes and invite up to 5 people free." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "Book a demo", href: links.call }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Changelog", path: "/changelog" }])])} />
    </>
  );
}
