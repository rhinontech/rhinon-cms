"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { TiptapButton } from "@/lib/tiptap-button";
import { Button } from "./ui/button";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  SquarePlay,
  RotateCcw
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState, useEffect } from "react";

export function RichTextEditor({ 
  content, 
  onChange 
}: { 
  content: string; 
  onChange: (html: string) => void; 
}) {
  const [isButtonDialogOpen, setIsButtonDialogOpen] = useState(false);
  const [buttonText, setButtonText] = useState("Click Here");
  const [buttonUrl, setButtonUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-cyan-500 underline underline-offset-4",
        },
      }),
      Placeholder.configure({
        placeholder: "Enter your outreach message here...",
      }),
      TiptapButton,
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Only call onChange if the HTML actually changed significantly
      if (html !== content) {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[350px] p-6 text-foreground leading-relaxed",
      },
    },
  });

  // Sync content if it changes externally (e.g. AI generation)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content); 
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const handleAddButton = () => {
    if (buttonUrl && buttonText) {
      editor.commands.insertButton({ text: buttonText, url: buttonUrl });
      setIsButtonDialogOpen(false);
      setButtonText("Click Here");
      setButtonUrl("");
    }
  };

  return (
    <div className="w-full border border-border rounded-xl bg-secondary/10 overflow-hidden flex flex-col min-h-[450px] group focus-within:border-cyan-500/30 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-secondary/20 backdrop-blur-sm sticky top-0 z-10">
        <Button
          size="sm"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
          type="button"
        >
          <Bold size={14} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8 p-0"
          type="button"
        >
          <Italic size={14} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-8 w-8 p-0"
          type="button"
        >
          <UnderlineIcon size={14} />
        </Button>
        
        <div className="w-px h-4 bg-border mx-1" />
        
        <Button
          size="sm"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8 p-0"
          type="button"
        >
          <List size={14} />
        </Button>
        <Button
          size="sm"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8 p-0"
          type="button"
        >
          <ListOrdered size={14} />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsButtonDialogOpen(true)}
          className="h-8 px-3 text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-cyan-500/10 hover:text-cyan-500 transition-colors"
          type="button"
        >
          <SquarePlay size={14} className="text-cyan-500" />
          Add Button
        </Button>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          title="Clear formatting"
          type="button"
        >
          <RotateCcw size={14} />
        </Button>
      </div>

      {/* Editor Surface */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/40">
        <EditorContent editor={editor} />
      </div>

      {/* Button Dialog */}
      <Dialog open={isButtonDialogOpen} onOpenChange={setIsButtonDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create Call-to-Action</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Add a high-conversion button to your email template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="btn-text" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Label</Label>
              <Input 
                id="btn-text"
                value={buttonText} 
                onChange={(e) => setButtonText(e.target.value)} 
                placeholder="e.g. Schedule a Demo"
                className="bg-secondary/50 border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="btn-url" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Redirect URL</Label>
              <Input 
                id="btn-url"
                value={buttonUrl} 
                onChange={(e) => setButtonUrl(e.target.value)} 
                placeholder="https://calendly.com/your-link"
                className="bg-secondary/50 border-border"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsButtonDialogOpen(false)} className="font-bold underline decoration-border underline-offset-4">Cancel</Button>
            <Button 
              onClick={handleAddButton} 
              disabled={!buttonUrl || !buttonText}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black px-8"
            >
              Insert Button
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
