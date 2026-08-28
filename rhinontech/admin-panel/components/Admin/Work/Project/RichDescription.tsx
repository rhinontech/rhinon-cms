"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import Highlight from "@tiptap/extension-highlight";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { cn } from "@/lib/utils";
import {
  TbBold, TbH2, TbH3, TbHighlight, TbItalic, TbList, TbListCheck, TbListNumbers, TbStrikethrough,
} from "react-icons/tb";

/**
 * The task description. Matches the extension set the blog and page editors use
 * so formatting pasted between them survives.
 *
 * Saves on blur rather than on every keystroke — a PUT per character would both
 * hammer the API and fight the optimistic patch in useProjectWorkspace.
 */
export function RichDescription({
  html, editable, onSave,
}: {
  html: string | null;
  editable: boolean;
  onSave: (html: string) => void;
}) {
  const editor = useEditor({
    editable,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder: "Add a description for this task…" }),
      Highlight.configure({ multicolor: true }),
      // Without these two the task-list button in the toolbar would silently no-op.
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: html || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2",
      },
    },
    onBlur: ({ editor: e }) => {
      const next = e.getHTML();
      // Tiptap renders an empty doc as <p></p>; don't persist that as a change.
      const normalised = next === "<p></p>" ? "" : next;
      if (normalised !== (html || "")) onSave(normalised);
    },
  });

  // Adopt server content when the task is swapped, without stomping a live edit.
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const current = editor.getHTML();
    const incoming = html || "";
    if (current !== incoming && !(current === "<p></p>" && incoming === "")) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [html, editor]);

  if (!editor) return null;

  const Btn = ({ on, active, children, title }: { on: () => void; active: boolean; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      className={cn(
        "rounded p-1.5 text-stone-500 hover:bg-stone-100",
        active && "bg-stone-200 text-stone-900"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-lg border border-stone-200 focus-within:border-blue-400">
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1">
          <Btn title="Bold" on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><TbBold size={14} /></Btn>
          <Btn title="Italic" on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><TbItalic size={14} /></Btn>
          <Btn title="Strikethrough" on={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}><TbStrikethrough size={14} /></Btn>
          <Btn title="Highlight" on={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")}><TbHighlight size={14} /></Btn>
          <span className="mx-1 h-4 w-px bg-stone-200" />
          <Btn title="Heading" on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}><TbH2 size={14} /></Btn>
          <Btn title="Subheading" on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}><TbH3 size={14} /></Btn>
          <span className="mx-1 h-4 w-px bg-stone-200" />
          <Btn title="Bullet list" on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}><TbList size={14} /></Btn>
          <Btn title="Numbered list" on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}><TbListNumbers size={14} /></Btn>
          <Btn title="Task list" on={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")}><TbListCheck size={14} /></Btn>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
