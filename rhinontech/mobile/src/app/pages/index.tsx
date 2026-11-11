import { View, Pressable, TextInput, Link } from "@/components/rn";
import { useRouter } from "@/lib/router";
import { ChevronDown, ChevronRight, Plus, Search } from "@/components/icons";
import { useState } from "react";
import {
  Button,
  Chip,
  Display,
  Empty,
  Eyebrow,
  Fab,
  Field,
  Screen,
  Sheet,
  TopBar,
  inputClass,
  stagger,
} from "@/components/rhinon/ui";
import { WIKI_ICON } from "@/components/rhinon/wiki";
import type { WikiPage } from "@/lib/mock-more";
import { actions, useApp } from "@/lib/store";
import { TONES } from "@/lib/tone";
import { cn } from "@/lib/utils";
function PageRow({
  p,
  child = false,
  index = 0,
}: {
  p: WikiPage;
  child?: boolean;
  index?: number;
}) {
  const Icon = WIKI_ICON[p.icon];
  return (
    <Link
      to="/pages/$pageId"
      params={{
        pageId: p.id,
      }}
      className={cn(
        "press flex animate-rise items-center gap-3.5 rounded-2xl border border-line/70 bg-card p-3",
        child && "ml-7",
      )}
      style={stagger(Math.min(index, 7))}
    >
      <View
        className={cn("grid size-11 shrink-0 place-items-center rounded-xl", TONES[p.tone].solid)}
      >
        <Icon size={20} />
      </View>
      <View className="min-w-0 flex-1">
        <View className="block truncate text-[15.5px] font-semibold leading-tight">{p.title}</View>
        <View className="block font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
          Updated {p.updated}
        </View>
      </View>
      <ChevronRight size={17} className="shrink-0 text-ink/30" />
    </Link>
  );
}
export default function PagesPage() {
  const pages = useApp((s) => s.pages);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [closed, setClosed] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const query = q.trim().toLowerCase();
  const roots = pages.filter((p) => p.parent === null);
  const kids = (id: string) => pages.filter((p) => p.parent === id);
  const hits = query
    ? pages.filter(
        (p) => p.title.toLowerCase().includes(query) || p.body.toLowerCase().includes(query),
      )
    : [];
  return (
    <Screen fab>
      <TopBar title="Pages" fallback="/more" />
      <View className="animate-rise">
        <Eyebrow tone="cobalt">{pages.length} pages</Eyebrow>
        <Display size="hero" className="mt-3">
          Write it
          {"\n"}
          down.
        </Display>
      </View>

      <View className="relative mt-6 block">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
        />
        <TextInput
          className={cn(inputClass, "rounded-full py-3.5 pl-11")}
          placeholder="Search pages"
          accessibilityLabel="Search pages"
          value={q}
          onChangeText={(text) => setQ(text)}
        />
      </View>

      {query ? (
        hits.length === 0 ? (
          <Empty tone="cobalt" title="No pages found" body={`Nothing mentions “${q}”.`} />
        ) : (
          <View className="mt-4 space-y-2.5">
            {hits.map((p, i) => (
              <PageRow key={p.id} p={p} index={i} />
            ))}
          </View>
        )
      ) : (
        <View className="mt-5 space-y-2.5">
          {roots.map((p, i) => {
            const children = kids(p.id);
            const isClosed = closed.includes(p.id);
            return (
              <View key={p.id} className="space-y-2.5">
                <View className="flex items-center gap-2">
                  <View className="min-w-0 flex-1">
                    <PageRow p={p} index={i} />
                  </View>
                  {children.length > 0 ? (
                    <Pressable
                      accessibilityLabel={
                        isClosed ? `Show pages inside ${p.title}` : `Hide pages inside ${p.title}`
                      }
                      onPress={() =>
                        setClosed((c) => (isClosed ? c.filter((x) => x !== p.id) : [...c, p.id]))
                      }
                      className="press grid size-10 shrink-0 place-items-center rounded-full border border-ink/15"
                    >
                      {isClosed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </Pressable>
                  ) : null}
                </View>
                {!isClosed
                  ? children.map((c, j) => <PageRow key={c.id} p={c} child index={i + j + 1} />)
                  : null}
              </View>
            );
          })}
        </View>
      )}

      <Fab icon={Plus} label="New page" tone="cobalt" pushed onClick={() => setCreating(true)} />

      <NewPageSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(title, parent) => {
          const id = actions.createPage(title, parent);
          void router.navigate({
            to: "/pages/$pageId",
            params: {
              pageId: id,
            },
          });
        }}
      />
    </Screen>
  );
}
function NewPageSheet({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, parent: string | null) => void;
}) {
  const pages = useApp((s) => s.pages).filter((p) => p.parent === null);
  const [title, setTitle] = useState("");
  const [parent, setParent] = useState<string | null>(null);
  return (
    <Sheet open={open} onClose={onClose} eyebrow="New page" title="What's it called?">
      <View className="space-y-5">
        <Field label="Title">
          <TextInput
            className={inputClass}
            value={title}
            onChangeText={(text) => setTitle(text)}
            placeholder="e.g. Release notes process"
            autoFocus
          />
        </Field>
        <Field label="Put it inside">
          <View className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            <Chip tone="cobalt" active={parent === null} onClick={() => setParent(null)}>
              Top level
            </Chip>
            {pages.map((p) => (
              <Chip
                key={p.id}
                tone="cobalt"
                active={parent === p.id}
                onClick={() => setParent(p.id)}
              >
                {p.title}
              </Chip>
            ))}
          </View>
        </Field>
        <Button
          tone="ink"
          disabled={!title.trim()}
          onClick={() => {
            onCreate(title.trim(), parent);
            setTitle("");
            setParent(null);
            onClose();
          }}
        >
          Create page
        </Button>
      </View>
    </Sheet>
  );
}
