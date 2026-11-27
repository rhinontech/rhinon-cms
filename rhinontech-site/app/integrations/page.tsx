import Link from "next/link";
import { Bot, CalendarDays, FileSignature, Mail, Send, Zap, type LucideIcon } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { Aurora, Button, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { CtaBand, Faq } from "@/components/blocks";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd } from "@/components/schema";

/** Jobs other CRMs hand to an add-on, which Rhinon does itself. Each links to the product that does it. */
const BUILT_IN = [
  { job: "Website chatbot", usual: "A separate chatbot tool connected to the CRM", here: "The AI Agent writes leads straight into the CRM", href: "/product/ai-agent" },
  { job: "Cold email sequences", usual: "A sales-engagement add-on", here: "Outreach, with AI drafts you approve", href: "/product/outreach" },
  { job: "Project delivery", usual: "A project tool synced with the CRM", here: "Convert a won deal into a project in one click", href: "/features/crm-with-project-management" },
  { job: "Client updates", usual: "A client-portal app", here: "A portal per project, by private link", href: "/features/client-portal" },
  { job: "Team chat and calls", usual: "A chat app plus a video app", here: "Channels, threads and calls of up to 8 people", href: "/product/chat" },
  { job: "Meeting booking", usual: "A scheduling link tool", here: "Share availability and let people book a time", href: "/product/chat" },
  { job: "E-signatures", usual: "An e-sign service", here: "Offer letters and NDAs signed in the app", href: "/product/hr" },
  { job: "Leave and payslips", usual: "An HR and payroll tool", here: "Attendance, leave and payroll, included", href: "/product/attendance" },
];

const FAQ = [
  { q: "How do I add the AI Agent to my website?", a: "Paste one line of code before your site's closing body tag. The same line adds visitor analytics." },
  { q: "Can I send email from my own address?", a: "Yes. Connect your mailbox to reply from your own address, and connect your domain on the Starter plan to send campaigns from it." },
  { q: "Is there an integration you do not have?", a: "Probably: our list is short because most jobs are built in. Tell us what you need; Rhinon Labs also builds custom integrations." },
  { q: "Do integrations cost extra?", a: "No. Connecting your mailbox, calendar and website is part of every plan." },
];

export const metadata = pageMeta({
  title: "Integrations",
  description: "Connect your mailbox, calendar, LinkedIn, Slack, GitHub and website. Everything else lives in one place.",
  path: "/integrations",
});

const ITEMS: { name: string; body: string; icon: LucideIcon; tone: [string, string] }[] = [
  { name: "Gmail & Outlook", body: "Send campaigns and replies from your own mailbox.", icon: Mail, tone: ["#ff5fb0", "#ff8a4c"] },
  { name: "Google Calendar", body: "Meetings and interviews land on your calendar.", icon: CalendarDays, tone: ["#2cd3ff", "#2f5bff"] },
  { name: "LinkedIn", body: "Plan and publish posts with AI help.", icon: Send, tone: ["#2f5bff", "#7c5cff"] },
  { name: "Slack & GitHub", body: "New teammates get access on their first day.", icon: Zap, tone: ["#7c5cff", "#e04dd6"] },
  { name: "Your website", body: "One line of code adds the chatbot and visitor analytics.", icon: Bot, tone: ["#ff8a4c", "#ffb547"] },
  { name: "E-signatures", body: "Offer letters and NDAs signed inside the app.", icon: FileSignature, tone: ["#10c98f", "#2cd3ff"] },
];

export default function IntegrationsPage() {
  return (
    <>
      <section className="relative pb-24 pt-16 sm:pt-24">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <Reveal>
            <SectionHead as="h1" eyebrow="Integrations" title={<>Works with the tools <span className="text-aurora">you already use.</span></>} sub="Connect your mailbox, calendar and website. Everything else lives in one place." />
          </Reveal>
          <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ITEMS.map(({ name, body, icon: Icon, tone }, i) => (
              <Reveal key={name} delay={(i % 3) * 90}>
                <Spot className="h-full p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ background: `linear-gradient(140deg, ${tone[0]}, ${tone[1]})`, boxShadow: `0 12px 26px -12px ${tone[0]}` }}><Icon className="h-6 w-6" /></span>
                  <p className="font-display mt-6 text-[24px] font-semibold">{name}</p>
                  <p className="mt-2 text-[15.5px] leading-7 text-ink-soft">{body}</p>
                </Spot>
              </Reveal>
            ))}
          </div>
          <Reveal delay={100}>
            <p className="mt-12 text-[15px] text-muted">Need something that is not here? <Link href="/contact" className="font-medium text-ink underline underline-offset-4">Tell us</Link>. We build custom integrations at Rhinon Labs.</p>
          </Reveal>
        </div>
      </section>
      <section className="border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto max-w-[1100px] px-5">
          <Reveal><SectionHead eyebrow="Built in" title="Fewer integrations, because fewer tools." sub="These are jobs most CRMs hand to another app. In Rhinon they are part of the workspace, so there is nothing to connect or keep in sync." /></Reveal>
          <Spot className="mt-12 overflow-x-auto !rounded-3xl">
            <table className="w-full min-w-[680px] text-left text-[15px]">
              <caption className="sr-only">Jobs built into Rhinon Tech</caption>
              <thead className="bg-soft text-[12px] font-semibold uppercase tracking-wider text-muted"><tr><th scope="col" className="px-5 py-3">Job</th><th scope="col" className="px-5 py-3">Usually needs</th><th scope="col" className="px-5 py-3">In Rhinon Tech</th></tr></thead>
              <tbody>
                {BUILT_IN.map((b) => (
                  <tr key={b.job} className="border-t border-line align-top">
                    <th scope="row" className="px-5 py-4 font-medium">{b.job}</th>
                    <td className="px-5 py-4 text-ink-soft">{b.usual}</td>
                    <td className="px-5 py-4"><Link href={b.href} className="font-medium underline-offset-4 hover:underline">{b.here}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Spot>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="FAQ" title="Integration questions." />
          <div className="mt-12"><Faq items={FAQ} /></div>
        </div>
      </section>

      <CtaBand title={<>Connect it all, <span className="text-aurora-soft">free.</span></>} sub="Set up your workspace in a few minutes and invite up to 5 people free." primary={{ label: "Get started free", href: links.signup }} secondary={{ label: "See all products", href: "/product" }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Integrations", path: "/integrations" }]), faqNode(FAQ)])} />
    </>
  );
}
