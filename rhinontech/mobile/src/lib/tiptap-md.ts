/**
 * Pages are stored as TipTap/ProseMirror JSON on the web; the phone renders and edits a small Markdown subset
 * (# ## headings, > quotes, - lists, - [ ] checklists, **bold**, `code`). These convert between the two.
 */
type Mark = { type: string; attrs?: Record<string, unknown> };
type PNode = { type: string; attrs?: Record<string, any>; content?: PNode[]; text?: string; marks?: Mark[] };

function inline(nodes: PNode[] = []): string {
  return nodes.map((n) => {
    if (n.type === "hardBreak") return " ";
    const t = n.text ?? "";
    if (!t) return "";
    const m = (n.marks ?? []).map((x) => x.type);
    if (m.includes("code")) return `\`${t}\``;
    if (m.includes("bold")) return `**${t}**`;
    return t;
  }).join("");
}

function listItems(list: PNode, check: boolean): string[] {
  return (list.content ?? []).flatMap((li) => {
    const own = (li.content ?? []).filter((c) => c.type === "paragraph").map((p) => inline(p.content)).join(" ");
    const nested = (li.content ?? []).filter((c) => /List$/.test(c.type)).flatMap((l) => listItems(l, l.type === "taskList"));
    const box = check ? `[${li.attrs?.checked ? "x" : " "}] ` : "";
    return [`- ${box}${own}`, ...nested];
  });
}

export function toMarkdown(doc: PNode | null | undefined): string {
  if (!doc?.content) return "";
  const out: string[] = [];
  for (const n of doc.content) {
    if (n.type === "heading") out.push(`${(n.attrs?.level ?? 1) === 1 ? "#" : "##"} ${inline(n.content)}`);
    else if (n.type === "paragraph") out.push(inline(n.content));
    else if (n.type === "blockquote") out.push((n.content ?? []).map((p) => `> ${inline(p.content)}`).join("\n"));
    else if (n.type === "bulletList" || n.type === "orderedList") out.push(listItems(n, false).join("\n"));
    else if (n.type === "taskList") out.push(listItems(n, true).join("\n"));
    else if (n.type === "codeBlock") out.push(`\`${inline(n.content)}\``);
  }
  return out.filter((x, i) => x || out[i - 1]).join("\n\n");
}

function inlineNodes(text: string): PNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part): PNode => {
    if (part.startsWith("**") && part.endsWith("**")) return { type: "text", text: part.slice(2, -2), marks: [{ type: "bold" }] };
    if (part.startsWith("`") && part.endsWith("`")) return { type: "text", text: part.slice(1, -1), marks: [{ type: "code" }] };
    return { type: "text", text: part };
  });
}
const para = (text: string): PNode => (text ? { type: "paragraph", content: inlineNodes(text) } : { type: "paragraph" });

export function fromMarkdown(md: string): PNode {
  const content: PNode[] = [];
  let list: PNode | null = null;
  for (const raw of md.split("\n")) {
    const t = raw.trimEnd();
    const item = t.match(/^- (\[( |x)\] )?(.*)$/);
    if (item) {
      const task = !!item[1];
      if (!list || (list.type === "taskList") !== task) { list = { type: task ? "taskList" : "bulletList", content: [] }; content.push(list); }
      list.content!.push({ type: task ? "taskItem" : "listItem", ...(task ? { attrs: { checked: item[2] === "x" } } : {}), content: [para(item[3] ?? "")] });
      continue;
    }
    list = null;
    if (!t.trim()) continue;
    if (t.startsWith("## ")) content.push({ type: "heading", attrs: { level: 2 }, content: inlineNodes(t.slice(3)) });
    else if (t.startsWith("# ")) content.push({ type: "heading", attrs: { level: 1 }, content: inlineNodes(t.slice(2)) });
    else if (t.startsWith("> ")) content.push({ type: "blockquote", content: [para(t.slice(2))] });
    else content.push(para(t));
  }
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}
