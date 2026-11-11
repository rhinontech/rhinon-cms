import { View, Text, Span, Pressable, Link } from "@/components/rn";
import { ScanLine } from "@/components/icons";
import { useState } from "react";
import {
  Badge,
  Button,
  Display,
  Empty,
  Eyebrow,
  NoAccess,
  ProgressBar,
  Screen,
  Segmented,
  Sheet,
  TopBar,
  stagger,
} from "@/components/rhinon/ui";
import { BRANDS, nameOf } from "@/lib/mock-data";
import { EVENTS, type Post } from "@/lib/mock-more";
import { actions, useApp, usePerm } from "@/lib/store";
import { TONES, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";
const POST_TONE: Record<Post["status"], Tone> = {
  Review: "sun",
  Approved: "leaf",
  "Changes requested": "coral",
};
export default function ContentPage() {
  const guests = useApp((s) => s.guests);
  const posts = useApp((s) => s.posts);
  const allowed = usePerm("content");
  const [tab, setTab] = useState<"events" | "posts">("events");
  const [open, setOpen] = useState<string | null>(null);
  if (!allowed) {
    return (
      <Screen>
        <TopBar title="Content" fallback="/more" />
        <NoAccess
          title="No access to content"
          body="Events and posts are limited to admins on the platform team."
        />
      </Screen>
    );
  }
  const waiting = posts.filter((p) => p.status === "Review").length;
  const post = posts.find((p) => p.id === open);
  return (
    <Screen>
      <TopBar title="Content" fallback="/more" />
      <View className="animate-rise">
        <Eyebrow tone="rose">{waiting} posts to approve</Eyebrow>
        <Display size="hero" className="mt-3">
          Doors
          {"\n"}
          open.
        </Display>
      </View>

      <Segmented
        className="mt-6"
        value={tab}
        onChange={setTab}
        options={[
          {
            value: "events",
            label: "Events",
          },
          {
            value: "posts",
            label: "Posts",
            badge: waiting || undefined,
          },
        ]}
      />

      {tab === "events" ? (
        <View className="mt-5 space-y-3">
          {EVENTS.map((e, i) => {
            const list = guests[e.id] ?? [];
            const inside = list.filter((g) => g.checkedIn).length;
            const brand = BRANDS.find((b) => b.id === e.brand);
            return (
              <View
                key={e.id}
                className={cn("animate-rise rounded-3xl p-5", TONES[e.tone].solid)}
                style={stagger(i)}
              >
                <Text className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] opacity-85">
                  {e.when} · {brand?.name}
                </Text>
                <Display as="h3" size="lg" className="mt-3">
                  {e.title}
                </Display>
                <Text className="mt-1 text-[14px] opacity-85">{e.where}</Text>
                <View className="mt-5 flex items-end justify-between">
                  <Text className="font-display text-[length:calc(56px*var(--ds))] leading-[0.8]">
                    {inside}
                    <Span className="text-[length:calc(28px*var(--ds))] opacity-65">
                      /{list.length}
                    </Span>
                  </Text>
                  <Text className="pb-1 font-mono text-[10.5px] uppercase tracking-[0.14em] opacity-85">
                    checked in · cap {e.capacity}
                  </Text>
                </View>
                <ProgressBar
                  value={list.length ? inside / list.length : 0}
                  tone="paper"
                  track="bg-paper/25"
                  className="mt-3"
                />
                <Link
                  to="/content/checkin/$eventId"
                  params={{
                    eventId: e.id,
                  }}
                  className="press mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-paper"
                >
                  <ScanLine size={18} /> Check in guests
                </Link>
              </View>
            );
          })}
          <View className="pt-1 text-center text-[13px] text-ink/50">
            Creating events, tickets and certificates stays on the web.
          </View>
        </View>
      ) : (
        <View className="mt-5 space-y-3">
          {posts.length === 0 ? (
            <Empty tone="rose" title="No posts" body="Drafts waiting for approval show up here." />
          ) : null}
          {posts.map((p, i) => {
            const brand = BRANDS.find((b) => b.id === p.brand);
            return (
              <View key={p.id} className="animate-rise" style={stagger(Math.min(i, 5))}>
                <Pressable
                  onPress={() => setOpen(p.id)}
                  className="press w-full rounded-3xl border border-line/70 bg-card p-4 text-left"
                >
                  <View className="flex items-center justify-between gap-3">
                    <Badge tone={brand?.tone ?? "ink"}>{brand?.name}</Badge>
                    <Badge tone={POST_TONE[p.status]}>{p.status}</Badge>
                  </View>
                  <Display as="h3" size="md" className="mt-3">
                    {p.title}
                  </Display>
                  <Text className="mt-2 text-[14px] leading-relaxed text-ink/65">{p.excerpt}</Text>
                  <Text className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/45">
                    {p.kind} · {nameOf(p.author).split(" ")[0]} · {p.words} words
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <Sheet
        open={post !== undefined}
        onClose={() => setOpen(null)}
        eyebrow={post ? `${post.kind} · ${post.words} words` : ""}
      >
        {post ? (
          <View>
            <Display as="h2" size="lg">
              {post.title}
            </Display>
            <View className="mt-4 space-y-3.5">
              {post.paragraphs.map((t, i) => (
                <Text
                  key={i}
                  className={cn(
                    "text-[15.5px] leading-relaxed",
                    i === 0 ? "text-ink" : "text-ink/75",
                  )}
                >
                  {t}
                </Text>
              ))}
            </View>
            {post.status === "Review" ? (
              <View className="mt-6 grid grid-cols-2 gap-2.5">
                <Button
                  tone="outline"
                  onClick={() => {
                    actions.decidePost(post.id, "Changes requested");
                    setOpen(null);
                  }}
                >
                  Request changes
                </Button>
                <Button
                  tone="leaf"
                  onClick={() => {
                    actions.decidePost(post.id, "Approved");
                    setOpen(null);
                  }}
                >
                  Approve
                </Button>
              </View>
            ) : (
              <Text className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50">
                {post.status}
              </Text>
            )}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
