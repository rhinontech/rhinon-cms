import { Bot, Cloud, Download, FileLock2, Gauge, History, KeyRound, Lock, Mail, ShieldCheck, Smartphone, UsersRound, type LucideIcon } from "lucide-react";
import { JsonLd, breadcrumbNode, faqNode, graphJsonLd } from "@/components/schema";
import { links, pageMeta } from "@/components/site";
import { Aurora, Button, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { CtaBand, Faq } from "@/components/blocks";

export const metadata = pageMeta({
  title: "Security",
  description: "How Rhinon Tech keeps your workspace separate, your roles enforced and your connected accounts encrypted.",
  path: "/security",
});

const PILLARS: { icon: LucideIcon; tone: [string, string]; title: string; body: string }[] = [
  { icon: ShieldCheck, tone: ["#2f5bff", "#7c5cff"], title: "Every workspace is isolated", body: "Your data lives in your own workspace. Every query is filtered to it automatically, so one customer can never see another's records." },
  { icon: UsersRound, tone: ["#7c5cff", "#e04dd6"], title: "Roles, enforced on the server", body: "Choose who can view or change payroll, the CRM, the inbox and more, action by action. The server checks every request, not just the buttons on screen." },
  { icon: Lock, tone: ["#ff8a4c", "#ff5fb0"], title: "Connected accounts are encrypted", body: "Tokens and keys for the accounts you connect are encrypted before they are stored." },
  { icon: KeyRound, tone: ["#10c98f", "#2cd3ff"], title: "Safe sign-in", body: "Passwords are hashed, never stored as text. Sessions are signed and expire after seven days." },
  { icon: FileLock2, tone: ["#2cd3ff", "#2f5bff"], title: "Private files", body: "Documents and uploads sit in private storage and are opened only through short-lived links." },
  { icon: Mail, tone: ["#ffb547", "#ff8a4c"], title: "Verified inbound mail", body: "Incoming email notifications are checked for a valid signature before we trust them." },
  { icon: Gauge, tone: ["#7c5cff", "#2f5bff"], title: "Protected public endpoints", body: "Forms and widgets that anyone on the internet can reach are rate-limited, and the chatbot only reads its own owner's content." },
  { icon: Cloud, tone: ["#2f5bff", "#2cd3ff"], title: "Built on AWS", body: "Email, file storage and hosting run on Amazon Web Services." },
  { icon: Smartphone, tone: ["#10c98f", "#2f5bff"], title: "Two-factor sign-in", body: "Add a one-time code from an authenticator app to your sign-in." },
  { icon: History, tone: ["#ff5fb0", "#7c5cff"], title: "An audit log", body: "See who changed what in your workspace, and when." },
  { icon: Download, tone: ["#ffb547", "#10c98f"], title: "Export and delete", body: "Download your workspace's data, or delete the workspace, whenever you choose." },
  { icon: Bot, tone: ["#7c5cff", "#2cd3ff"], title: "AI that reads only your content", body: "The AI Agent answers from your own website, files and articles, and a visitor's chat is scoped to your workspace." },
];

/** Companies that process data to run Rhinon Tech. Keep in step with the legal pages (launch review G0.4). */
const SUBPROCESSORS = [
  { name: "Amazon Web Services", purpose: "File storage and sending email" },
  { name: "Google (Gemini)", purpose: "AI drafting, AI Agent answers and lead research" },
  { name: "Vercel", purpose: "Hosting the website and the app's web front end" },
];

const FAQ = [
  { q: "Can other customers see our data?", a: "No. Every workspace is isolated, and every query is filtered to your workspace automatically." },
  { q: "Do you hold SOC 2 or ISO 27001?", a: "Not yet. We will say so here when we do. Until then, we are happy to answer a security questionnaire directly." },
  { q: "Is our data used to train AI models?", a: "Rhinon Tech sends your content to Google's Gemini models only to produce the draft or answer you asked for. Check Google's terms for how Gemini API data is handled." },
  { q: "Where is our data stored?", a: "We are confirming every location, including backups and email, before we publish one. Ask us and we will tell you what we know today." },
  { q: "Can we turn on two-factor sign-in?", a: "Yes. Each person can add an authenticator app to their sign-in from their profile." },
];

export default function SecurityPage() {
  return (
    <>
      <section className="relative pb-24 pt-16 sm:pt-24">
        <Aurora />
        <div className="relative mx-auto max-w-[1240px] px-5">
          <Reveal>
            <SectionHead as="h1" eyebrow="Security" title={<>Your company's data, <span className="text-aurora">kept yours.</span></>} sub="How we keep workspaces separate, permissions real and secrets safe. Plain answers, without the jargon." />
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href={links.signup} arrow>Get started free</Button>
              <Button href={links.contact} variant="ghost">Ask us a question</Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-28">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, tone, title, body }, i) => (
            <Reveal key={title} delay={(i % 4) * 90}>
              <Spot className="h-full p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(140deg, ${tone[0]}, ${tone[1]})` }}><Icon className="h-5 w-5" /></span>
                <p className="font-display mt-5 text-[20px] font-semibold leading-tight">{title}</p>
                <p className="mt-2.5 text-[14.5px] leading-6 text-ink-soft">{body}</p>
              </Spot>
            </Reveal>
          ))}
        </div>
        <Reveal delay={100}>
          <p className="mt-12 max-w-[640px] text-[15px] leading-7 text-muted">
            Need to review something specific, such as a security questionnaire? Talk to the team that builds and runs Rhinon Tech and we will answer directly.
          </p>
        </Reveal>
      </section>

      <section className="border-t border-line bg-soft/60 py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <SectionHead eyebrow="Sub-processors" title="Who else touches your data." sub="The companies that process data so Rhinon Tech can run. We will update this list before adding another." />
          </Reveal>
          <Reveal delay={120}>
            <Spot className="overflow-x-auto !rounded-3xl">
              <table className="w-full min-w-[420px] text-left text-[15px]">
                <caption className="sr-only">Sub-processors</caption>
                <thead className="bg-soft text-[12px] font-semibold uppercase tracking-wider text-muted"><tr><th scope="col" className="px-5 py-3">Company</th><th scope="col" className="px-5 py-3">What for</th></tr></thead>
                <tbody>{SUBPROCESSORS.map((s) => <tr key={s.name} className="border-t border-line"><th scope="row" className="px-5 py-4 font-medium">{s.name}</th><td className="px-5 py-4 text-ink-soft">{s.purpose}</td></tr>)}</tbody>
              </table>
            </Spot>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-line py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5">
          <SectionHead eyebrow="FAQ" title="Security questions, answered." />
          <div className="mt-12"><Faq items={FAQ} /></div>
        </div>
      </section>

      <CtaBand title={<>Questions about security? <span className="text-aurora-soft">Ask us directly.</span></>} sub="You will talk to the people who build and run it." primary={{ label: "Contact us", href: links.contact }} secondary={{ label: "Book a call", href: links.call }} />
      <JsonLd data={graphJsonLd([breadcrumbNode([{ name: "Home", path: "/" }, { name: "Security", path: "/security" }]), faqNode(FAQ)])} />
    </>
  );
}
