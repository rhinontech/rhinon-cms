import { View, Text, Span, Pressable } from "@/components/rn";
import { useRouter } from "@/lib/router";
import { LogOut, ShieldCheck } from "@/components/icons";
import {
  Avatar,
  Button,
  Chip,
  Display,
  Eyebrow,
  Screen,
  SectionLabel,
  Toggle,
  TopBar,
} from "@/components/rhinon/ui";
import { ME } from "@/lib/mock-data";
import { ROLE_LABEL, actions, useApp, type Role } from "@/lib/store";
const PREFS: {
  key: string;
  label: string;
  hint: string;
}[] = [
  {
    key: "push",
    label: "Push notifications",
    hint: "Master switch for this device",
  },
  {
    key: "tasks",
    label: "Tasks and mentions",
    hint: "Assigned, due soon, overdue",
  },
  {
    key: "inbox",
    label: "Inbox replies",
    hint: "New mail and lead replies",
  },
  {
    key: "chat",
    label: "Chat messages",
    hint: "DMs, channels and calls",
  },
  {
    key: "approvals",
    label: "Approvals",
    hint: "Requests waiting on you",
  },
  {
    key: "digest",
    label: "Weekly digest",
    hint: "Monday summary by email",
  },
];
export default function ProfilePage() {
  const prefs = useApp((s) => s.prefs);
  const role = useApp((s) => s.role);
  const router = useRouter();
  return (
    <Screen>
      <TopBar title="Profile" fallback="/more" />

      <View className="animate-rise overflow-hidden rounded-4xl bg-violet p-5 text-violet-foreground">
        <View className="flex items-start justify-between">
          <Avatar name={ME.name} size={88} tone="paper" className="!text-ink" />
          <View className="rounded-full bg-paper/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em]">
            {ROLE_LABEL[role]}
          </View>
        </View>
        <Display as="h1" size="xl" className="mt-5">
          {ME.name}
        </Display>
        <Text className="mt-1.5 text-[15px] opacity-85">
          {ME.role} · {ME.dept}
        </Text>
        <Text className="mt-4 font-mono text-[11px] tracking-[0.08em] opacity-80">{ME.email}</Text>
      </View>

      <View className="mt-3 grid grid-cols-3 gap-2.5">
        {[
          ["Joined", ME.joined],
          ["Reports to", ME.manager.split(" ")[0] ?? ""],
          ["Based in", ME.location.split(" ")[0] ?? ""],
        ].map(([k, v]) => (
          <View key={k} className="rounded-2xl border border-line/70 bg-card p-3.5">
            <Text className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/50">
              {k}
            </Text>
            <Text className="mt-1.5 truncate text-[15px] font-semibold">{v}</Text>
          </View>
        ))}
      </View>

      <SectionLabel className="mt-9">Security</SectionLabel>
      <View className="mt-3 divide-y divide-line/70 rounded-3xl border border-line/70 bg-card px-4">
        <View className="flex items-center gap-3 py-3.5">
          <View className="grid size-10 place-items-center rounded-xl bg-leaf/15 text-leaf-deep">
            <ShieldCheck size={20} />
          </View>
          <View className="min-w-0 flex-1">
            <View className="block font-semibold leading-tight">Two-factor sign-in</View>
            <View className="block text-[13px] text-ink/55">Authenticator app</View>
          </View>
          <Toggle
            on={prefs["twofa"] ?? false}
            onChange={() => actions.togglePref("twofa")}
            label="Two-factor sign-in"
          />
        </View>
        <View className="flex items-center gap-3 py-3.5">
          <View className="min-w-0 flex-1">
            <View className="block font-semibold leading-tight">Face ID for payslips</View>
            <View className="block text-[13px] text-ink/55">Ask again before showing pay</View>
          </View>
          <Toggle
            on={prefs["biometric"] ?? false}
            onChange={() => actions.togglePref("biometric")}
            label="Face ID for payslips"
          />
        </View>
        <View className="py-3.5">
          <Pressable
            onPress={() => actions.toast("Reset link sent to your email", "violet")}
            className="press flex w-full items-center justify-between text-left"
          >
            <Span className="font-semibold">Change password</Span>
            <Span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/45">
              Email link
            </Span>
          </Pressable>
        </View>
      </View>

      <SectionLabel className="mt-9">Notifications</SectionLabel>
      <View className="mt-3 divide-y divide-line/70 rounded-3xl border border-line/70 bg-card px-4">
        {PREFS.map((p) => (
          <View key={p.key} className="flex items-center gap-3 py-3.5">
            <View className="min-w-0 flex-1">
              <View className="block font-semibold leading-tight">{p.label}</View>
              <View className="block text-[13px] text-ink/55">{p.hint}</View>
            </View>
            <Toggle
              on={prefs[p.key] ?? false}
              onChange={() => actions.togglePref(p.key)}
              label={p.label}
            />
          </View>
        ))}
      </View>

      <SectionLabel className="mt-9">Prototype · preview as</SectionLabel>
      <View className="mt-3 rounded-3xl bg-paper-deep p-4">
        <Eyebrow tone="muted">Role changes what shows up</Eyebrow>
        <View className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <Chip key={r} tone="violet" active={role === r} onClick={() => actions.setRole(r)}>
              {ROLE_LABEL[r]}
            </Chip>
          ))}
        </View>
        <Text className="mt-3 text-[13px] leading-relaxed text-ink/60">
          Try Employee: Approvals, CRM and Settings disappear from More, and opening them directly
          shows a no-access state.
        </Text>
      </View>

      <Button
        tone="outline"
        icon={LogOut}
        className="mt-8 border-coral/50 text-coral-deep"
        onClick={() => {
          actions.toast("Signed out", "coral");
          void router.navigate({
            to: "/login",
          });
        }}
      >
        Sign out
      </Button>
      <Text className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink/35">
        Rhinon Mobile · prototype 0.1 · dummy data
      </Text>
    </Screen>
  );
}
