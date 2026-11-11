import { View, Text, Span, Pressable, TextInput } from "@/components/rn";
import { useRouter } from "@/lib/router";
import { Mail, MessageCircle, Phone, Search, type LucideIcon } from "@/components/icons";
import { useState } from "react";
import {
  Avatar,
  Chip,
  Display,
  Empty,
  Eyebrow,
  Screen,
  Sheet,
  TopBar,
  inputClass,
  stagger,
} from "@/components/rhinon/ui";
import { PEOPLE, type Person } from "@/lib/mock-data";
import { actions } from "@/lib/store";
import { TONES, toneFor } from "@/lib/tone";
import { cn } from "@/lib/utils";
const DEPTS = ["All", ...Array.from(new Set(PEOPLE.map((p) => p.dept)))];
export default function PeoplePage() {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [sel, setSel] = useState<Person | null>(null);
  const router = useRouter();
  const query = q.trim().toLowerCase();
  const rows = PEOPLE.filter((p) => dept === "All" || p.dept === dept).filter(
    (p) => !query || p.name.toLowerCase().includes(query) || p.role.toLowerCase().includes(query),
  );
  return (
    <Screen>
      <TopBar title="People" fallback="/more" />
      <View className="animate-rise">
        <Eyebrow tone="coral">{PEOPLE.length} teammates</Eyebrow>
        <Display size="hero" className="mt-3">
          Who's
          {"\n"}
          who.
        </Display>
      </View>

      <View className="relative mt-6 block">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
        />
        <TextInput
          className={cn(inputClass, "rounded-full py-3.5 pl-11")}
          placeholder="Search by name or role"
          accessibilityLabel="Search people"
          value={q}
          onChangeText={(text) => setQ(text)}
        />
      </View>
      <View className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {DEPTS.map((d) => (
          <Chip key={d} tone="coral" active={dept === d} onClick={() => setDept(d)}>
            {d}
          </Chip>
        ))}
      </View>

      {rows.length === 0 ? (
        <Empty
          tone="coral"
          title="No one found"
          body="Try another name, or clear the department filter."
        />
      ) : (
        <View className="mt-3">
          {rows.map((p, i) => (
            <View
              key={p.id}
              className="animate-rise border-b border-line/70 last:border-0"
              style={stagger(Math.min(i, 7))}
            >
              <Pressable
                onPress={() => setSel(p)}
                className="press flex w-full items-center gap-3.5 py-3.5 text-left"
              >
                <Avatar name={p.name} size={52} online={p.online} />
                <View className="min-w-0 flex-1">
                  <View className="block text-[16.5px] font-semibold leading-tight">{p.name}</View>
                  <View className="block text-[13.5px] text-ink/55">
                    {p.role} · {p.dept}
                  </View>
                </View>
                <Span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/40">
                  {p.location}
                </Span>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Sheet open={sel !== null} onClose={() => setSel(null)}>
        {sel ? (
          <View>
            <View className={cn("rounded-3xl p-5", TONES[toneFor(sel.name)].solid)}>
              <View className="flex items-start justify-between">
                <Avatar name={sel.name} size={84} tone="paper" className="!text-ink" />
                <View className="rounded-full bg-paper/25 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em]">
                  {sel.online ? "Online" : "Away"}
                </View>
              </View>
              <Display as="h2" size="lg" className="mt-5">
                {sel.name}
              </Display>
              <Text className="mt-1.5 text-[15px] opacity-85">
                {sel.role} · {sel.dept}
              </Text>
            </View>

            <View className="mt-3 grid grid-cols-3 gap-2.5">
              <Action
                icon={MessageCircle}
                label="Message"
                onClick={() => {
                  const id = actions.startDm(sel.id);
                  setSel(null);
                  void router.navigate({
                    to: "/chat/$chatId",
                    params: {
                      chatId: id,
                    },
                  });
                }}
              />
              <Action
                icon={Phone}
                label="Call"
                onClick={() => actions.toast(`Calling ${sel.name.split(" ")[0]}…`, "sky")}
              />
              <Action
                icon={Mail}
                label="Email"
                onClick={() => actions.toast(`Draft to ${sel.email}`, "coral")}
              />
            </View>

            <View className="mt-4 divide-y divide-line/70 rounded-3xl border border-line/70 bg-card px-4">
              {[
                ["Email", sel.email],
                ["Phone", sel.phone],
                ["Based in", sel.location],
              ].map(([k, v]) => (
                <View key={k} className="flex items-center justify-between gap-4 py-3.5">
                  <View className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink/50">
                    {k}
                  </View>
                  <View className="truncate text-[15px] font-medium">{v}</View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
function Action({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Pressable
      onPress={onClick}
      className="press flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-line/70 bg-card"
    >
      <Icon size={22} />
      <Span className="font-mono text-[10.5px] uppercase tracking-[0.14em]">{label}</Span>
    </Pressable>
  );
}
