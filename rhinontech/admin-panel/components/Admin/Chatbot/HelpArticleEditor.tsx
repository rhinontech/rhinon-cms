"use client";

import { useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { toast } from "sonner";
import {
  TbBlockquote,
  TbBold,
  TbH2,
  TbH3,
  TbItalic,
  TbLink,
  TbList,
  TbListNumbers,
  TbPhoto,
  TbUnderline,
} from "react-icons/tb";
import { apiUpload } from "@/lib/api";
import { cn } from "@/lib/utils";
import { errorText } from "./chatbotApi";

/**
 * The article body. Kept to what the backend's sanitiser lets through
 * (services/chatbot/support.ts → cleanArticleHtml) so what you write is what
 * visitors see in the widget. Mount it with a `key` per article: `html` is
 * only the starting content.
 */
export function HelpArticleEditor({ html, onChange, editable }: { html: string; onChange: (html: string) => void; editable: boolean }) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true, // toolbar active-states track the cursor
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Image,
      Placeholder.configure({ placeholder: "Write the answer. Short paragraphs and steps read best in the widget." }),
    ],
    content: html || "",
    editorProps: {
      attributes: {
        class: "help-article min-h-[50vh] px-5 py-4 text-[14px] leading-relaxed text-foreground outline-none",
        "data-testid": "article-body",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-background",
        "[&_.help-article_h2]:mb-2 [&_.help-article_h2]:mt-5 [&_.help-article_h2]:text-lg [&_.help-article_h2]:font-semibold",
        "[&_.help-article_h3]:mb-1.5 [&_.help-article_h3]:mt-4 [&_.help-article_h3]:text-[15px] [&_.help-article_h3]:font-semibold",
        "[&_.help-article_p]:my-2 [&_.help-article_ul]:my-2 [&_.help-article_ul]:list-disc [&_.help-article_ul]:pl-5",
        "[&_.help-article_ol]:my-2 [&_.help-article_ol]:list-decimal [&_.help-article_ol]:pl-5",
        "[&_.help-article_a]:text-blue-600 [&_.help-article_a]:underline dark:[&_.help-article_a]:text-blue-400",
        "[&_.help-article_blockquote]:border-l-2 [&_.help-article_blockquote]:border-border [&_.help-article_blockquote]:pl-3 [&_.help-article_blockquote]:text-muted-foreground",
        "[&_.help-article_img]:my-3 [&_.help-article_img]:max-h-80 [&_.help-article_img]:rounded-lg",
        "[&_.help-article_p.is-editor-empty:first-child]:before:pointer-events-none [&_.help-article_p.is-editor-empty:first-child]:before:float-left [&_.help-article_p.is-editor-empty:first-child]:before:h-0 [&_.help-article_p.is-editor-empty:first-child]:before:text-muted-foreground [&_.help-article_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]"
      )}
    >
      {editable && editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileInput = useRef<HTMLInputElement>(null);

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link address", previous ?? "https://");
    if (url === null) return;
    if (!url.trim()) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const upload = async (file: File) => {
    try {
      const res = await apiUpload<{ url: string }>("/chatbots/upload-image", file, "image");
      editor.chain().focus().setImage({ src: res.url, alt: "" }).run();
    } catch (err) {
      toast.error(errorText(err, "Upload failed"));
    }
  };

  const tools = [
    { icon: <TbBold size={15} />, label: "Bold", active: editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
    { icon: <TbItalic size={15} />, label: "Italic", active: editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
    { icon: <TbUnderline size={15} />, label: "Underline", active: editor.isActive("underline"), run: () => editor.chain().focus().toggleUnderline().run() },
    null,
    { icon: <TbH2 size={15} />, label: "Heading", active: editor.isActive("heading", { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { icon: <TbH3 size={15} />, label: "Subheading", active: editor.isActive("heading", { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { icon: <TbList size={15} />, label: "Bulleted list", active: editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
    { icon: <TbListNumbers size={15} />, label: "Numbered list", active: editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run() },
    { icon: <TbBlockquote size={15} />, label: "Quote", active: editor.isActive("blockquote"), run: () => editor.chain().focus().toggleBlockquote().run() },
    null,
    { icon: <TbLink size={15} />, label: "Link", active: editor.isActive("link"), run: setLink },
    { icon: <TbPhoto size={15} />, label: "Image", active: false, run: () => fileInput.current?.click() },
  ];

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/70 bg-muted/30 px-2 py-1.5">
      {tools.map((t, i) =>
        t ? (
          <button
            key={t.label}
            type="button"
            title={t.label}
            aria-label={t.label}
            aria-pressed={t.active}
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.run}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg transition-colors",
              t.active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
            )}
          >
            {t.icon}
          </button>
        ) : (
          <span key={`sep-${i}`} className="mx-1 h-5 w-px bg-border" />
        )
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
