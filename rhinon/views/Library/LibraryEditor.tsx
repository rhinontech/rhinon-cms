"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Send, BoxSelect, Maximize2, Loader2, Wand2, Mail, FileText, Video, Layout, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Rocket } from "lucide-react";

const CHANNELS: string[] = ["LinkedIn Post", "LinkedIn Video", "LinkedIn Article"];

export function LibraryEditor({ asset, initialChannel }: { asset?: any | null, initialChannel?: string }) {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;
  
  const [name, setName] = useState(asset?.title || asset?.name || "New Asset");
  const defaultChannel = asset?.channel || initialChannel || "LinkedIn Post";
  const [channel, setChannel] = useState<string>(defaultChannel);
  
  const getDefaultContent = (ch: string) => {
    switch (ch) {
      case "LinkedIn Article":
        return {
          title: "The Future of Analytics",
          body: "Write your long-form article here...",
          aiInstructions: "The tone should be engaging and insightful."
        };
      case "LinkedIn Post":
      case "LinkedIn Video":
      default:
        return {
          title: "",
          body: "What do you want to talk about?",
          aiInstructions: "Ensure the tone is professional yet engaging."
        };
    }
  };

  const initialContent = asset 
    ? { title: asset.title, body: asset.content || asset.body, aiInstructions: asset.aiInstructions } 
    : getDefaultContent(defaultChannel);

  const [title, setTitle] = useState(initialContent.title);
  const [body, setBody] = useState(initialContent.body || "");
  const [aiInstructions, setAiInstructions] = useState(initialContent.aiInstructions || "");
  const [mediaUrl, setMediaUrl] = useState(asset?.mediaUrl || "");

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  
  const [visibility, setVisibility] = useState<"PUBLIC" | "CONNECTIONS">(asset?.visibility || "PUBLIC");
  const [articleUrl, setArticleUrl] = useState(asset?.articleUrl || "");
  const [mediaTitle, setMediaTitle] = useState(asset?.mediaTitle || "");
  const [mediaDescription, setMediaDescription] = useState(asset?.mediaDescription || "");

  const [imagePrompt, setImagePrompt] = useState("");

  const variables = ["{{sender.name}}"];

  const handleInject = (variable: string) => {
    setBody((prev: string) => prev + " " + variable);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, channel }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.subject) setTitle(data.subject);
      if (data.body) setBody(data.body);
      if (data.aiInstructions) setAiInstructions(data.aiInstructions);
      
      toast.success("AI generated a draft for you!");
      setAiPrompt("");
    } catch (error: any) {
      console.error("AI Gen Error:", error);
      toast.error(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (shouldPublish = false) => {
    setIsSaving(true);
    try {
      const payload = {
        title: title || name,
        content: body,
        aiInstructions,
        mediaUrl,
        channel,
        visibility,
        articleUrl,
        mediaTitle,
        mediaDescription,
        status: asset?.status || "Draft"
      };

      const id = asset?._id || asset?.id;
      const url = id ? `/api/posts/${id}` : "/api/posts";
      const method = id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const savedAsset = await res.json();

      if (res.ok) {
        if (shouldPublish) {
            await handlePublishActual(savedAsset._id || savedAsset.id || id);
        } else {
            toast.success(id ? "Asset updated!" : "Asset created!");
            router.push(`/${role}/library`);
        }
      }
    } catch (error) {
      console.error("Error saving asset:", error);
      toast.error("Failed to save asset");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishActual = async (id: string) => {
    toast.loading("Publishing to LinkedIn...", { id: "p-status" });
    try {
      const res = await fetch(`/api/posts/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Successfully published to LinkedIn!", { id: "p-status" });
        router.push(`/${role}/library`);
      } else {
        toast.error(data.error || "Failed to publish", { id: "p-status" });
      }
    } catch (err) {
      toast.error("Publishing failed unexpectedly", { id: "p-status" });
    }
  };

  return (
    <div className="flex flex-col bg-card/40 rounded-3xl border border-border overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="p-8 border-b border-border bg-secondary/40 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-glow-sm">
              <BoxSelect size={24} className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  {asset ? "Edit Library Asset" : "New Library Asset"}
                </h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/20 text-cyan-400 cursor-pointer hover:bg-cyan-500/20 transition-all uppercase text-[10px] font-black tracking-widest px-3 py-1">
                      {channel}
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-card border-border">
                    {CHANNELS.map((ch) => (
                      <DropdownMenuItem key={ch} onClick={() => setChannel(ch)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
                        {ch}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Draft and optimize your social media assets.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => handleSave(false)} 
              disabled={isSaving}
              variant="outline" 
              className="border-border text-foreground hover:bg-secondary h-10 px-6 font-bold"
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Save Draft
            </Button>
            <Button 
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black h-10 px-8 rounded-xl shadow-glow-sm"
            >
              <Rocket size={16} className="mr-2" /> Publish Now
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 min-h-[600px]">
        {/* Editor Area */}
        <div className="flex-1 p-8 overflow-y-auto space-y-8 border-r border-border bg-background/50">
          {/* AI Generation Bar */}
          {!asset && (
            <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 flex flex-col gap-3 group">
              <div className="flex items-center gap-2 text-violet-400">
                <Wand2 size={16} className="group-hover:animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">AI Engine</span>
              </div>
              <div className="flex gap-3">
                <Input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your goal (e.g. 'A direct post about SaaS scalability')"
                  className="flex-1 bg-background border-border h-11 text-sm font-medium"
                  onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                />
                <Button 
                  onClick={handleAiGenerate}
                  disabled={isGenerating || !aiPrompt}
                  className="bg-violet-500 hover:bg-violet-600 text-white font-bold h-11 px-6 px-8 rounded-xl"
                >
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="mr-2" />}
                  Generate
                </Button>
              </div>
            </div>
          )}

          {/* Headline Name */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
              Asset Headline
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 bg-secondary/50 border-border text-lg font-medium text-foreground focus:ring-cyan-500/20"
              placeholder="Enter headline..."
            />
          </div>

          <div className="w-full h-px bg-border/50 my-6" />

          {/* CHANNEL SPECIFIC FORMS */}
          {channel === "LinkedIn Post" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-2">
                <Layout className="text-blue-500" size={18} />
                <h3 className="text-sm font-bold text-foreground">Post Configuration</h3>
              </div>
              
              <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl space-y-3">
                <div className="flex gap-4 items-start">
                  <div className="p-2 bg-violet-500/10 rounded-lg"><Sparkles className="text-violet-400" size={20} /></div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-violet-300 mb-1">Generate AI Image</h4>
                    <p className="text-xs text-violet-400/80 leading-relaxed mb-3">Generate a stunning companion image for your post instantly.</p>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Describe the image..."
                        className="bg-black/20 border-violet-500/20 text-xs focus:ring-violet-500/20 h-9"
                      />
                      <Button 
                        onClick={async () => {
                          if (!imagePrompt) return;
                          toast.loading("Generating Art...", { id: "ai-img-gen" });
                          try {
                            const res = await fetch("/api/ai/images/generate", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ prompt: imagePrompt }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error);
                            setMediaUrl(data.url);
                            toast.success("Image attached successfully!", { id: "ai-img-gen" });
                          } catch (err: any) {
                            toast.error(err.message || "Failed to generate image", { id: "ai-img-gen" });
                          }
                        }}
                        className="bg-violet-600 hover:bg-violet-700 text-white text-xs h-9 font-bold px-4"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Post Text</label>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full min-h-[250px] bg-secondary/30 border border-border rounded-xl p-6 text-foreground text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/30 resize-none"
                  placeholder="What do you want to talk about?"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Visibility</label>
                  <Select value={visibility} onValueChange={(val) => setVisibility(val as any)}>
                    <SelectTrigger className="bg-secondary/30 border-border h-11 text-white">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="CONNECTIONS">Connections Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Media Title</label>
                  <Input 
                    value={mediaTitle}
                    onChange={(e) => setMediaTitle(e.target.value)}
                    placeholder="e.g. Scaling Rhinon"
                    className="bg-secondary/30 border-border h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {channel === "LinkedIn Video" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-2">
                <Video className="text-red-500" size={18} />
                <h3 className="text-sm font-bold text-foreground">Video Configuration</h3>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Source Video URL</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Video size={16} /></div>
                  <Input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="pl-10 bg-secondary/30 border-border text-foreground focus:ring-red-500/20"
                    placeholder="https://vimeo.com/... or https://youtube.com/..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 text-white">Companion Post Text</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full min-h-[200px] bg-secondary/30 border border-border rounded-xl p-6 text-foreground text-sm leading-relaxed outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500/30 resize-none"
                  placeholder="Describe the video..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6 h-12">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Visibility</label>
                  <Select value={visibility} onValueChange={(val) => setVisibility(val as any)}>
                    <SelectTrigger className="bg-secondary/30 border-border h-11 text-white">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="CONNECTIONS">Connections Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Video Title</label>
                  <Input 
                    value={mediaTitle}
                    onChange={(e) => setMediaTitle(e.target.value)}
                    placeholder="Video caption title"
                    className="bg-secondary/30 border-border h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {channel === "LinkedIn Article" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-emerald-500" size={18} />
                <h3 className="text-sm font-bold text-foreground">Article Configuration</h3>
              </div>
              
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-3">
                <div className="flex gap-4 items-start">
                  <div className="p-2 bg-emerald-500/10 rounded-lg"><Sparkles className="text-emerald-500" size={20} /></div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-emerald-500 mb-1">Generate AI Cover Image</h4>
                    <p className="text-xs text-emerald-500/80 leading-relaxed mb-3">Generate an eye-catching 16:9 cover image for your article.</p>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Describe the cover art..."
                        className="bg-black/20 border-emerald-500/20 text-xs focus:ring-emerald-500/20 h-9"
                      />
                      <Button 
                        onClick={async () => {
                          if (!imagePrompt) return;
                          toast.loading("Generating Art...", { id: "ai-img-gen" });
                          try {
                            const res = await fetch("/api/ai/images/generate", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ prompt: imagePrompt + " designed as a wide 16:9 banner cover." }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error);
                            setMediaUrl(data.url);
                            toast.success("Cover art attached!", { id: "ai-img-gen" });
                          } catch (err: any) {
                            toast.error(err.message || "Failed to generate cover art", { id: "ai-img-gen" });
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-bold px-4"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Article Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-secondary/30 border-border text-foreground text-lg font-bold focus:ring-emerald-500/20"
                  placeholder="Title of your article..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Article Visibility</label>
                  <Select value={visibility} onValueChange={(val) => setVisibility(val as any)}>
                    <SelectTrigger className="bg-secondary/30 border-border h-11 text-white">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="CONNECTIONS">Connections Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">External Article URL (Canonical)</label>
                  <Input 
                    value={articleUrl}
                    onChange={(e) => setArticleUrl(e.target.value)}
                    placeholder="https://your-site.com/blog-post"
                    className="bg-secondary/30 border-border h-11"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Article Content (Markdown Supported)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full min-h-[400px] bg-secondary/30 border border-border rounded-xl p-6 text-foreground text-sm leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/30 font-mono resize-none shadow-inner"
                  placeholder="## Heading 1\nWrite your long-form article here..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar / Preview / AI */}
        <div className="w-[450px] flex flex-col bg-secondary/10 overflow-y-auto">
          {/* AI Instructions Panel */}
          <div className="p-8 border-b border-border bg-violet-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                <Sparkles size={18} />
                <span className="text-xs font-black uppercase tracking-widest text-white">AI Personalization</span>
              </div>
              <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 text-[10px] font-black uppercase tracking-widest">
                Active
              </Badge>
            </div>
            <textarea
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              className="w-full h-32 bg-secondary/50 border border-violet-500/20 rounded-xl p-4 text-xs text-foreground placeholder:text-muted-foreground/50 italic leading-relaxed focus:ring-2 focus:ring-violet-500/10 outline-none resize-none"
              placeholder="AI personalization instructions..."
            />
          </div>

          {/* Live Preview Panel */}
          <div className="p-8 flex-1 flex flex-col bg-background/30 overflow-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                Live Propagation Preview
              </span>
              <div className="flex gap-2">
                {channel === "LinkedIn Post" && <Layout size={14} className="text-muted-foreground" />}
                {channel === "LinkedIn Video" && <Video size={14} className="text-muted-foreground" />}
                {channel === "LinkedIn Article" && <FileText size={14} className="text-muted-foreground" />}
              </div>
            </div>

            <div className="flex-1 bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden relative min-h-[500px]">
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              
              <div className="space-y-6">
                {channel === "LinkedIn Article" ? (
                  <div className="space-y-6">
                    <div className="w-full h-48 bg-secondary/50 rounded-xl border border-border flex items-center justify-center relative overflow-hidden group">
                      {mediaUrl ? (
                         <img src={mediaUrl} alt="Cover Art" className="w-full h-full object-cover" />
                      ) : (
                        <Sparkles className="text-emerald-500/20" size={48} />
                      )}
                    </div>
                    <div className="space-y-4 px-2">
                       <h1 className="text-2xl font-black text-foreground">{title || "Article Title"}</h1>
                       <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-secondary shrink-0" />
                         <div className="space-y-0.5">
                           <p className="text-xs font-bold text-foreground leading-none text-white">Prabhat Patra</p>
                           <p className="text-[10px] text-muted-foreground leading-none">Founder @ Rhinon Tech</p>
                         </div>
                       </div>
                       <div className="w-full h-px bg-border/50" />
                       <div className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed font-medium">
                         {body || "Article content will appear here..."}
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary shrink-0 flex items-center justify-center text-cyan-500">
                      <User size={20} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-foreground leading-none text-white">Prabhat Patra</p>
                        <p className="text-xs text-muted-foreground leading-none">Just now • LinkedIn</p>
                      </div>
                      <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed font-medium">
                        {body || "Your post text..."}
                      </div>
                      {mediaUrl && (
                        <div className="w-full aspect-square bg-secondary/50 rounded-lg border border-border overflow-hidden">
                          <img src={mediaUrl} alt="AI Art" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
