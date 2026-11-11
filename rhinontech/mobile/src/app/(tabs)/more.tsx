import { View, Text, Span, Link } from "@/components/rn";
import { Display, Eyebrow, SectionLabel, Screen, stagger } from "@/components/rhinon/ui";
import { lakh } from "@/lib/format";
import { MEETINGS, PEOPLE } from "@/lib/mock-data";
import { ANALYTICS } from "@/lib/mock-more";
import { ROLE_LABEL, useApp } from "@/lib/store";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
type Mod = {
  id: string;
  to: string;
  label: string[];
  tone: Tone | "outline";
  stat: string;
  /** The permission that shows this tile; no value means everyone sees it. */
  perm?: string;
  wide?: boolean;
  badge?: number;
};
type Group = {
  title: string;
  mods: Mod[];
};
export default function MorePage() {
  const role = useApp((s) => s.role);
  const perms = useApp((s) => s.perms[s.role]);
  const approvals = useApp((s) => s.approvals);
  const deals = useApp((s) => s.deals);
  const notifs = useApp((s) => s.notifs);
  const clock = useApp((s) => s.clock);
  const docs = useApp((s) => s.docs);
  const pages = useApp((s) => s.pages);
  const interviews = useApp((s) => s.interviews);
  const drafts = useApp((s) => s.drafts);
  const botChats = useApp((s) => s.botChats);
  const ideas = useApp((s) => s.ideas);
  const posts = useApp((s) => s.posts);
  const brand = useApp((s) => s.brand);
  const pipeline = deals.filter((d) => d.stage !== "won").reduce((s, d) => s + d.value, 0);
  const fresh = notifs.filter((n) => n.unread).length;
  const toSign = docs.filter((d) => d.state === "to-sign").length;
  const dueFeedback = interviews.filter((i) => i.rating === null && i.day === "Yesterday").length;
  const reviewDrafts = drafts.filter((d) => d.brand === brand && d.status === "pending").length;
  const waiting = botChats.filter((c) => c.status === "waiting").length;
  const newIdeas = ideas.filter((i) => i.unread).length;
  const toApprove = posts.filter((p) => p.status === "Review").length;
  const groups: Group[] = [
    {
      title: "Your day",
      mods: [
        {
          id: "approvals",
          to: "/approvals",
          label: ["Approvals"],
          tone: "violet",
          stat: approvals.length ? "Waiting on you" : "All clear",
          perm: "approvals",
          wide: true,
          badge: approvals.length,
        },
        {
          id: "attendance",
          to: "/attendance",
          label: ["Clock"],
          tone: "leaf",
          stat:
            clock.status === "out"
              ? "Not in yet"
              : clock.status === "done"
                ? "Day logged"
                : "On the clock",
        },
        {
          id: "leave",
          to: "/leave",
          label: ["Leave"],
          tone: "sky",
          stat: "5 days left",
        },
        {
          id: "pay",
          to: "/pay",
          label: ["Pay"],
          tone: "sun",
          stat: "Oct paid",
        },
        {
          id: "documents",
          to: "/documents",
          label: ["Docs"],
          tone: "cobalt",
          stat: toSign ? `${toSign} to sign` : "Vault",
          perm: "documents",
          badge: toSign,
        },
        {
          id: "performance",
          to: "/performance",
          label: ["Goals"],
          tone: "violet",
          stat: "H2 2026 review",
          perm: "performance",
          wide: true,
        },
      ],
    },
    {
      title: "Together",
      mods: [
        {
          id: "meetings",
          to: "/meetings",
          label: ["Meetings"],
          tone: "cobalt",
          stat: `${MEETINGS.filter((m) => m.day === "Today").length} today`,
          perm: "meetings",
        },
        {
          id: "people",
          to: "/people",
          label: ["People"],
          tone: "coral",
          stat: `${PEOPLE.length} teammates`,
        },
        {
          id: "pages",
          to: "/pages",
          label: ["Pages"],
          tone: "cobalt",
          stat: `${pages.length} pages`,
          perm: "pages",
        },
        {
          id: "hiring",
          to: "/hiring",
          label: ["Hiring"],
          tone: "leaf",
          stat: dueFeedback ? `${dueFeedback} feedback due` : "Interviews",
          perm: "hiring",
          badge: dueFeedback,
        },
      ],
    },
    {
      title: "Sales and support",
      mods: [
        {
          id: "crm",
          to: "/crm",
          label: ["CRM"],
          tone: "rose",
          stat: `${lakh(pipeline)} open`,
          perm: "crm",
          wide: true,
        },
        {
          id: "outreach",
          to: "/outreach",
          label: ["Outreach"],
          tone: "coral",
          stat: reviewDrafts ? `${reviewDrafts} to review` : "All sent",
          perm: "outreach",
          badge: reviewDrafts,
        },
        {
          id: "chatbot",
          to: "/chatbot",
          label: ["Chatbot"],
          tone: "sky",
          stat: waiting ? `${waiting} waiting` : "Live chats",
          perm: "chatbot",
          badge: waiting,
        },
      ],
    },
    {
      title: "Platform",
      mods: [
        {
          id: "analytics",
          to: "/analytics",
          label: ["Traffic"],
          tone: "violet",
          stat: `${ANALYTICS[brand].now} on site now`,
          perm: "analytics",
        },
        {
          id: "ideas",
          to: "/ideas",
          label: ["Ideas"],
          tone: "sun",
          stat: newIdeas ? `${newIdeas} unread` : "Startup ideas",
          perm: "ideas",
          badge: newIdeas,
        },
        {
          id: "content",
          to: "/content",
          label: ["Content"],
          tone: "rose",
          stat: toApprove ? `${toApprove} to approve` : "Events",
          perm: "content",
          badge: toApprove,
        },
        {
          id: "audit",
          to: "/audit",
          label: ["Audit"],
          tone: "ink",
          stat: "Read-only",
          perm: "audit",
        },
        {
          id: "settings",
          to: "/settings",
          label: ["Settings"],
          tone: "outline",
          stat: "Roles · accounts",
          perm: "settings",
          wide: true,
        },
      ],
    },
    {
      title: "You",
      mods: [
        {
          id: "notifications",
          to: "/notifications",
          label: ["Alerts"],
          tone: "coral",
          stat: `${fresh} new`,
          badge: fresh,
        },
        {
          id: "profile",
          to: "/profile",
          label: ["Profile"],
          tone: "ink",
          stat: "Kabir Mehra",
        },
      ],
    },
  ];
  const visible = groups
    .map((g) => ({
      ...g,
      mods: g.mods.filter((m) => !m.perm || perms?.[m.perm]?.read),
    }))
    .filter((g) => g.mods.length > 0);
  const count = visible.reduce((n, g) => n + g.mods.length, 0);
  let index = 0;
  return (
    <Screen>
      <View className="animate-rise">
        <Eyebrow>
          More · {count} modules · {ROLE_LABEL[role]}
        </Eyebrow>
        <Display size="hero" className="mt-3">
          The
          {"\n"}
          rest.
        </Display>
        <Text className="mt-4 max-w-[320px] text-[15.5px] leading-relaxed text-ink/60">
          Only what your role can open shows up here. The server still checks every request.
        </Text>
      </View>

      {visible.map((g) => (
        <View key={g.title} className="mt-8">
          <SectionLabel className="mb-4">{g.title}</SectionLabel>
          <View className="grid grid-cols-2 gap-3">
            {g.mods.map((m) => {
              const i = index++;
              return (
                <Link
                  key={m.id}
                  to={m.to as "/"}
                  className={cn(
                    "press relative flex min-h-[124px] animate-rise flex-col justify-between gap-3 overflow-hidden rounded-3xl p-4",
                    m.wide && "col-span-2",
                    m.tone === "outline"
                      ? "border-2 border-dashed border-ink/25 text-ink"
                      : TONES[m.tone].solid,
                  )}
                  style={stagger(Math.min(i, 9))}
                >
                  <View className="flex items-start justify-between gap-2">
                    <Span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] opacity-90">
                      {m.stat}
                    </Span>
                    {m.badge ? (
                      <View className="grid min-w-6 place-items-center rounded-full bg-paper px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink">
                        {m.badge}
                      </View>
                    ) : null}
                  </View>
                  <View className="font-display text-[length:calc(36px*var(--ds))] leading-[0.86]">
                    {m.label.map((l) => (
                      <Text key={l}>{l}</Text>
                    ))}
                  </View>
                </Link>
              );
            })}
          </View>
        </View>
      ))}
    </Screen>
  );
}
