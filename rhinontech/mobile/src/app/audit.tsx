import { useRev } from "@/lib/store";
import { View, Text, Span, TextInput } from "@/components/rn";
import {
  FileText,
  KeyRound,
  Settings,
  ShieldAlert,
  Users,
  Wallet,
  type LucideIcon,
} from "@/components/icons";
import { useState } from "react";
import {
  Chip,
  Display,
  Empty,
  Eyebrow,
  NoAccess,
  Screen,
  SectionLabel,
  TopBar,
  inputClass,
  stagger,
} from "@/components/rhinon/ui";
import { nameOf } from "@/lib/mock-data";
import { AUDIT, type AuditEntry, type AuditKind } from "@/lib/mock-more";
import { usePerm } from "@/lib/store";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
import { Search } from "@/components/icons";
const KIND: Record<
  AuditKind,
  {
    label: string;
    icon: LucideIcon;
    tone: Tone;
  }
> = {
  security: {
    label: "Security",
    icon: ShieldAlert,
    tone: "coral",
  },
  people: {
    label: "People",
    icon: Users,
    tone: "leaf",
  },
  payroll: {
    label: "Payroll",
    icon: Wallet,
    tone: "sun",
  },
  settings: {
    label: "Settings",
    icon: Settings,
    tone: "violet",
  },
  content: {
    label: "Content",
    icon: FileText,
    tone: "rose",
  },
};
function Row({ e, i }: { e: AuditEntry; i: number }) {
  const k = KIND[e.kind];
  const Icon = k.icon;
  return (
    <View
      className="flex animate-rise gap-3.5 border-b border-line/70 py-3.5 last:border-0"
      style={stagger(Math.min(i, 8))}
    >
      <View
        className={cn("grid size-11 shrink-0 place-items-center rounded-xl", TONES[k.tone].solid)}
      >
        <Icon size={20} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] leading-snug">
          <Span className="font-semibold">{nameOf(e.actor).split(" ")[0]}</Span>{" "}
          {e.action.charAt(0).toLowerCase() + e.action.slice(1)}
        </Text>
        <Text className="mt-0.5 truncate text-[13.5px] text-ink/60">{e.target}</Text>
        <Text className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
          {e.at} · {e.where}
        </Text>
      </View>
    </View>
  );
}
export default function AuditPage() {
  useRev();
  const allowed = usePerm("audit");
  const [filter, setFilter] = useState<"All" | AuditKind>("All");
  const [q, setQ] = useState("");
  if (!allowed) {
    return (
      <Screen>
        <TopBar title="Audit log" fallback="/more" />
        <NoAccess title="No access to the audit log" body="The audit log is limited to admins." />
      </Screen>
    );
  }
  const query = q.trim().toLowerCase();
  const rows = AUDIT.filter((e) => filter === "All" || e.kind === filter).filter(
    (e) => !query || `${nameOf(e.actor)} ${e.action} ${e.target}`.toLowerCase().includes(query),
  );
  const today = rows.filter((e) => e.at.startsWith("Today"));
  const earlier = rows.filter((e) => !e.at.startsWith("Today"));
  return (
    <Screen>
      <TopBar title="Audit log" fallback="/more" />
      <View className="animate-rise">
        <Eyebrow tone="violet">
          <KeyRound size={11} className="mr-1.5 inline -translate-y-px" />
          Read-only
        </Eyebrow>
        <Display size="hero" className="mt-3">
          Paper
          {"\n"}
          trail.
        </Display>
      </View>

      <View className="relative mt-6 block">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
        />
        <TextInput
          className={cn(inputClass, "rounded-full py-3.5 pl-11")}
          placeholder="Search who, what or where"
          accessibilityLabel="Search the audit log"
          value={q}
          onChangeText={(text) => setQ(text)}
        />
      </View>
      <View className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {(["All", ...(Object.keys(KIND) as AuditKind[])] as const).map((f) => (
          <Chip key={f} tone="violet" active={filter === f} onClick={() => setFilter(f)}>
            {f === "All" ? "All" : KIND[f].label}
          </Chip>
        ))}
      </View>

      {rows.length === 0 ? (
        <Empty tone="violet" title="No entries" body="Nothing matches that search." />
      ) : (
        <>
          {today.length > 0 ? (
            <View className="mt-6">
              <SectionLabel className="mb-1">Today</SectionLabel>
              <View>
                {today.map((e, i) => (
                  <Row key={e.id} e={e} i={i} />
                ))}
              </View>
            </View>
          ) : null}
          {earlier.length > 0 ? (
            <View className="mt-6">
              <SectionLabel className="mb-1">Earlier</SectionLabel>
              <View>
                {earlier.map((e, i) => (
                  <Row key={e.id} e={e} i={i} />
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
      <Text className="mt-6 text-center text-[13px] text-ink/50">
        Exporting the full log stays on the web.
      </Text>
    </Screen>
  );
}
