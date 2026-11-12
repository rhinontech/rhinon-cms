import { useRev } from "@/lib/store";
import { View, Text, Pressable, TextInput, Link } from "@/components/rn";
import { Check, ChevronDown, Paperclip, PenLine, Search, Star } from "@/components/icons";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Display,
  Empty,
  Eyebrow,
  Fab,
  Field,
  Screen,
  Sheet,
  inputClass,
  stagger,
} from "@/components/rhinon/ui";
import { AttachmentRow, AttachSheet } from "@/components/rhinon/attach";
import { BRANDS, brandOf, type Thread } from "@/lib/mock-data";
import type { Attachment } from "@/lib/mock-more";
import { actions, useApp } from "@/lib/store";
import { TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
type Folder = "inbox" | "starred" | "sent" | "archive";
const DAY_ORDER = ["Today", "Tue", "Mon", "Sun"];
function senderOf(t: Thread): string {
  const other = [...t.messages].reverse().find((m) => !m.mine);
  return other?.from ?? "You";
}
export default function InboxPage() {
  useRev();
  const threads = useApp((s) => s.threads);
  const brand = useApp((s) => s.brand);
  const [folder, setFolder] = useState<Folder>("inbox");
  const [q, setQ] = useState("");
  const [picking, setPicking] = useState(false);
  const [composing, setComposing] = useState(false);
  const current = brandOf(brand);
  const mine = threads.filter((t) => t.brand === brand);
  const unread = mine.filter((t) => t.unread && t.folder === "inbox").length;
  const query = q.trim().toLowerCase();
  const list = mine
    .filter((t) => (folder === "starred" ? t.starred : t.folder === folder))
    .filter(
      (t) =>
        !query ||
        t.subject.toLowerCase().includes(query) ||
        senderOf(t).toLowerCase().includes(query) ||
        t.messages.some((m) => m.body.toLowerCase().includes(query)),
    )
    .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
  const groups: {
    day: string;
    items: Thread[];
  }[] = [];
  for (const t of list) {
    const g = groups.find((x) => x.day === t.day);
    if (g) g.items.push(t);
    else
      groups.push({
        day: t.day,
        items: [t],
      });
  }
  return (
    <Screen fab>
      <View className="animate-rise">
        <Pressable
          onPress={() => setPicking(true)}
          className="press inline-flex h-10 items-center gap-2 rounded-full border border-ink/15 bg-card pl-3.5 pr-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em]"
        >
          <View className={cn("size-2.5 rounded-full", TONES[current.tone].dot)} />
          {current.name}
          <ChevronDown size={15} />
        </Pressable>
        <View className="mt-5 flex items-end justify-between gap-3">
          <Display size="hero">Inbox</Display>
          {unread > 0 ? (
            <View className="mb-1.5 inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full bg-coral px-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-coral-foreground">
              {unread} unread
            </View>
          ) : null}
        </View>
      </View>

      <View className="relative mt-6 block animate-rise" style={stagger(1)}>
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
        />
        <TextInput
          className={cn(inputClass, "rounded-full py-3.5 pl-11")}
          placeholder="Search mail"
          value={q}
          onChangeText={(text) => setQ(text)}
          accessibilityLabel="Search mail"
        />
      </View>

      <View className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {(
          [
            ["inbox", "Inbox"],
            ["starred", "Starred"],
            ["sent", "Sent"],
            ["archive", "Archive"],
          ] as [Folder, string][]
        ).map(([v, l]) => (
          <Chip
            key={v}
            active={folder === v}
            onClick={() => setFolder(v)}
            count={v === "inbox" ? unread : undefined}
          >
            {l}
          </Chip>
        ))}
      </View>

      {groups.length === 0 ? (
        <Empty
          tone="coral"
          title={query ? "No matches" : folder === "archive" ? "Nothing archived" : "Inbox zero"}
          body={
            query
              ? `Nothing in ${current.name} mentions “${q}”.`
              : "Every thread here is handled. Go and do something fun."
          }
        />
      ) : (
        groups.map((g) => (
          <View key={g.day} className="mt-6">
            <Text className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-ink/50">
              {g.day}
            </Text>
            <View>
              {g.items.map((t, i) => (
                <ThreadRow key={t.id} t={t} i={i} />
              ))}
            </View>
          </View>
        ))
      )}

      <Fab icon={PenLine} label="Compose" tone="coral" onClick={() => setComposing(true)} />
      <BrandSheet open={picking} onClose={() => setPicking(false)} />
      <ComposeSheet open={composing} onClose={() => setComposing(false)} domain={current.domain} />
    </Screen>
  );
}
function ThreadRow({ t, i }: { t: Thread; i: number }) {
  const who = senderOf(t);
  const last = t.messages.at(-1);
  const preview = (last?.body ?? "").replace(/\s+/g, " ").trim();
  return (
    <View
      className="press relative animate-rise border-b border-line/70 last:border-0"
      style={stagger(Math.min(i + 2, 7))}
    >
      <Link
        to="/inbox/$threadId"
        params={{
          threadId: t.id,
        }}
        aria-label={`${who}: ${t.subject}`}
        className="absolute inset-0 z-0"
      />
      {t.unread ? (
        <View className="absolute -left-3.5 top-[30px] size-2 rounded-full bg-coral" />
      ) : null}
      <View className="pointer-events-none relative z-10 flex gap-3 py-3.5 pr-9">
        <Avatar name={who} size={46} />
        <View className="min-w-0 flex-1">
          <View className="flex items-baseline justify-between gap-2">
            <Text
              className={cn(
                "truncate text-[15.5px]",
                t.unread ? "font-bold" : "font-medium text-ink/80",
              )}
            >
              {who}
            </Text>
            <View className="shrink-0 font-mono text-[10.5px] text-ink/50">{t.time}</View>
          </View>
          <Text
            className={cn("truncate text-[14.5px]", t.unread ? "font-semibold" : "text-ink/75")}
          >
            {t.subject}
          </Text>
          <Text className="truncate text-[13.5px] text-ink/50">{preview}</Text>
          {t.labels.length > 0 || t.attachment ? (
            <View className="mt-2 flex items-center gap-1.5">
              {t.labels.map((l) => (
                <Badge key={l.text} tone={l.tone}>
                  {l.text}
                </Badge>
              ))}
              {t.attachment ? <Paperclip size={14} className="ml-0.5 text-ink/45" /> : null}
            </View>
          ) : null}
        </View>
      </View>
      <Pressable
        accessibilityLabel={t.starred ? "Remove star" : "Star"}
        onPress={() => actions.toggleStar(t.id)}
        className="absolute bottom-3 right-0 z-20 grid size-9 place-items-center rounded-full"
      >
        <Star
          size={19}
          className={cn("transition-colors", t.starred ? "fill-sun text-sun-deep" : "text-ink/30")}
        />
      </Pressable>
    </View>
  );
}
function BrandSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const threads = useApp((s) => s.threads);
  const brand = useApp((s) => s.brand);
  return (
    <Sheet open={open} onClose={onClose} eyebrow="Brand" title="Which inbox?">
      <View className="space-y-2.5">
        {BRANDS.map((b) => {
          const n = threads.filter(
            (t) => t.brand === b.id && t.unread && t.folder === "inbox",
          ).length;
          return (
            <View key={b.id}>
              <Pressable
                onPress={() => {
                  actions.setBrand(b.id);
                  onClose();
                }}
                className={cn(
                  "press flex w-full items-center gap-4 rounded-3xl p-4 text-left",
                  brand === b.id ? TONES[b.tone].solid : "border border-line/70 bg-card",
                )}
              >
                <View
                  className={cn(
                    "grid size-12 place-items-center rounded-2xl font-display text-[length:calc(26px*var(--ds))] font-black",
                    brand === b.id ? "bg-paper/20" : TONES[b.tone].solid,
                  )}
                >
                  {b.name[0]}
                </View>
                <View className="min-w-0 flex-1">
                  <View className="block text-[17px] font-semibold leading-tight">{b.name}</View>
                  <View className="block font-mono text-[11px] tracking-[0.08em] opacity-70">
                    {b.domain}
                  </View>
                </View>
                {brand === b.id ? (
                  <Check size={20} strokeWidth={2.6} />
                ) : n > 0 ? (
                  <View className="rounded-full bg-coral px-2 py-0.5 font-mono text-[11px] text-coral-foreground">
                    {n}
                  </View>
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>
      <Text className="mt-5 text-[13px] leading-relaxed text-ink/55">
        Inbox, CRM and Outreach are kept separate for each brand, so replies never get mixed up.
      </Text>
    </Sheet>
  );
}
function ComposeSheet({
  open,
  onClose,
  domain,
}: {
  open: boolean;
  onClose: () => void;
  domain: string;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [picking, setPicking] = useState(false);
  const send = () => {
    if (!to.trim()) return;
    actions.compose(to.trim(), subject.trim(), body.trim(), files);
    setTo("");
    setSubject("");
    setBody("");
    setFiles([]);
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} eyebrow="New message" title="Write something">
      <View className="space-y-4">
        <Field label="From">
          <View className="flex h-12 items-center rounded-2xl bg-paper-deep px-4 font-mono text-[13px] text-ink/70">
            kabir@{domain}
          </View>
        </Field>
        <Field label="To">
          <TextInput
            className={inputClass}
            value={to}
            onChangeText={(text) => setTo(text)}
            placeholder="name@company.com"
          />
        </Field>
        <Field label="Subject">
          <TextInput
            className={inputClass}
            value={subject}
            onChangeText={(text) => setSubject(text)}
            placeholder="Subject"
          />
        </Field>
        <Field label="Message">
          <TextInput
            className={cn(inputClass, "min-h-32 resize-none")}
            value={body}
            onChangeText={(text) => setBody(text)}
            placeholder="Write your message…"
            multiline
          />
        </Field>
        {files.length > 0 ? (
          <View className="space-y-2">
            {files.map((f) => (
              <AttachmentRow
                key={f.id}
                file={f}
                onRemove={(x) => setFiles((cur) => cur.filter((y) => y.id !== x.id))}
              />
            ))}
          </View>
        ) : null}
        <View className="flex items-center gap-3">
          <Chip onClick={() => setPicking(true)}>
            <Paperclip size={14} />
            Attach
          </Chip>
          <Eyebrow tone="muted" className="!tracking-[0.12em]">
            Plain text
          </Eyebrow>
        </View>
        <Button tone="coral" onClick={send} disabled={!to.trim()}>
          Send
        </Button>
      </View>
      <AttachSheet
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(picked) => setFiles((cur) => [...cur, ...picked])}
      />
    </Sheet>
  );
}
