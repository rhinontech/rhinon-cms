"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { TbBold, TbItalic, TbUnderline, TbStrikethrough, TbHighlight, TbLink, TbLinkOff, TbCode } from "react-icons/tb";
import { cn } from "@/lib/utils";

/**
 * A lightweight floating selection toolbar. TipTap v3's React bindings don't
 * ship a BubbleMenu component, so this tracks the editor's selection directly
 * and positions itself off the native browser selection rect — no extra deps.
 */
export function BubbleToolbar({ editor }: { editor: Editor }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      const { from, to, empty } = editor.state.selection;
      if (empty || !editor.isEditable) {
        setRect(null);
        return;
      }
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      setRect(
        new DOMRect(
          Math.min(start.left, end.left),
          Math.min(start.top, end.top),
          Math.abs(end.left - start.left),
          Math.max(start.bottom, end.bottom) - Math.min(start.top, end.top)
        )
      );
    };
    editor.on("selectionUpdate", update);
    editor.on("blur", () => setTimeout(() => setRect(null), 150));
    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  if (!rect) return null;

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

  return (
    <div
      className="fixed z-[100] flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white p-1 shadow-lg"
      style={{ left: rect.left + rect.width / 2, top: rect.top - 44, transform: "translateX(-50%)" }}
    >
      <ToolbarBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><TbBold size={15} /></ToolbarBtn>
      <ToolbarBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><TbItalic size={15} /></ToolbarBtn>
      <ToolbarBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><TbUnderline size={15} /></ToolbarBtn>
      <ToolbarBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><TbStrikethrough size={15} /></ToolbarBtn>
      <ToolbarBtn active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}><TbHighlight size={15} /></ToolbarBtn>
      <ToolbarBtn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}><TbCode size={15} /></ToolbarBtn>
      <ToolbarBtn active={editor.isActive("link")} onClick={setLink}><TbLink size={15} /></ToolbarBtn>
      {editor.isActive("link") && (
        <ToolbarBtn onClick={() => editor.chain().focus().unsetLink().run()}><TbLinkOff size={15} /></ToolbarBtn>
      )}
    </div>
  );
}

function ToolbarBtn({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn("rounded-md p-1.5", active ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100")}
    >
      {children}
    </button>
  );
}
