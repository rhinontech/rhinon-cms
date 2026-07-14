"use client";

import { useCallback, useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TbBold,
  TbItalic,
  TbUnderline,
  TbStrikethrough,
  TbLetterA,
  TbHighlight,
  TbSubscript,
  TbSuperscript,
  TbList,
  TbListNumbers,
  TbIndentDecrease,
  TbIndentIncrease,
  TbAlignLeft,
  TbAlignCenter,
  TbAlignRight,
  TbAlignJustified,
  TbBlockquote,
  TbCode,
  TbSourceCode,
  TbLink,
  TbLinkOff,
  TbClearFormatting,
  TbTable,
  TbRowInsertBottom,
  TbColumnInsertRight,
  TbRowRemove,
  TbColumnRemove,
  TbTableOff,
} from "react-icons/tb";
import { cn } from "@/lib/utils";

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Cyan", value: "#0891b2" },
  { label: "Blue", value: "#2563eb" },
  { label: "Emerald", value: "#059669" },
  { label: "Amber", value: "#d97706" },
  { label: "Red", value: "#dc2626" },
  { label: "Gray", value: "#6b7280" },
];

const HIGHLIGHT_COLORS = [
  { label: "None", value: "" },
  { label: "Yellow", value: "#fef08a" },
  { label: "Cyan", value: "#a5f3fc" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "Orange", value: "#fed7aa" },
];

const FONTS = [
  { label: "Sans Serif", value: "" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        active ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px shrink-0 bg-stone-200" />;
}

export function ParagraphBlock({
  html,
  onChange,
}: {
  html: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true, // toolbar active-states track the cursor
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder: "Write something…" }),
      TextStyleKit,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: html || "",
    editorProps: {
      attributes: {
        class:
          "blog-tiptap min-h-[120px] px-4 py-3 text-[15px] leading-relaxed text-stone-800 outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keep editor in sync if the block html changes externally (e.g. legacy conversion seed).
  useEffect(() => {
    if (editor && html !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(html || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, editor]);

  const setLink = useCallback((ed: Editor) => {
    const previous = ed.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (url === "" || url === "https://") {
      ed.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    ed.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, []);

  if (!editor) {
    return <div className="min-h-[160px] rounded-lg bg-stone-50 animate-pulse" />;
  }

  const styleValue = editor.isActive("heading", { level: 2 })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
      ? "h3"
      : editor.isActive("heading", { level: 4 })
        ? "h4"
        : "p";

  const fontValue = (editor.getAttributes("textStyle").fontFamily as string) || "";
  const currentColor = (editor.getAttributes("textStyle").color as string) || "";
  const inTable = editor.isActive("table");

  const selectClass =
    "h-7 rounded-md border border-stone-200 bg-white px-1.5 text-xs font-medium text-stone-700 outline-none focus:ring-1 focus:ring-stone-900";

  return (
    <div className="rounded-lg border border-stone-200 bg-white focus-within:ring-2 focus-within:ring-stone-900 transition-shadow">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-stone-100 px-2 py-1.5">
        {/* Font family */}
        <select
          title="Font"
          value={fontValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v) editor.chain().focus().setFontFamily(v).run();
            else editor.chain().focus().unsetFontFamily().run();
          }}
          className={selectClass}
        >
          {FONTS.map((f) => (
            <option key={f.label} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Paragraph style */}
        <select
          title="Paragraph style"
          value={styleValue}
          onChange={(e) => {
            const v = e.target.value;
            const chain = editor.chain().focus();
            if (v === "p") chain.setParagraph().run();
            else chain.toggleHeading({ level: Number(v.slice(1)) as 2 | 3 | 4 }).run();
          }}
          className={cn(selectClass, "ml-1")}
        >
          <option value="p">Normal</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        <Divider />

        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <TbBold size={16} />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <TbItalic size={16} />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <TbUnderline size={16} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <TbStrikethrough size={16} />
        </ToolbarButton>

        <Divider />

        {/* Text color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Text color"
              onMouseDown={(e) => e.preventDefault()}
              className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            >
              <span className="flex flex-col items-center">
                <TbLetterA size={14} />
                <span className="mt-px h-1 w-4 rounded-sm" style={{ background: currentColor || "#1c1917" }} />
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            {TEXT_COLORS.map((c) => (
              <DropdownMenuItem
                key={c.label}
                onSelect={() => {
                  if (c.value) editor.chain().focus().setColor(c.value).run();
                  else editor.chain().focus().unsetColor().run();
                }}
                className="gap-2.5"
              >
                <span className="h-3.5 w-3.5 rounded-full border border-stone-200" style={{ background: c.value || "#1c1917" }} />
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Highlight */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Highlight"
              onMouseDown={(e) => e.preventDefault()}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                editor.isActive("highlight") ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              )}
            >
              <TbHighlight size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            {HIGHLIGHT_COLORS.map((c) => (
              <DropdownMenuItem
                key={c.label}
                onSelect={() => {
                  if (c.value) editor.chain().focus().setHighlight({ color: c.value }).run();
                  else editor.chain().focus().unsetHighlight().run();
                }}
                className="gap-2.5"
              >
                <span className="h-3.5 w-3.5 rounded-full border border-stone-200" style={{ background: c.value || "#ffffff" }} />
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarButton title="Subscript" active={editor.isActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()}>
          <TbSubscript size={16} />
        </ToolbarButton>
        <ToolbarButton title="Superscript" active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
          <TbSuperscript size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <TbListNumbers size={16} />
        </ToolbarButton>
        <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <TbList size={16} />
        </ToolbarButton>
        <ToolbarButton title="Decrease indent" onClick={() => editor.chain().focus().liftListItem("listItem").run()}>
          <TbIndentDecrease size={16} />
        </ToolbarButton>
        <ToolbarButton title="Increase indent" onClick={() => editor.chain().focus().sinkListItem("listItem").run()}>
          <TbIndentIncrease size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <TbAlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <TbAlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <TbAlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <TbAlignJustified size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <TbBlockquote size={16} />
        </ToolbarButton>
        <ToolbarButton title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <TbCode size={16} />
        </ToolbarButton>
        <ToolbarButton title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <TbSourceCode size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Add link" active={editor.isActive("link")} onClick={() => setLink(editor)}>
          <TbLink size={16} />
        </ToolbarButton>
        {editor.isActive("link") && (
          <ToolbarButton title="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}>
            <TbLinkOff size={16} />
          </ToolbarButton>
        )}

        <ToolbarButton
          title="Insert table"
          active={inTable}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <TbTable size={16} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          title="Clear formatting"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <TbClearFormatting size={16} />
        </ToolbarButton>
      </div>

      {/* Contextual table controls */}
      {inTable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-stone-100 bg-stone-50/60 px-2 py-1">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">Table</span>
          <ToolbarButton title="Add row below" onClick={() => editor.chain().focus().addRowAfter().run()}>
            <TbRowInsertBottom size={15} />
          </ToolbarButton>
          <ToolbarButton title="Add column right" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <TbColumnInsertRight size={15} />
          </ToolbarButton>
          <ToolbarButton title="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
            <TbRowRemove size={15} />
          </ToolbarButton>
          <ToolbarButton title="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
            <TbColumnRemove size={15} />
          </ToolbarButton>
          <ToolbarButton title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()}>
            <TbTableOff size={15} />
          </ToolbarButton>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
