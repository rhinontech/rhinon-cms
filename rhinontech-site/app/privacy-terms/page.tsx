import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Aurora } from "@/components/ui";
import { H2, Kicker, LightSection } from "@/components/light";
import { pageMeta } from "@/components/site";

export const metadata = pageMeta({
  title: "Privacy Policy & Terms of Service",
  description: "How Rhinon Tech handles your data, what we collect, how the AI is used, and the terms for using the workspace.",
  path: "/privacy-terms",
});

const UPDATED = "7 November 2026";

type Block = { heading: string; body: React.ReactNode };

const PRIVACY: Block[] = [
  {
    heading: "1. Who we are",
    body: (
      <p>Rhinon Tech is a business workspace built and operated by Rhinon Labs. This policy explains what we collect when you use the workspace, visit this website or talk to our chatbot, and what we do with it.</p>
    ),
  },
  {
    heading: "2. What we collect",
    body: (
      <>
        <p>Depending on how you use Rhinon Tech, we handle:</p>
        <ul>
          <li><strong>Account details:</strong> your name, work email, role and the settings you choose.</li>
          <li><strong>Workspace content:</strong> what you and your team add, such as leads, emails, tasks, documents, HR and payroll records, chats and meetings. You decide what goes in.</li>
          <li><strong>Connected accounts:</strong> if you connect a mailbox or calendar, we store the access tokens so the connection keeps working. They are encrypted before they are stored.</li>
          <li><strong>Enquiries:</strong> if you use our contact form, book a demo or chat with our chatbot, we keep the details you give us, such as your name, email, phone number, company and message.</li>
          <li><strong>Visit data:</strong> page views on our website, with the page, referrer, device type and an approximate location worked out from your IP address. Our tracker sets no cookies. It keeps a random identifier in your browser storage to tell repeat visits apart.</li>
        </ul>
      </>
    ),
  },
  {
    heading: "3. How we use it",
    body: (
      <ul>
        <li>To run the workspace and to keep it secure.</li>
        <li>To reply to enquiries, book demos and provide support.</li>
        <li>To understand how our website is used and to improve the product.</li>
        <li>To send you messages you asked for or that the service needs to send, such as meeting invites and sign-in emails.</li>
      </ul>
    ),
  },
  {
    heading: "4. AI features",
    body: (
      <>
        <p>Rhinon AI runs on Google's Gemini models. When you use an AI feature, the text needed for that task, such as a lead's details to draft an email or a visitor's question to the chatbot, is sent to the model to produce the answer.</p>
        <ul>
          <li>Outreach drafts are saved for your review. Nothing is sent without your approval.</li>
          <li>The chatbot answers from the website pages and documents its owner has given it, and only from that owner's workspace.</li>
        </ul>
      </>
    ),
  },
  {
    heading: "5. Who we share it with",
    body: (
      <>
        <p>We do not sell your data. We use a small number of service providers to run the product, and they only receive what they need to do their job:</p>
        <ul>
          <li>Amazon Web Services, for hosting, file storage and email delivery.</li>
          <li>Google, for the AI models and, if you connect it, Google Calendar and Gmail.</li>
          <li>Microsoft, only if you connect an Outlook mailbox or calendar.</li>
        </ul>
        <p>We may also disclose information where the law requires it.</p>
      </>
    ),
  },
  {
    heading: "6. How we protect it",
    body: (
      <ul>
        <li>Every workspace is isolated, and every query is filtered to the workspace it belongs to.</li>
        <li>Roles and permissions are enforced on our servers on every request, not only in the interface.</li>
        <li>Connected account tokens and keys are encrypted at rest. Passwords are hashed and never stored as text.</li>
        <li>Sessions are signed and expire after seven days, and public forms are rate-limited.</li>
      </ul>
    ),
  },
  {
    heading: "7. How long we keep it, and your choices",
    body: (
      <>
        <p>We keep workspace data while the workspace is active. You can export your workspace data from the workspace settings, and you can ask us to delete a workspace and its data.</p>
        <p>You can ask us to access, correct or delete personal information we hold about you, including enquiries you sent us. Contact us using the details below.</p>
      </>
    ),
  },
  {
    heading: "8. Cookies and browser storage",
    body: (
      <p>Signing in to the workspace uses a cookie that holds your session. Our website analytics use no cookies. The chatbot and analytics keep random identifiers in your browser storage so a conversation or visit can be recognised on your next page.</p>
    ),
  },
  {
    heading: "9. Changes to this policy",
    body: <p>If we change this policy in a way that matters, we will update the date at the top of this page.</p>,
  },
];

const TERMS: Block[] = [
  {
    heading: "1. Using Rhinon Tech",
    body: (
      <p>By creating a workspace or using the service you agree to these terms. You are responsible for your account, for the people you invite and for what they do in your workspace. Keep your sign-in details safe and tell us if you think someone else has used them.</p>
    ),
  },
  {
    heading: "2. Your content",
    body: (
      <p>What you add to your workspace is yours. You give us permission to store, process and display it only as needed to run the service for you. You are responsible for having the right to use the data you put in, including your leads' and employees' information.</p>
    ),
  },
  {
    heading: "3. Acceptable use",
    body: (
      <ul>
        <li>Do not use Rhinon Tech for anything unlawful, harmful or deceptive.</li>
        <li>Follow the laws that apply to email and messaging when you use Outreach, and respect unsubscribe requests.</li>
        <li>Do not try to break, overload or gain access to parts of the service or to other workspaces.</li>
      </ul>
    ),
  },
  {
    heading: "4. Free and paid products",
    body: (
      <p>Every module except the AI website chatbot is free for your whole team, with no time limit. The AI website chatbot is a paid product, priced and agreed with you before it is set up.</p>
    ),
  },
  {
    heading: "5. AI output",
    body: (
      <p>AI can be wrong. Rhinon AI produces drafts and suggestions, and you should review them before you use or send them. You are responsible for what you choose to send or publish.</p>
    ),
  },
  {
    heading: "6. Availability and changes",
    body: (
      <p>We work to keep the service available and to improve it, and that means features may change over time. We may update these terms, and will change the date on this page when we do.</p>
    ),
  },
  {
    heading: "7. Ending your use",
    body: (
      <p>You can stop using Rhinon Tech at any time, and you can ask us to delete your workspace. We may suspend a workspace that breaks these terms or puts others at risk.</p>
    ),
  },
  {
    heading: "8. Liability",
    body: (
      <p>The service is provided as it is, without promises that it will be uninterrupted or error free. To the extent the law allows, Rhinon Labs is not liable for indirect or consequential losses arising from your use of the service.</p>
    ),
  },
];

function Part({ id, kicker, title, blocks }: { id: string; kicker: string; title: string; blocks: Block[] }) {
  return (
    <section id={id} className="scroll-mt-28">
      <Kicker>{kicker}</Kicker>
      <H2 className="mt-4 !text-[34px] sm:!text-[48px]">{title}</H2>
      <div className="mt-12 space-y-10">
        {blocks.map((b) => (
          <div key={b.heading} className="border-t border-line pt-8">
            <h3 className="font-display text-[22px] font-semibold text-ink">{b.heading}</h3>
            <div className="mt-3 space-y-3 text-[16.5px] leading-8 text-ink-soft [&_li]:mt-2 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">{b.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PrivacyTermsPage() {
  return (
    <>
      <section className="relative overflow-hidden px-5 pb-10 pt-14 sm:pt-20">
        <Aurora />
        <div className="relative mx-auto max-w-[820px]">
          <Reveal>
            <Kicker>Legal</Kicker>
            <h1 className="font-display mt-4 text-[44px] font-semibold leading-[1.02] sm:text-[72px]">Privacy &amp; <span className="text-aurora">terms.</span></h1>
            <p className="mt-6 max-w-[620px] text-[18px] leading-8 text-ink-soft">How we handle your data, and the terms for using Rhinon Tech. Written in plain language.</p>
            <p className="mt-5 font-mono text-[12px] uppercase tracking-[0.18em] text-muted">Last updated {UPDATED}</p>
            <div className="mt-8 flex flex-wrap gap-3 text-[14.5px] font-medium">
              <a href="#privacy" className="btn btn-soft !h-11 !text-[15px]">Privacy policy</a>
              <a href="#terms" className="btn btn-soft !h-11 !text-[15px]">Terms of service</a>
            </div>
          </Reveal>
        </div>
      </section>

      <LightSection>
        <div className="mx-auto max-w-[820px] space-y-28">
          <Part id="privacy" kicker="Privacy policy" title="What we collect and why." blocks={PRIVACY} />
          <Part id="terms" kicker="Terms of service" title="The ground rules." blocks={TERMS} />
          <div className="rounded-2xl border border-line bg-soft/60 p-8">
            <p className="font-display text-[24px] font-semibold text-ink">Questions about your data?</p>
            <p className="mt-2 text-[16px] leading-7 text-ink-soft">Ask us anything, or request access to or deletion of your information. We read every message and reply by email.</p>
            <p className="mt-5"><Link href="/contact" className="btn btn-primary">Contact us</Link></p>
          </div>
        </div>
      </LightSection>
    </>
  );
}
