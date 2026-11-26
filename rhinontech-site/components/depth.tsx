import Link from "next/link";
import { ArrowUpRight, Check, X } from "lucide-react";
import { PROOF_AS_OF, PROOF_FIGURES } from "@/content/proof";
import { SectionHead } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

/**
 * Sections shared by the hub and trust pages. Honest by construction: the proof is Rhinon Labs'
 * own usage (content/proof.ts), and "not a fit yet" mirrors the claims register (§2.6).
 */

/** Rhinon Labs' real usage figures, with a link to the case study. */
export function ProofStrip({ count = 4, soft = false }: { count?: number; soft?: boolean }) {
  return (
    <section className={`border-t border-line py-20 sm:py-24 ${soft ? "bg-soft/60" : ""}`}>
      <div className="mx-auto max-w-[1240px] px-5">
        <Reveal><SectionHead eyebrow="We use it ourselves" title="Rhinon Labs runs its own agency on Rhinon Tech." sub={`Real figures from our own workspace, as of ${PROOF_AS_OF}. Customer stories will appear here once customers give us permission.`} /></Reveal>
        <div className={`mt-12 grid gap-3 sm:grid-cols-2 ${count > 4 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
          {PROOF_FIGURES.slice(0, count).map((f, i) => (
            <Reveal key={f.label} delay={(i % 4) * 80}>
              <div className="lt-card h-full rounded-2xl p-6">
                <p className="font-display text-[40px] font-semibold leading-none">{f.big}</p>
                <p className="mt-3 text-[15px] font-semibold">{f.label}</p>
                <p className="mt-1 text-[13.5px] text-muted">{f.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Link href="/customers/rhinon-labs" className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-semibold underline underline-offset-4">Read how Rhinon Labs uses it <ArrowUpRight className="h-4 w-4" /></Link>
      </div>
    </section>
  );
}

/** What Rhinon does not do yet. Keep in step with the claims register and the product. */
export const NOT_YET = [
  "Proposals, invoices and online payments",
  "Time tracking and project budgets",
  "Statutory payroll filing (ESI, ECR, Form 16, challans)",
  "WhatsApp conversations",
  "Assigning single inbox threads to different people",
  "Direct importers from other tools (spreadsheet import works today)",
];

/** A two-column "a good fit / not a fit yet" block. */
export function FitBlock({ good, title = "Is Rhinon Tech right for you?" }: { good: string[]; title?: string }) {
  return (
    <section className="border-t border-line py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-5">
        <Reveal><SectionHead eyebrow="Honest fit" title={title} sub="We would rather you know now than find out after you have moved." /></Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[28px] border border-[#c9d4ff] bg-white p-8">
              <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-brand">A good fit if</p>
              <ul className="mt-6 space-y-4">{good.map((t) => <li key={t} className="flex gap-3 text-[16px] leading-7"><Check className="mt-1.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />{t}</li>)}</ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="h-full rounded-[28px] border border-line bg-white p-8">
              <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">Not built yet</p>
              <ul className="mt-6 space-y-4">{NOT_YET.map((t) => <li key={t} className="flex gap-3 text-[16px] leading-7 text-ink-soft"><X className="mt-1.5 h-4 w-4 shrink-0 text-rose-500" strokeWidth={3} />{t}</li>)}</ul>
              <p className="mt-6 text-[14px] leading-6 text-muted">If one of these is essential today, keep the tool you use for it alongside Rhinon, or check our comparison pages for a better fit.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** How a client moves through Rhinon: the one diagram every hub can share. */
export function LifecycleFlow() {
  const steps = [
    { k: "Enquiry", p: "AI Agent", body: "A website visitor gets an answer and is saved as a lead.", href: "/product/ai-agent" },
    { k: "Follow-up", p: "Outreach", body: "AI drafts a personal email; you approve before it sends.", href: "/product/outreach" },
    { k: "Deal", p: "CRM", body: "The deal moves through your stages with every email attached.", href: "/product/crm" },
    { k: "Project", p: "Projects", body: "One click turns the won deal into a project, client attached.", href: "/product/projects" },
    { k: "Portal", p: "Client portal", body: "The client follows tasks and sends requests by private link.", href: "/features/client-portal" },
    { k: "Team", p: "Chat, Docs, HR", body: "The people doing the work chat, write and take leave here too.", href: "/product/chat" },
  ];
  return (
    <section className="border-t border-line bg-soft/60 py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-5">
        <Reveal><SectionHead eyebrow="How it connects" title="One client, one record, from enquiry to delivery." sub="Each step is a product you can use today, and each one hands the client to the next without retyping." /></Reveal>
        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {steps.map((s, i) => (
            <Reveal key={s.k} delay={i * 70}>
              <li className="h-full">
                <Link href={s.href} className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 hover:border-ink/20">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{i + 1} · {s.k}</span>
                  <span className="mt-3 flex items-center justify-between text-[16px] font-semibold">{s.p}<ArrowUpRight className="h-4 w-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                  <span className="mt-2 text-[14px] leading-6 text-ink-soft">{s.body}</span>
                </Link>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
