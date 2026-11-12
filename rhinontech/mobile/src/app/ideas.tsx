import { useRev } from "@/lib/store";
import { View, Text, Span, Pressable } from "@/components/rn";
import { Mail } from "@/components/icons";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Display,
  Empty,
  Eyebrow,
  NoAccess,
  Screen,
  Sheet,
  TopBar,
  stagger,
} from "@/components/rhinon/ui";
import { IDEA_STATUSES, type Idea, type IdeaStatus } from "@/lib/mock-more";
import { actions, useApp, usePerm } from "@/lib/store";
import type { Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
const STATUS_TONE: Record<IdeaStatus, Tone> = {
  New: "coral",
  Reviewing: "sky",
  Interesting: "sun",
  Converted: "leaf",
  Archived: "ink",
};
export default function IdeasPage() {
  useRev();
  const ideas = useApp((s) => s.ideas);
  const allowed = usePerm("ideas");
  const [filter, setFilter] = useState<"All" | IdeaStatus>("All");
  const [open, setOpen] = useState<string | null>(null);
  if (!allowed) {
    return (
      <Screen>
        <TopBar title="Startup ideas" fallback="/more" />
        <NoAccess
          title="No access to ideas"
          body="Submissions from the /build campaign are limited to admins."
        />
      </Screen>
    );
  }
  const rows = ideas.filter((i) => filter === "All" || i.status === filter);
  const fresh = ideas.filter((i) => i.unread).length;
  const idea = ideas.find((i) => i.id === open);
  return (
    <Screen>
      <TopBar title="Startup ideas" fallback="/more" />
      <View className="animate-rise">
        <Eyebrow tone="sun">
          {fresh} unread · {ideas.length} total
        </Eyebrow>
        <Display size="hero" className="mt-3">
          Ideas
          {"\n"}
          in.
        </Display>
        <Text className="mt-4 text-[15px] leading-relaxed text-ink/60">
          Ideas stay out of the CRM until you convert one.
        </Text>
      </View>

      <View className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {(["All", ...IDEA_STATUSES] as const).map((f) => (
          <Chip
            key={f}
            tone="sun"
            active={filter === f}
            onClick={() => setFilter(f)}
            count={
              f === "New" ? ideas.filter((i) => i.status === "New").length || undefined : undefined
            }
          >
            {f}
          </Chip>
        ))}
      </View>

      {rows.length === 0 ? (
        <Empty tone="sun" title="Nothing here" body="No ideas match this filter." />
      ) : (
        <View className="mt-3">
          {rows.map((i, n) => (
            <View
              key={i.id}
              className="relative animate-rise border-b border-line/70 last:border-0"
              style={stagger(Math.min(n, 6))}
            >
              {i.unread ? (
                <View className="absolute -left-3.5 top-[34px] size-2 rounded-full bg-coral" />
              ) : null}
              <Pressable
                onPress={() => {
                  setOpen(i.id);
                  actions.readIdea(i.id);
                }}
                className="press flex w-full items-start gap-3.5 py-4 text-left"
              >
                <Avatar name={i.founder} size={48} />
                <View className="min-w-0 flex-1">
                  <View className="flex items-baseline justify-between gap-2">
                    <Span
                      className={cn(
                        "truncate text-[17px] leading-tight",
                        i.unread ? "font-bold" : "font-semibold",
                      )}
                    >
                      {i.title}
                    </Span>
                    <View className="shrink-0 font-mono text-[10px] text-ink/45">{i.at}</View>
                  </View>
                  <View className="mt-0.5 block text-[14px] leading-snug text-ink/65">
                    {i.oneLiner}
                  </View>
                  <View className="mt-2 flex items-center gap-2">
                    <Badge tone={STATUS_TONE[i.status]}>{i.status}</Badge>
                    <Span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
                      {i.stage} · {i.founder}
                    </Span>
                  </View>
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Sheet
        open={idea !== undefined}
        onClose={() => setOpen(null)}
        eyebrow={idea ? `${idea.stage} · from ${idea.founder}` : ""}
      >
        {idea ? <IdeaDetail idea={idea} /> : null}
      </Sheet>
    </Screen>
  );
}
function IdeaDetail({ idea }: { idea: Idea }) {
  return (
    <View>
      <Display as="h2" size="lg">
        {idea.title}
      </Display>
      <Text className="mt-2 text-[16px] leading-snug text-ink/80">{idea.oneLiner}</Text>
      <Text className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
        The problem
      </Text>
      <Text className="rounded-2xl border border-line/70 bg-card p-4 text-[15px] leading-relaxed">
        {idea.problem}
      </Text>

      <Text className="mb-2 mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50">
        Status
      </Text>
      <View className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {IDEA_STATUSES.filter((s) => s !== "Converted").map((s) => (
          <Chip
            key={s}
            tone={STATUS_TONE[s]}
            active={idea.status === s}
            onClick={() => actions.setIdeaStatus(idea.id, s)}
          >
            {s}
          </Chip>
        ))}
      </View>

      <View className="mt-6 grid grid-cols-[auto_1fr] gap-2.5">
        <Pressable
          accessibilityLabel={`Email ${idea.founder}`}
          onPress={() => actions.toast(`Draft to ${idea.email}`, "sun")}
          className="press grid size-14 place-items-center rounded-full border border-ink/20"
        >
          <Mail size={20} />
        </Pressable>
        <Button
          tone="ink"
          disabled={idea.status === "Converted"}
          onClick={() => actions.convertIdea(idea.id)}
        >
          {idea.status === "Converted" ? "Already in the CRM" : "Convert to a CRM lead"}
        </Button>
      </View>
    </View>
  );
}
