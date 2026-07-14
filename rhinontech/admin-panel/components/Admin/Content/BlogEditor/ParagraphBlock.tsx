"use client";

import { useCallback, useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  TbBold,
  TbItalic,
  TbH2,
  TbH3,
  TbLink,
  TbLinkOff,
  TbList,
  TbListNumbers,
  TbBlockquote,
} from "react-icons/tb";
import { cn } from "@/lib/utils";

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

export function ParagraphBlock({
  html,
  onChange,
}: {
  html: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder: "Write something…" }),
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

  return (
    <div className="rounded-lg border border-stone-200 bg-white focus-within:ring-2 focus-within:ring-stone-900 transition-shadow">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-stone-100 px-2 py-1.5">
        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <TbBold size={16} />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <TbItalic size={16} />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-stone-200" />
        <ToolbarButton title="Heading 2 (shows in Table of Contents)" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <TbH2 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <TbH3 size={16} />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-stone-200" />
        <ToolbarButton title="Add link" active={editor.isActive("link")} onClick={() => setLink(editor)}>
          <TbLink size={16} />
        </ToolbarButton>
        {editor.isActive("link") && (
          <ToolbarButton title="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}>
            <TbLinkOff size={16} />
          </ToolbarButton>
        )}
        <span className="mx-1 h-4 w-px bg-stone-200" />
        <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <TbList size={16} />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <TbListNumbers size={16} />
        </ToolbarButton>
        <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <TbBlockquote size={16} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
