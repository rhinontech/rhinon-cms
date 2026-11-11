import { Cloud, FileLock2, Gauge, KeyRound, Lock, Mail, ShieldCheck, UsersRound, type LucideIcon } from "lucide-react";
import { links, pageMeta } from "@/components/site";
import { Aurora, Button, SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Spot } from "@/components/Spot";
import { CtaBand } from "@/components/blocks";

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

      <CtaBand title={<>Questions about security? <span className="text-aurora-soft">Ask us directly.</span></>} sub="You will talk to the people who build and run it." primary={{ label: "Contact us", href: links.contact }} secondary={{ label: "Book a call", href: links.call }} />
    </>
  );
}
