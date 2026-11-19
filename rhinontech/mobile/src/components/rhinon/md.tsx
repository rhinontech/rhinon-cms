import { View, Text, Span, Pressable } from "@/components/rn";
import { Check } from "@/components/icons";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** **bold** and `code` inside a line of text. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <Span key={i}>{part.slice(2, -2)}</Span>;
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <View key={i} className="rounded-md bg-ink/8 px-1.5 py-0.5 font-mono text-[0.88em]">
          {part.slice(1, -1)}
        </View>
      );
    }
    return part;
  });
}
type Block =
  | {
      kind: "h1" | "h2" | "p" | "quote";
      text: string;
      line: number;
    }
  | {
      kind: "ul";
      items: {
        text: string;
        line: number;
        check: boolean | null;
      }[];
    };
function parse(source: string): Block[] {
  const blocks: Block[] = [];
  source.split("\n").forEach((raw, line) => {
    const t = raw.trimEnd();
    if (!t.trim()) return;
    const last = blocks[blocks.length - 1];
    const item = t.match(/^- (\[( |x)\] )?(.*)$/);
    if (item) {
      const entry = {
        text: item[3] ?? "",
        line,
        check: item[1] ? item[2] === "x" : null,
      };
      if (last?.kind === "ul") last.items.push(entry);
      else
        blocks.push({
          kind: "ul",
          items: [entry],
        });
    } else if (t.startsWith("## "))
      blocks.push({
        kind: "h2",
        text: t.slice(3),
        line,
      });
    else if (t.startsWith("# "))
      blocks.push({
        kind: "h1",
        text: t.slice(2),
        line,
      });
    else if (t.startsWith("> "))
      blocks.push({
        kind: "quote",
        text: t.slice(2),
        line,
      });
    else
      blocks.push({
        kind: "p",
        text: t,
        line,
      });
  });
  return blocks;
}

/**
 * A tiny reader for page bodies: #, ##, bullets, - [ ] checklists, > callouts, **bold**, `code`.
 * Tapping a checklist item calls onToggle with its line number.
 */
export function Markdown({
  source,
  onToggle,
}: {
  source: string;
  onToggle?: (line: number) => void;
}) {
  return (
    <View className="space-y-4">
      {parse(source).map((b, i) => {
        if (b.kind === "h1") return null; // the page title already shows it
        if (b.kind === "h2") {
          return (
            <Text
              key={i}
              className="pt-2 font-display text-[length:max(22px,calc(26px*var(--ds)))] leading-none"
            >
              {b.text}
            </Text>
          );
        }
        if (b.kind === "quote") {
          return (
            <Text
              key={i}
              className="rounded-2xl border-l-4 border-sun bg-sun/25 px-4 py-3 text-[15px] leading-relaxed"
            >
              {inline(b.text)}
            </Text>
          );
        }
        if (b.kind === "ul") {
          return (
            <View key={i} className="space-y-1.5">
              {b.items.map((it) => (
                <View key={it.line} className="flex items-start gap-3 text-[16px] leading-relaxed">
                  {it.check === null ? (
                    <View className="mt-[11px] size-1.5 shrink-0 rounded-full bg-ink/50" />
                  ) : (
                    <Pressable
                      accessibilityLabel={it.check ? "Mark as not done" : "Mark as done"}
                      disabled={!onToggle}
                      onPress={() => onToggle?.(it.line)}
                      className={cn(
                        "mt-[3px] grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors",
                        it.check
                          ? "border-cobalt bg-cobalt text-cobalt-foreground"
                          : "border-ink/30",
                      )}
                    >
                      {it.check ? <Check size={13} strokeWidth={3.4} /> : null}
                    </Pressable>
                  )}
                  <Span className={cn(it.check && "text-ink/50 line-through")}>
                    {inline(it.text)}
                  </Span>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text key={i} className="text-[16px] leading-relaxed text-ink/85">
            {inline(b.text)}
          </Text>
        );
      })}
    </View>
  );
}

/** Flip a "- [ ]" / "- [x]" line in a page body. */
export function toggleLine(source: string, line: number): string {
  return source
    .split("\n")
    .map((l, i) => {
      if (i !== line) return l;
      if (l.includes("- [ ] ")) return l.replace("- [ ] ", "- [x] ");
      if (l.includes("- [x] ")) return l.replace("- [x] ", "- [ ] ");
      return l;
    })
    .join("\n");
}
