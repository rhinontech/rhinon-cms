import { View } from "react-native";

import { MEETINGS, PEOPLE } from "@/data/mock-data";
import { ANALYTICS } from "@/data/mock-more";
import { lakh } from "@/data/format";
import { ROLE_LABEL, useApp } from "@/data/store";
import { Display, Eyebrow, Screen, SectionLabel, Text, Tile, type Tone } from "@/ui";

type Mod = { id: string; label: string; tone: Tone; stat: string; perm?: string; wide?: boolean; badge?: number };

export default function More() {
  const role = useApp((s) => s.role);
  const perms = useApp((s) => s.perms[s.role]);
  const approvals = useApp((s) => s.approvals);
  const deals = useApp((s) => s.deals);
  const notifs = useApp((s) => s.notifs);
  const clock = useApp((s) => s.clock);
  const docs = useApp((s) => s.docs);
  const brand = useApp((s) => s.brand);

  const pipeline = deals.filter((d) => d.stage !== "won").reduce((s, d) => s + d.value, 0);
  const fresh = notifs.filter((n) => n.unread).length;
  const toSign = docs.filter((d) => d.state === "to-sign").length;

  const groups: { title: string; mods: Mod[] }[] = [
    { title: "Your day", mods: [
      { id: "approvals", label: "Approvals", tone: "violet", stat: approvals.length ? "Waiting on you" : "All clear", perm: "approvals", wide: true, badge: approvals.length },
      { id: "attendance", label: "Clock", tone: "leaf", stat: clock.status === "out" ? "Not in yet" : clock.status === "done" ? "Day logged" : "On the clock" },
      { id: "leave", label: "Leave", tone: "sky", stat: "5 days left" },
      { id: "pay", label: "Pay", tone: "sun", stat: "Oct paid" },
      { id: "documents", label: "Docs", tone: "cobalt", stat: toSign ? `${toSign} to sign` : "Vault", perm: "documents", badge: toSign },
      { id: "performance", label: "Goals", tone: "violet", stat: "H2 2026 review", perm: "performance", wide: true },
    ] },
    { title: "Together", mods: [
      { id: "meetings", label: "Meetings", tone: "cobalt", stat: `${MEETINGS.filter((m) => m.day === "Today").length} today`, perm: "meetings" },
      { id: "people", label: "People", tone: "coral", stat: `${PEOPLE.length} teammates` },
    ] },
    { title: "Sales and platform", mods: [
      { id: "crm", label: "CRM", tone: "rose", stat: `${lakh(pipeline)} open`, perm: "crm", wide: true },
      { id: "analytics", label: "Traffic", tone: "violet", stat: `${ANALYTICS[brand].now} on site now`, perm: "analytics" },
      { id: "settings", label: "Settings", tone: "ink", stat: "Roles · accounts", perm: "settings" },
    ] },
    { title: "You", mods: [
      { id: "notifications", label: "Alerts", tone: "coral", stat: `${fresh} new`, badge: fresh },
      { id: "profile", label: "Profile", tone: "ink", stat: "Kabir Mehra" },
    ] },
  ];
  const visible = groups.map((g) => ({ ...g, mods: g.mods.filter((m) => !m.perm || perms?.[m.perm]?.read) })).filter((g) => g.mods.length);
  const count = visible.reduce((n, g) => n + g.mods.length, 0);

  return (
    <Screen>
      <Eyebrow>More · {count} modules · {ROLE_LABEL[role]}</Eyebrow>
      <Display style={{ marginTop: 12 }}>{"The\nrest."}</Display>
      <Text style={{ marginTop: 14, opacity: 0.6, lineHeight: 22 }}>Only what your role can open shows up here. The server still checks every request.</Text>
      {visible.map((g) => (
        <View key={g.title}>
          <SectionLabel>{g.title}</SectionLabel>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {g.mods.map((m) => <Tile key={m.id} name={m.tone} label={m.label} stat={m.stat} wide={m.wide} {...(m.badge ? { badge: m.badge } : {})} />)}
          </View>
        </View>
      ))}
    </Screen>
  );
}
