import { View, Text, Span, Pressable, Link } from "@/components/rn";
import {
  CalendarCheck,
  ChevronRight,
  Github,
  Linkedin,
  Lock,
  ScrollText,
} from "@/components/icons";
import { useState } from "react";
import {
  Badge,
  Button,
  Display,
  Eyebrow,
  NoAccess,
  Screen,
  SectionLabel,
  Sheet,
  Toggle,
  TopBar,
} from "@/components/rhinon/ui";
import { BRANDS } from "@/lib/mock-data";
import { PERM_RESOURCES, ROLE_META, type RoleId } from "@/lib/mock-more";
import { actions, useApp, usePerm } from "@/lib/store";
import { TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
const GROUPS = ["Everyday", "People", "Sales and support", "Platform"] as const;
export default function SettingsPage() {
  const allowed = usePerm("settings");
  const perms = useApp((s) => s.perms);
  const [role, setRole] = useState<RoleId | null>(null);
  const [calendar, setCalendar] = useState(true);
  if (!allowed) {
    return (
      <Screen>
        <TopBar title="Settings" fallback="/more" />
        <NoAccess
          title="Admins only"
          body="Workspace settings and permissions are limited to super admins."
        />
      </Screen>
    );
  }
  const meta = ROLE_META.find((r) => r.id === role);
  return (
    <Screen>
      <TopBar title="Settings" fallback="/more" />
      <View className="animate-rise">
        <Eyebrow>Rhinon Tech workspace</Eyebrow>
        <Display size="hero" className="mt-3">
          Set the
          {"\n"}
          rules.
        </Display>
      </View>

      <SectionLabel className="mb-3 mt-8">Roles and permissions</SectionLabel>
      <View className="space-y-2.5">
        {ROLE_META.map((r) => {
          const on = Object.values(perms[r.id]).filter((p) => p.read).length;
          return (
            <View key={r.id}>
              <Pressable
                onPress={() => setRole(r.id)}
                className="press flex w-full items-center gap-4 rounded-3xl border border-line/70 bg-card p-4 text-left"
              >
                <View className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet font-display text-[length:calc(26px*var(--ds))] leading-none text-violet-foreground">
                  {r.name[0]}
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex items-center gap-2 text-[16.5px] font-semibold leading-tight">
                    {r.name}
                    {r.locked ? <Lock size={14} className="text-ink/40" /> : null}
                  </View>
                  <View className="block text-[13px] text-ink/55">
                    {r.users} people · {on} of {PERM_RESOURCES.length} areas
                  </View>
                </View>
                <ChevronRight size={18} className="shrink-0 text-ink/30" />
              </Pressable>
            </View>
          );
        })}
      </View>
      <Text className="mt-3 text-[13px] leading-relaxed text-ink/55">
        Changes apply live. Anyone with that role sees the difference without signing in again.
      </Text>

      <SectionLabel className="mb-3 mt-9">Brands</SectionLabel>
      <View className="divide-y divide-line/70 rounded-3xl border border-line/70 bg-card px-4">
        {BRANDS.map((b) => (
          <View key={b.id} className="flex items-center gap-3.5 py-3.5">
            <View className={cn("size-3 rounded-full", TONES[b.tone].dot)} />
            <View className="min-w-0 flex-1">
              <View className="block font-semibold leading-tight">{b.name}</View>
              <View className="block font-mono text-[11px] text-ink/50">{b.domain}</View>
            </View>
            <Badge tone="leaf">Live</Badge>
          </View>
        ))}
      </View>

      <SectionLabel className="mb-3 mt-9">Connected accounts</SectionLabel>
      <View className="divide-y divide-line/70 rounded-3xl border border-line/70 bg-card px-4">
        <View className="flex items-center gap-3.5 py-3.5">
          <CalendarCheck size={22} className="shrink-0 text-ink/70" />
          <View className="min-w-0 flex-1">
            <View className="block font-semibold leading-tight">Google Calendar</View>
            <View className="block text-[13px] text-ink/55">
              {calendar ? "Meetings sync both ways" : "Not syncing"}
            </View>
          </View>
          <Toggle on={calendar} onChange={setCalendar} label="Google Calendar" />
        </View>
        <View className="flex items-center gap-3.5 py-3.5">
          <Github size={22} className="shrink-0 text-ink/70" />
          <View className="min-w-0 flex-1">
            <View className="block font-semibold leading-tight">GitHub</View>
            <View className="block text-[13px] text-ink/55">Commits grouped into tasks</View>
          </View>
          <Badge tone="leaf">Connected</Badge>
        </View>
        <View className="flex items-center gap-3.5 py-3.5">
          <Linkedin size={22} className="shrink-0 text-ink/70" />
          <View className="min-w-0 flex-1">
            <View className="block font-semibold leading-tight">LinkedIn</View>
            <View className="block text-[13px] text-ink/55">For outreach posts</View>
          </View>
          <Pressable
            onPress={() => actions.toast("Opening LinkedIn to connect…", "violet")}
            className="press h-9 rounded-full border border-ink/20 px-4 text-[13px] font-semibold"
          >
            Connect
          </Pressable>
        </View>
      </View>

      <Link
        to="/audit"
        className="press mt-5 flex items-center gap-3.5 rounded-3xl border border-line/70 bg-card p-4"
      >
        <ScrollText size={22} className="shrink-0 text-ink/70" />
        <View className="min-w-0 flex-1 font-semibold">Audit log</View>
        <ChevronRight size={18} className="text-ink/30" />
      </Link>

      <View className="mt-5 rounded-3xl border-2 border-dashed border-ink/20 p-4 text-[14px] leading-relaxed text-ink/60">
        Billing, deploys, provisioning, email domains and tenant management stay on the web.
      </View>

      <Sheet
        open={meta !== undefined}
        onClose={() => setRole(null)}
        eyebrow={meta ? `${meta.users} people` : ""}
        title={meta?.name ?? ""}
      >
        {meta ? (
          <View>
            <Text className="-mt-3 mb-5 text-[14px] text-ink/60">{meta.blurb}</Text>
            {GROUPS.map((g) => (
              <View key={g} className="mb-6">
                <View className="mb-1 grid grid-cols-[1fr_52px_52px] items-end gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
                  <Span>{g}</Span>
                  <Span className="text-center">Read</Span>
                  <Span className="text-center">Write</Span>
                </View>
                <View className="divide-y divide-line/70">
                  {PERM_RESOURCES.filter((r) => r.group === g).map((r) => {
                    const p = perms[meta.id][r.id] ?? {
                      read: false,
                      write: false,
                    };
                    return (
                      <View
                        key={r.id}
                        className="grid grid-cols-[1fr_52px_52px] items-center gap-2 py-2.5"
                      >
                        <Span className="truncate text-[15px] font-medium">{r.label}</Span>
                        <View className="grid place-items-center">
                          <MiniToggle
                            on={p.read}
                            locked={meta.locked}
                            label={`${r.label} read`}
                            onChange={(v) => actions.setPerm(meta.id, r.id, "read", v)}
                          />
                        </View>
                        <View className="grid place-items-center">
                          <MiniToggle
                            on={p.write}
                            locked={meta.locked}
                            label={`${r.label} write`}
                            onChange={(v) => actions.setPerm(meta.id, r.id, "write", v)}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
            <Button
              tone="ink"
              onClick={() => {
                actions.setRole(meta.id);
                setRole(null);
              }}
            >
              Preview the app as {meta.name}
            </Button>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
function MiniToggle({
  on,
  locked,
  label,
  onChange,
}: {
  on: boolean;
  locked: boolean;
  label: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      disabled={locked}
      onPress={() => onChange(!on)}
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-60",
        on ? "bg-leaf" : "bg-ink/20",
      )}
    >
      <View
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-paper shadow-sm transition-all duration-200",
          on ? "left-[18px]" : "left-0.5",
        )}
      />
    </Pressable>
  );
}
