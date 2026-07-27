"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { toast } from "sonner";
import {
  TbBold,
  TbItalic,
  TbUnderline,
  TbAlignLeft,
  TbAlignCenter,
  TbAlignRight,
  TbList,
  TbListNumbers,
  TbLink,
  TbLetterCase,
  TbHighlight,
  TbClearFormatting,
  TbCopy,
  TbClipboardText,
  TbBraces,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const VARIABLES = [
  { label: "Name", token: "{{name}}" },
  { label: "Company", token: "{{company}}" },
  { label: "Title", token: "{{title}}" },
];

/** Shared rich-text email body editor (TipTap) — used for campaign composition and draft review. */
export function EmailBodyEditor({
  value,
  onChange,
  placeholder = "Hi {{name}},\n\n...",
  minHeight = "220px",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  const textColorRef = useRef<HTMLInputElement>(null);
  const bgColorRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true, defaultProtocol: "https" } }),
      Placeholder.configure({ placeholder }),
      TextStyleKit,
      TextAlign.configure({ types: ["paragraph"] }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "email-tiptap outline-none text-sm leading-relaxed text-stone-800",
        style: `min-height:${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keep the editor in sync when the parent swaps in a different value
  // (e.g. loading a different campaign) without fighting the user's typing.
  // Re-sync when the parent swaps in a different value (loading a different
  // campaign/lead, or a Cancel button reverting local state) — but never while
  // the user is actively typing, since onUpdate already keeps `value` current.
  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (url === "" || url === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editor.getHTML());
      toast.success("Content copied");
    } catch {
      toast.error("Couldn't copy — clipboard access blocked");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      editor.chain().focus().insertContent(text).run();
    } catch {
      toast.error("Couldn't paste — clipboard access blocked");
    }
  };

  const insertVariable = (token: string) => {
    editor.chain().focus().insertContent(token).run();
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-stone-100 p-1.5">
        <ToolbarBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <TbBold size={15} />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <TbItalic size={15} />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <TbUnderline size={15} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left">
          <TbAlignLeft size={15} />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center">
          <TbAlignCenter size={15} />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right">
          <TbAlignRight size={15} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          <TbList size={15} />
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
          <TbListNumbers size={15} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => textColorRef.current?.click()} title="Text color">
          <TbLetterCase size={15} />
        </ToolbarBtn>
        <input
          ref={textColorRef}
          type="color"
          className="h-0 w-0 opacity-0"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
        <ToolbarBtn onClick={() => bgColorRef.current?.click()} title="Highlight color">
          <TbHighlight size={15} />
        </ToolbarBtn>
        <input
          ref={bgColorRef}
          type="color"
          className="h-0 w-0 opacity-0"
          onChange={(e) => editor.chain().focus().setBackgroundColor(e.target.value).run()}
        />
        <ToolbarBtn active={editor.isActive("link")} onClick={setLink} title="Link">
          <TbLink size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting">
          <TbClearFormatting size={15} />
        </ToolbarBtn>

        <Divider />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
              title="Insert variable"
            >
              <TbBraces size={14} /> Variable
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {VARIABLES.map((v) => (
              <DropdownMenuItem key={v.token} onClick={() => insertVariable(v.token)}>
                {v.label} <span className="ml-auto text-stone-400">{v.token}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
          >
            <TbCopy size={14} /> Copy
          </button>
          <button
            type="button"
            onClick={handlePaste}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
          >
            <TbClipboardText size={14} /> Paste
          </button>
        </div>
      </div>

      <div className="px-3 py-2.5">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-stone-200" />;
}

function ToolbarBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn("rounded-md p-1.5", active ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100")}
    >
      {children}
    </button>
  );
}
