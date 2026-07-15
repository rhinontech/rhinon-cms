import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import type { Editor, Range } from "@tiptap/react";
import {
  TbH1, TbH2, TbH3, TbList, TbListNumbers, TbBlockquote, TbCode,
  TbTable, TbSeparator, TbPhoto, TbAlignJustified, TbListCheck, TbLink, TbFileText,
} from "react-icons/tb";
import { apiFetch, apiUpload } from "@/lib/api";

interface SlashItem {
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  command: (props: { editor: Editor; range: Range }) => void;
}

/** Callbacks the editor page supplies so slash commands can create/open pages.
 *  Passed as a ref object because the extension is built once at editor init. */
export interface SlashPageHandlers {
  /** POST a new page nested under the current one; returns it (or null on failure). */
  createSubPage: () => Promise<{ id: string; title: string } | null>;
  /** Flush any pending save, then navigate to the given page id. */
  openPage: (id: string) => void;
}

function buildItems(roleSlug: string, handlersRef: { current: SlashPageHandlers | null }): SlashItem[] {
  return [
    { title: "Text", icon: TbAlignJustified, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run() },
    {
      // Notion's "/page": create a nested page, embed a reference row here, open it.
      title: "Page",
      icon: TbFileText,
      command: async ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        const handlers = handlersRef.current;
        if (!handlers) return;
        const page = await handlers.createSubPage();
        if (!page) return;
        editor
          .chain()
          .focus()
          .insertContent({
            type: "paragraph",
            content: [
              {
                type: "text",
                marks: [{ type: "link", attrs: { href: `/${roleSlug}/pages/${page.id}` } }],
                text: `📄 ${page.title || "Untitled"}`,
              },
            ],
          })
          .run();
        handlers.openPage(page.id);
      },
    },
    { title: "Heading 1", icon: TbH1, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run() },
    { title: "Heading 2", icon: TbH2, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run() },
    { title: "Heading 3", icon: TbH3, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run() },
    { title: "To-do List", icon: TbListCheck, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run() },
    { title: "Bullet List", icon: TbList, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
    { title: "Numbered List", icon: TbListNumbers, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
    { title: "Quote", icon: TbBlockquote, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
    { title: "Code Block", icon: TbCode, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
    { title: "Table", icon: TbTable, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { title: "Divider", icon: TbSeparator, command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run() },
    {
      title: "Image",
      icon: TbPhoto,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          try {
            const { url } = await apiUpload<{ url: string }>("/content/upload-image", file);
            editor.chain().focus().setImage({ src: url }).run();
          } catch {
            alert("Image upload failed");
          }
        };
        input.click();
      },
    },
    {
      title: "Link to Page",
      icon: TbLink,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        openPageLinkPicker(editor, roleSlug);
      },
    },
  ];
}

/**
 * Notion-style "link to page" — search the workspace and drop in a clickable
 * page-reference row (icon + underlined title, its own line). Stays open after
 * each pick so several pages can be stacked into a list in one go, like a
 * Notion sub-page list; Escape or clicking away closes it.
 */
function openPageLinkPicker(editor: Editor, roleSlug: string) {
  const wrap = document.createElement("div");
  wrap.className = "fixed z-[100] w-64 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg";
  const input = document.createElement("input");
  input.placeholder = "Search pages…";
  input.className = "mb-1 w-full rounded-md border border-stone-200 px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-stone-400";
  const list = document.createElement("div");
  list.className = "max-h-56 overflow-y-auto";
  const hint = document.createElement("div");
  hint.className = "border-t border-stone-100 px-2.5 pt-1.5 text-[10px] text-stone-400";
  hint.textContent = "Pick as many as you like — Esc when done";
  wrap.appendChild(input);
  wrap.appendChild(list);
  wrap.appendChild(hint);
  document.body.appendChild(wrap);

  let anchorPos = editor.state.selection.from;
  const reposition = () => {
    const coords = editor.view.coordsAtPos(Math.min(anchorPos, editor.state.doc.content.size));
    wrap.style.left = `${coords.left}px`;
    wrap.style.top = `${coords.bottom + 6}px`;
  };
  reposition();

  let pages: { id: string; title: string; icon: string | null }[] = [];

  const renderList = (query: string) => {
    list.innerHTML = "";
    const filtered = pages.filter((p) => p.title.toLowerCase().includes(query.toLowerCase())).slice(0, 20);
    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "px-3 py-2 text-xs text-stone-400";
      empty.textContent = pages.length === 0 ? "Loading…" : "No pages found";
      list.appendChild(empty);
      return;
    }
    filtered.forEach((p) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-stone-700 hover:bg-stone-100";
      const glyph = p.icon && !/^https?:/.test(p.icon) ? p.icon : "📄";
      row.textContent = `${glyph} ${p.title || "Untitled"}`;
      row.onmousedown = (e) => {
        e.preventDefault();
        // Each pick becomes its own paragraph — icon + underlined title — so
        // stacking several reads as a page list, then leaves a fresh line
        // for the next one (matching Notion's inline sub-page block).
        editor
          .chain()
          .focus()
          .insertContent({
            type: "paragraph",
            content: [
              {
                type: "text",
                marks: [{ type: "link", attrs: { href: `/${roleSlug}/pages/${p.id}` } }],
                text: `${glyph} ${p.title || "Untitled"}`,
              },
            ],
          })
          .insertContent({ type: "paragraph" })
          .run();
        anchorPos = editor.state.selection.from;
        input.value = "";
        renderList("");
        reposition();
        input.focus();
      };
      list.appendChild(row);
    });
  };

  function cleanup() {
    document.body.removeChild(wrap);
    document.removeEventListener("mousedown", onOutside, true);
  }
  function onOutside(e: MouseEvent) {
    if (!wrap.contains(e.target as Node)) cleanup();
  }

  renderList("");
  apiFetch<{ id: string; title: string; icon: string | null }[]>("/pages/tree")
    .then((data) => { pages = data; renderList(input.value); })
    .catch(() => { renderList(""); });

  input.oninput = () => renderList(input.value);
  input.onkeydown = (e) => {
    if (e.key === "Escape") cleanup();
  };
  setTimeout(() => {
    input.focus();
    document.addEventListener("mousedown", onOutside, true);
  }, 0);
}

function buildMenu(items: SlashItem[], onSelect: (item: SlashItem) => void) {
  const el = document.createElement("div");
  el.className =
    "fixed z-[100] w-56 max-h-72 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg";
  let selected = 0;

  const render = () => {
    el.innerHTML = "";
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "px-3 py-2 text-xs text-stone-400";
      empty.textContent = "No matches";
      el.appendChild(empty);
      return;
    }
    items.forEach((item, i) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left ${
        i === selected ? "bg-stone-100 text-stone-900" : "text-stone-600"
      }`;
      row.textContent = item.title;
      row.onmouseenter = () => { selected = i; render(); };
      row.onmousedown = (e) => { e.preventDefault(); onSelect(item); };
      el.appendChild(row);
    });
  };
  render();

  return {
    el,
    moveSelection: (dir: 1 | -1) => {
      if (items.length === 0) return;
      selected = (selected + dir + items.length) % items.length;
      render();
    },
    confirmSelection: () => {
      if (items[selected]) onSelect(items[selected]);
    },
  };
}

export function createSlashCommandExtension(
  roleSlug: string,
  handlersRef: { current: SlashPageHandlers | null }
) {
  const ITEMS = buildItems(roleSlug, handlersRef);

  return Extension.create({
    name: "slashCommand",

    addOptions() {
      return {
        suggestion: {
          char: "/",
          startOfLine: false,
          command: ({ editor, range, props }: any) => {
            props.command({ editor, range });
          },
        } as Partial<SuggestionOptions>,
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: "/",
          startOfLine: false,
          items: ({ query }: { query: string }) =>
            ITEMS.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())).slice(0, 10),
          command: ({ editor, range, props }: any) => {
            props.command({ editor, range });
          },
          render: () => {
            let menu: ReturnType<typeof buildMenu> | null = null;
            let currentRange: Range | null = null;

            const position = (clientRect: () => DOMRect | null) => {
              if (!menu) return;
              const rect = clientRect();
              if (!rect) return;
              menu.el.style.left = `${rect.left}px`;
              menu.el.style.top = `${rect.bottom + 6}px`;
            };

            return {
              onStart: (props: any) => {
                currentRange = props.range;
                menu = buildMenu(props.items, (item) => {
                  item.command({ editor: props.editor, range: currentRange! });
                });
                document.body.appendChild(menu.el);
                position(props.clientRect);
              },
              onUpdate: (props: any) => {
                if (!menu) return;
                currentRange = props.range;
                document.body.removeChild(menu.el);
                menu = buildMenu(props.items, (item) => {
                  item.command({ editor: props.editor, range: currentRange! });
                });
                document.body.appendChild(menu.el);
                position(props.clientRect);
              },
              onKeyDown: (props: any) => {
                if (!menu) return false;
                if (props.event.key === "Escape") {
                  document.body.removeChild(menu.el);
                  menu = null;
                  return true;
                }
                if (props.event.key === "ArrowDown") {
                  menu.moveSelection(1);
                  return true;
                }
                if (props.event.key === "ArrowUp") {
                  menu.moveSelection(-1);
                  return true;
                }
                if (props.event.key === "Enter") {
                  menu.confirmSelection();
                  return true;
                }
                return false;
              },
              onExit: () => {
                if (menu) {
                  document.body.removeChild(menu.el);
                  menu = null;
                }
              },
            };
          },
        }),
      ];
    },
  });
}
