import { ArrowUpRight, BadgeCheck, Hammer, Lightbulb, MessagesSquare, Presentation, Repeat2, ShieldCheck, Users } from "lucide-react";
import type { EventDetailModel } from "../../shared/model";
import type { CategoryConfig } from "../../shared/categoryConfig";

/**
 * The deep-blue panel the homepage uses for its "99%" and closing sections —
 * reserved here for the one block that explains how this format works.
 */
function BluePanel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#021338] via-[#052b82] to-[#0d59eb] p-7 sm:p-10 text-white shadow-[0_24px_60px_-24px_rgba(5,43,130,0.55)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
      />
      <div className="relative">
        <p className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-[#8FB8FF]">{eyebrow}</p>
        <h2 className="mt-3 text-2xl sm:text-[30px] font-extrabold tracking-tight leading-[1.15] max-w-xl">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Steps({ steps }: { steps: { icon: typeof Hammer; title: string; body: string }[] }) {
  return (
    <ol className={`mt-8 grid gap-4 ${steps.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
      {steps.map((step, index) => (
        <li key={step.title} className="rounded-2xl bg-white/[0.07] border border-white/15 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <step.icon className="w-5 h-5 text-[#8FB8FF]" aria-hidden />
            <span className="text-[11px] font-bold tracking-[0.2em] text-white/50">0{index + 1}</span>
          </div>
          <p className="mt-4 text-[15px] font-bold">{step.title}</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/75">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

export default function Highlight({ event, config }: { event: EventDetailModel; config: CategoryConfig }) {
  switch (config.highlight) {
    case "assessment":
      return (
        <BluePanel eyebrow="How you earn it" title="A certificate that says you shipped something">
          <p className="mt-3 text-[15px] text-white/75 max-w-xl leading-relaxed">
            Not an attendance badge. {event.dayCount > 1 ? `Across ${event.dayCount} live sessions` : "Live"}, you
            build it, we review it, and the certificate records what you actually made.
          </p>
          <Steps
            steps={[
              { icon: Presentation, title: "Attend every session", body: "Live and guided, with recordings if you need to catch up." },
              { icon: Hammer, title: "Build and submit", body: "Apply each session to your own material, not a toy example." },
              { icon: BadgeCheck, title: "Pass the live review", body: "Walk the reviewers through it. Pass, and the certificate is yours." },
            ]}
          />
        </BluePanel>
      );

    case "intensive":
      return (
        <BluePanel
          eyebrow="The format"
          title={event.dayCount === 1 ? "One day, hands on the keyboard" : `${event.dayCount} days, hands on the keyboard`}
        >
          <p className="mt-3 text-[15px] text-white/75 max-w-xl leading-relaxed">
            Short framing, then long building blocks. Bring the material your team actually works with — every
            exercise runs on it.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-4">
            {[
              { value: `${event.dayCount}`, label: event.dayCount === 1 ? "Day" : "Days" },
              { value: `${Math.max(event.schedule.length, 1)}`, label: "Build blocks" },
              { value: "1:1", label: "Mentor check-ins" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/[0.07] border border-white/15 p-5">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-3xl sm:text-4xl font-extrabold tracking-tight">{stat.value}</dd>
                <p className="mt-1 text-[12px] font-semibold tracking-[0.14em] uppercase text-white/60">{stat.label}</p>
              </div>
            ))}
          </dl>
        </BluePanel>
      );

    case "buildday":
      return (
        <BluePanel eyebrow="How the day works" title="Arrive with an idea. Leave with a demo.">
          <Steps
            steps={[
              { icon: Lightbulb, title: "Frame the problem", body: "Pitch a real teaching problem in one line." },
              { icon: Users, title: "Form a team", body: "Up to three people, mixing educators and builders." },
              { icon: Hammer, title: "Build with mentors", body: "Two long blocks with mentors on the floor." },
              { icon: Presentation, title: "Demo and judging", body: "Only what runs counts. Best builds are shortlisted." },
            ]}
          />
        </BluePanel>
      );

    case "community":
      return (
        <div className="rounded-3xl border border-[#BDE8E8] bg-gradient-to-br from-[#F0FBFB] via-white to-[#F5FAFF] p-7 sm:p-10">
          <p className={`text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase ${config.accent.text}`}>
            More than one evening
          </p>
          <h2 className="mt-3 text-2xl sm:text-[30px] font-extrabold text-[#0B1B3D] tracking-tight leading-[1.15] max-w-xl">
            A peer group that keeps meeting
          </h2>
          <ul className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              { icon: Repeat2, title: "Monthly meetups", body: "Same people, new problems — progress compounds." },
              { icon: MessagesSquare, title: "Shared library", body: "Prompts and lesson plans contributed by the room." },
              { icon: ShieldCheck, title: "Honest accounts", body: "What failed gets airtime, not just the wins." },
            ].map((perk) => (
              <li key={perk.title} className="rounded-2xl bg-white border border-[#E2F2F2] p-5">
                <perk.icon className={`w-5 h-5 ${config.accent.text}`} aria-hidden />
                <p className="mt-3 text-[15px] font-bold text-[#0B1B3D]">{perk.title}</p>
                <p className="mt-1 text-[13.5px] text-[#475569] leading-relaxed">{perk.body}</p>
              </li>
            ))}
          </ul>
          {event.whatsappLink ? (
            <a
              href={event.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 text-[13px] font-bold tracking-wider uppercase text-[#0E8A8A] hover:text-[#0B6F6F]"
            >
              Join the community group <ArrowUpRight className="w-4 h-4" aria-hidden />
            </a>
          ) : null}
        </div>
      );

    case "internal":
      return (
        <div className="rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-7 sm:p-10">
          <p className={`text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase ${config.accent.text}`}>
            Before you arrive
          </p>
          <h2 className="mt-3 text-2xl sm:text-[30px] font-extrabold text-[#0B1B3D] tracking-tight leading-[1.15] max-w-xl">
            Come ready to take your own session apart
          </h2>
          <ul className="mt-7 space-y-3">
            {[
              "Pick one recorded session you taught in the last cohort.",
              "Read the facilitation rubric shared in the faculty channel.",
              "Note the moment you think learners disengaged — we start there.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px] text-[#334155]">
                <BadgeCheck className="w-5 h-5 mt-0.5 shrink-0 text-[#475569]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );

    default:
      return null;
  }
}
