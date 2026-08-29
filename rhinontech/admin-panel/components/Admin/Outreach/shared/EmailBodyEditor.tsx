"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
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
  TbPlus,
  TbSquarePlus,
} from "react-icons/tb";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const VARIABLES = [
  { label: "Name", token: "{{name}}" },
  { label: "Email", token: "{{email}}" },
  { label: "Company", token: "{{company}}" },
  { label: "Title", token: "{{title}}" },
];

/**
 * Every campaign button carries the recipient's address through to the landing
 * page, so the form on the other side can pre-fill it and the click can be
 * attributed to a lead. `{{email}}` is substituted per-recipient at send time by
 * the backend's fillPlaceholders().
 *
 * Assembled by hand rather than with `new URL()`, which would percent-encode the
 * braces into %7B%7Bemail%7D%7D and stop that substitution from ever matching.
 */
const EMAIL_QUERY_PARAM = "email={{email}}";

export function withEmailParam(rawUrl: string): string {
  const url = rawUrl.trim();
  if (!url || url === "#") return "#";
  // Don't stack a second one onto a URL that already carries an email param.
  if (/[?&]email=/i.test(url)) return url;

  // A query has to go before the fragment, not after it.
  const hashAt = url.indexOf("#");
  const base = hashAt === -1 ? url : url.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : url.slice(hashAt);

  const separator = !base.includes("?") ? "?" : /[?&]$/.test(base) ? "" : "&";
  return `${base}${separator}${EMAIL_QUERY_PARAM}${hash}`;
}

const CustomLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) => {
          if (!attributes.style) {
            return {};
          }
          return { style: attributes.style };
        },
      },
      class: {
        default: null,
        parseHTML: (element) => element.getAttribute("class"),
        renderHTML: (attributes) => {
          if (!attributes.class) {
            return {};
          }
          return { class: attributes.class };
        },
      },
    };
  },
});

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
  const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      CustomLink.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Placeholder.configure({ placeholder }),
      TextStyleKit,
      TextAlign.configure({ types: ["paragraph"] }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "email-tiptap outline-none text-sm leading-relaxed text-foreground",
        style: `min-height:${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Keep the editor in sync when the parent swaps in a different value
  // (e.g. loading a different campaign) without fighting the user's typing.
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

  const handleInsertButton = (data: {
    text: string;
    url: string;
    bgColor: string;
    textColor: string;
    borderRadius: string;
    padding: string;
  }) => {
    const href = withEmailParam(data.url);
    const label = data.text.trim() || "Click Here";
    // `!important` on the colour is deliberate: an inline declaration marked important
    // outranks the template's dark-mode `a { color: ... !important }` rules, so the button
    // label stays the colour that was picked here instead of flipping in dark mode. The
    // <span> repeats it because some clients recolour the anchor's child text nodes.
    const buttonHtml = `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: ${data.bgColor} !important; color: ${data.textColor} !important; border-radius: ${data.borderRadius}; padding: ${data.padding}; text-decoration: none; font-weight: 600; font-size: 14px; text-align: center; margin: 4px 0;"><span style="color: ${data.textColor} !important; text-decoration: none;">${label}</span></a>&nbsp;`;

    editor.chain().focus().insertContent(buttonHtml).run();
    setIsButtonModalOpen(false);
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-1.5">
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

        <button
          type="button"
          onClick={() => setIsButtonModalOpen(true)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-foreground/70 hover:bg-muted transition-colors"
          title="Insert Button"
        >
          <TbSquarePlus size={14} /> Button
        </button>

        <ToolbarBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting">
          <TbClearFormatting size={15} />
        </ToolbarBtn>

        <Divider />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-foreground/70 hover:bg-muted"
              title="Insert variable"
            >
              <TbBraces size={14} /> Variable
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {VARIABLES.map((v) => (
              <DropdownMenuItem key={v.token} onClick={() => insertVariable(v.token)}>
                {v.label} <span className="ml-auto text-muted-foreground">{v.token}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-foreground/70 hover:bg-muted"
          >
            <TbCopy size={14} /> Copy
          </button>
          <button
            type="button"
            onClick={handlePaste}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-foreground/70 hover:bg-muted"
          >
            <TbClipboardText size={14} /> Paste
          </button>
        </div>
      </div>

      <div className="px-3 py-2.5">
        <EditorContent editor={editor} />
      </div>

      <InsertButtonModal
        isOpen={isButtonModalOpen}
        onClose={() => setIsButtonModalOpen(false)}
        onInsert={handleInsertButton}
      />
    </div>
  );
}

function InsertButtonModal({
  isOpen,
  onClose,
  onInsert,
}: {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (data: {
    text: string;
    url: string;
    bgColor: string;
    textColor: string;
    borderRadius: string;
    padding: string;
  }) => void;
}) {
  const [buttonText, setButtonText] = useState("Click Here");
  const [url, setUrl] = useState("");
  const [bgColor, setBgColor] = useState("#335DC8");
  const [textColor, setTextColor] = useState("#ffffff");
  const [borderRadius, setBorderRadius] = useState("12px");
  const [padding, setPadding] = useState("12px 24px");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInsert({
      text: buttonText,
      url,
      bgColor,
      textColor,
      borderRadius,
      padding,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6 bg-card rounded-2xl border border-border shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-foreground">Insert Button</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Button Text</label>
            <Input
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="Click Here"
              className="h-10 rounded-xl border-border text-sm focus-visible:ring-border"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">URL</label>
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-10 rounded-xl border-border text-sm focus-visible:ring-border"
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Inserted as{" "}
              <span className="font-mono break-all text-foreground/85">
                {withEmailParam(url.trim() || "https://example.com")}
              </span>
              <br />
              The recipient&apos;s address is appended automatically so the landing page can pre-fill it.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Background Color</label>
              <div className="flex items-center gap-2">
                <div
                  className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border shadow-xs cursor-pointer"
                  style={{ backgroundColor: bgColor }}
                >
                  <input
                    type="color"
                    value={bgColor.startsWith("#") && bgColor.length === 7 ? bgColor : "#335DC8"}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  />
                </div>
                <Input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-10 font-mono text-xs rounded-xl border-border"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Text Color</label>
              <div className="flex items-center gap-2">
                <div
                  className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border shadow-xs cursor-pointer"
                  style={{ backgroundColor: textColor }}
                >
                  <input
                    type="color"
                    value={textColor.startsWith("#") && textColor.length === 7 ? textColor : "#ffffff"}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  />
                </div>
                <Input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-10 font-mono text-xs rounded-xl border-border"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Border Radius</label>
              <Input
                type="text"
                value={borderRadius}
                onChange={(e) => setBorderRadius(e.target.value)}
                placeholder="12px"
                className="h-10 rounded-xl border-border text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Padding</label>
              <Input
                type="text"
                value={padding}
                onChange={(e) => setPadding(e.target.value)}
                placeholder="12px 24px"
                className="h-10 rounded-xl border-border text-sm"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="text-xs font-medium text-foreground">Preview:</label>
            <div className="flex min-h-[110px] w-full items-center justify-center rounded-2xl border border-border bg-muted/40 p-6">
              <a
                href={url || "#"}
                onClick={(e) => e.preventDefault()}
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  borderRadius: borderRadius,
                  padding: padding,
                  display: "inline-block",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                  textAlign: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                {buttonText || "Click Here"}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
            >
              <TbPlus size={16} /> Insert Button
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground/85 hover:bg-muted/40 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-muted" />;
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
      className={cn("rounded-md p-1.5", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
    >
      {children}
    </button>
  );
}
