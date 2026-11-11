import { loadPage, useLoad } from "@/lib/live";
import { useRev } from "@/lib/store";
import { View, Text, Span, Pressable, TextInput, Link } from "@/components/rn";
import { useLocalSearchParams } from "expo-router";
import {
  Bold,
  CheckSquare,
  Heading2,
  Link2,
  List,
  Pencil,
  Quote,
  Share2,
} from "@/components/icons";
import { useRef, useState } from "react";
import { Markdown, toggleLine } from "@/components/rhinon/md";
import { WIKI_ICON } from "@/components/rhinon/wiki";
import {
  Avatar,
  AvatarStack,
  Button,
  Display,
  Empty,
  IconButton,
  Screen,
  SectionLabel,
  Sheet,
  Toggle,
  TopBar,
  inputClass,
} from "@/components/rhinon/ui";
import { PEOPLE, nameOf } from "@/lib/mock-data";
import { actions, useApp } from "@/lib/store";
import { TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
const SNIPPETS = [
  {
    label: "Heading",
    icon: Heading2,
    text: "\n## Heading\n",
  },
  {
    label: "Bold",
    icon: Bold,
    text: "**bold**",
  },
  {
    label: "Bullet",
    icon: List,
    text: "\n- ",
  },
  {
    label: "Checklist",
    icon: CheckSquare,
    text: "\n- [ ] ",
  },
  {
    label: "Callout",
    icon: Quote,
    text: "\n> ",
  },
] as const;
export default function PageView() {
  useRev();
  const { pageId } = useLocalSearchParams<{
    pageId: string;
  }>();
  useLoad(loadPage, pageId);
  const page = useApp((s) => s.pages.find((p) => p.id === pageId));
  const children = useApp((s) => s.pages).filter((p) => p.parent === pageId);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sharing, setSharing] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  if (!page) {
    return (
      <Screen>
        <TopBar title="Page" fallback="/pages" />
        <Empty title="Page not found" body="It may have been moved or deleted." tone="cobalt" />
      </Screen>
    );
  }
  const Icon = WIKI_ICON[page.icon];
  const startEdit = () => {
    setTitle(page.title);
    setBody(page.body);
    setEditing(true);
  };
  const insert = (text: string) => {
    const el = area.current;
    const at = el?.selectionStart ?? body.length;
    setBody(body.slice(0, at) + text + body.slice(at));
    window.setTimeout(() => {
      el?.focus();
      el?.setSelectionRange(at + text.length, at + text.length);
    }, 0);
  };
  return (
    <Screen>
      <TopBar
        title={editing ? "Editing" : "Page"}
        fallback="/pages"
        right={
          editing ? null : (
            <>
              <IconButton icon={Share2} label="Share" onClick={() => setSharing(true)} />
              <IconButton icon={Pencil} label="Edit page" onClick={startEdit} />
            </>
          )
        }
      />

      <View className={cn("animate-rise rounded-3xl p-5", TONES[page.tone].solid)}>
        <View className="grid size-14 place-items-center rounded-2xl bg-paper/20">
          <Icon size={28} />
        </View>
        {editing ? (
          <TextInput
            className="mt-5 w-full bg-transparent font-display text-[length:max(30px,calc(46px*var(--ds)))] leading-[0.95] outline-none placeholder:opacity-50"
            value={title}
            onChangeText={(text) => setTitle(text)}
            accessibilityLabel="Page title"
          />
        ) : (
          <Display size="xl" className="mt-5">
            {page.title}
          </Display>
        )}
        <View className="mt-4 flex items-center justify-between gap-3">
          <Text className="font-mono text-[10.5px] uppercase tracking-[0.12em] opacity-85">
            Updated {page.updated} · {nameOf(page.by).split(" ")[0]}
          </Text>
          <AvatarStack
            names={page.sharedWith.map(nameOf)}
            size={24}
            max={3}
            ring={TONES[page.tone].border}
          />
        </View>
      </View>

      {editing ? (
        <View className="mt-4">
          <View className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
            {SNIPPETS.map((s) => {
              const I = s.icon;
              return (
                <Pressable
                  key={s.label}
                  accessibilityLabel={`Insert ${s.label}`}
                  onPress={() => insert(s.text)}
                  className="press inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-ink/20 bg-card px-3.5 text-[13px] font-medium"
                >
                  <I size={16} /> {s.label}
                </Pressable>
              );
            })}
          </View>
          <TextInput
            ref={area}
            value={body}
            onChangeText={(text) => setBody(text)}
            accessibilityLabel="Page body"
            className={cn(
              inputClass,
              "min-h-[320px] resize-none font-mono text-[14px] leading-relaxed",
            )}
            multiline
          />
          <View className="mt-4 grid grid-cols-2 gap-2.5">
            <Button tone="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              tone="ink"
              onClick={() => {
                actions.savePage(page.id, title.trim() || page.title, body);
                setEditing(false);
              }}
            >
              Save
            </Button>
          </View>
          <Text className="mt-3 text-center text-[12.5px] text-ink/50">
            Slash-command blocks and drag-to-reorder stay on the web.
          </Text>
        </View>
      ) : (
        <View className="mt-6">
          <Markdown
            source={page.body}
            onToggle={(line) => actions.setPageBody(page.id, toggleLine(page.body, line))}
          />

          {children.length > 0 ? (
            <>
              <SectionLabel className="mb-3 mt-9">Pages inside</SectionLabel>
              <View className="space-y-2">
                {children.map((c) => (
                  <View key={c.id}>
                    <Link
                      to="/pages/$pageId"
                      params={{
                        pageId: c.id,
                      }}
                      className="press flex items-center justify-between rounded-2xl border border-line/70 bg-card px-4 py-3.5 text-[15.5px] font-semibold"
                    >
                      {c.title}
                      <Span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
                        {c.updated}
                      </Span>
                    </Link>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>
      )}

      <ShareSheet
        open={sharing}
        onClose={() => setSharing(false)}
        shared={page.sharedWith}
        link={page.linkShare}
        onSave={(people, link) => actions.sharePage(page.id, people, link)}
      />
    </Screen>
  );
}
function ShareSheet({
  open,
  onClose,
  shared,
  link,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  shared: string[];
  link: boolean;
  onSave: (people: string[], link: boolean) => void;
}) {
  const [people, setPeople] = useState<string[]>(shared);
  const [anyone, setAnyone] = useState(link);
  return (
    <Sheet open={open} onClose={onClose} eyebrow="Share" title="Who can read this?">
      <View className="space-y-5">
        <View>
          {PEOPLE.map((p) => {
            const on = people.includes(p.id);
            return (
              <View key={p.id}>
                <Pressable
                  onPress={() =>
                    setPeople((cur) => (on ? cur.filter((x) => x !== p.id) : [...cur, p.id]))
                  }
                  className="press flex w-full items-center gap-3.5 border-b border-line/70 py-3 text-left last:border-0"
                >
                  <Avatar name={p.name} size={40} />
                  <View className="min-w-0 flex-1">
                    <View className="block truncate font-semibold leading-tight">{p.name}</View>
                    <View className="block text-[12.5px] text-ink/55">{p.role}</View>
                  </View>
                  <View
                    className={cn(
                      "grid size-6 place-items-center rounded-full border-2 transition-colors",
                      on ? "border-ink bg-ink text-paper" : "border-ink/25",
                    )}
                  >
                    {on ? <View className="size-2 rounded-full bg-paper" /> : null}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
        <View className="flex items-center gap-3 rounded-2xl bg-paper-deep p-4">
          <Link2 size={20} className="shrink-0 text-ink/60" />
          <View className="min-w-0 flex-1">
            <View className="block font-semibold leading-tight">Anyone with the link</View>
            <View className="block text-[12.5px] text-ink/55">Can read, not edit</View>
          </View>
          <Toggle on={anyone} onChange={setAnyone} label="Anyone with the link" />
        </View>
        <Button
          tone="ink"
          onClick={() => {
            onSave(people, anyone);
            onClose();
          }}
        >
          Save sharing
        </Button>
      </View>
    </Sheet>
  );
}
