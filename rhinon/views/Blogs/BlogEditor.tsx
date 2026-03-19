"use client";

import { useState, useEffect } from "react";
import { X, Save, Image as ImageIcon, Tag, Clock, Globe, FileText, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Blog } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { useRouter } from "next/navigation";

interface BlogEditorProps {
  blog?: Blog | null;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function BlogEditor({ blog, onClose, onSuccess }: BlogEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(blog?.title || "");
  const [slug, setSlug] = useState(blog?.slug || "");
  const [excerpt, setExcerpt] = useState(blog?.excerpt || "");
  const [content, setContent] = useState(blog?.content || "");
  const [coverImage, setCoverImage] = useState(blog?.coverImage || "");
  const [tags, setTags] = useState(blog?.tags?.join(", ") || "");
  const [readTime, setReadTime] = useState(blog?.readTime || "5 min read");
  const [status, setStatus] = useState<"Draft" | "Published">(blog?.status || "Published");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const handleAIGenerate = async () => {
    if (!title.trim() && !aiPrompt.trim()) {
      toast.error("Please provide at least a Title or a Prompt for the AI.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/blogs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate content");
      
      if (data.title) setTitle(data.title);
      if (data.excerpt) setExcerpt(data.excerpt);
      if (data.content) setContent(data.content);
      if (data.tags) setTags(data.tags.join(", "));
      if (data.readTime) setReadTime(data.readTime);

      toast.success("Content generated successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/blogs/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setCoverImage(data.url);
        toast.success("Image uploaded!");
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!title && !aiPrompt) {
      toast.error("Please provide a Title or Prompt to generate an image.");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const res = await fetch("/api/ai/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Professional blog cover image for: ${title || aiPrompt}. Premium, modern, tech-focused aesthetic.` }),
      });
      const data = await res.json();
      if (data.url) {
        setCoverImage(data.url);
        toast.success("AI Image generated!");
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Auto-generate slug from title
  useEffect(() => {
    if (!blog && title) {
      setSlug(title.toLowerCase().replace(/[^a-z0-0]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  }, [title, blog]);

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    if (!title || !slug || !content) {
      toast.error("Please fill in all required fields (Title, Slug, Content)");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        readTime,
        status,
      };

      const url = blog ? `/api/blogs/${blog.id}` : "/api/blogs";
      const method = blog ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(blog ? "Blog updated!" : "Blog created!");
        if (onSuccess) {
          onSuccess();
        } else {
          router.back();
        }
        if (onClose) onClose();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to save blog");
      }
    } catch (error: any) {
      console.error("Error saving blog:", error);
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <header className="flex items-center justify-between p-6 border-b border-border bg-card/50">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {blog ? "Edit Blog Post" : "Create New Post"}
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">
              {status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleCancel} className="h-9 px-4 font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 px-8 bg-cyan-500 hover:bg-cyan-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-glow shadow-cyan-500/20"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
            {blog ? "Update Post" : "Publish Post"}
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-secondary/10">
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* AI Content Assistant */}
          <div className="relative overflow-hidden p-6 rounded-[32px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-background to-background shadow-xl">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles size={120} className="text-cyan-500" />
             </div>
             <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 space-y-2">
                   <div className="flex items-center gap-2">
                      <Wand2 size={20} className="text-cyan-500 animate-pulse" />
                      <h3 className="text-lg font-bold text-foreground">AI Content Assistant</h3>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-500 font-bold uppercase tracking-widest text-[9px] px-2 py-0">Experimental</Badge>
                   </div>
                   <p className="text-sm text-muted-foreground max-w-xl">
                      Enter a title or a specific topic. Our AI will generate a complete, SEO-friendly blog post research-backed by Rhinon Labs knowledge.
                   </p>
                </div>
                <div className="w-full md:w-1/3 flex flex-col gap-3">
                   <Input 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g. Benefits of AI for SMBs..." 
                      className="bg-card/50 border-cyan-500/20 focus:border-cyan-500/50"
                   />
                   <Button 
                      onClick={handleAIGenerate} 
                      disabled={isGenerating} 
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl h-10 shadow-glow shadow-cyan-500/20"
                   >
                      {isGenerating ? <Loader2 size={14} className="animate-spin mr-2" /> : <Sparkles size={14} className="mr-2" />}
                      Generate Everything
                   </Button>
                </div>
             </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-cyan-500" />
              <div>
                <Label className="text-sm font-bold">Public Visibility</Label>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Control if this post is live on Rhinon Labs</p>
              </div>
            </div>
            <Switch
              checked={status === "Published"}
              onCheckedChange={(checked) => setStatus(checked ? "Published" : "Draft")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Future of AI..."
                className="h-11 bg-secondary/50 border-border font-medium"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="future-of-ai"
                className="h-11 bg-secondary/50 border-border font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Excerpt</Label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A brief summary for the blog card..."
              className="min-h-[80px] bg-secondary/50 border-border resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cover Image</Label>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="h-11 bg-secondary/50 border-border text-xs"
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      id="file-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleUpload}
                    />
                    <Button 
                      variant="outline" 
                      className="h-11 border-border bg-secondary/50 hover:bg-secondary"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={18} />}
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    className="h-11 border-border bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                  >
                    {isGeneratingImage ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  </Button>
                </div>

                {coverImage && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-border group bg-secondary/30">
                     <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                     <button 
                        onClick={() => setCoverImage("")}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                        <X size={14} />
                     </button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Read Time & Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  placeholder="5 min read"
                  className="h-11 w-24 bg-secondary/50 border-border text-xs"
                />
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="AI, Tech, MVP"
                  className="h-11 flex-1 bg-secondary/50 border-border text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Markdown Content</Label>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-cyan-500/20 text-cyan-500">Supports Markdown</Badge>
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Your Blog Content..."
              className="min-h-[400px] bg-secondary/50 border-border font-medium leading-relaxed custom-scrollbar"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
