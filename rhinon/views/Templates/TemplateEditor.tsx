"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Send, BoxSelect, Maximize2, Loader2, Wand2, Mail, FileText, Video, Layout } from "lucide-react";
import { Template, Channel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CHANNELS: Channel[] = ["Cold Email", "LinkedIn Post", "LinkedIn Video", "LinkedIn Article"];

export function TemplateEditor({ template, initialChannel }: { template?: Template | null, initialChannel?: string }) {
  const router = useRouter();
  const [name, setName] = useState(template?.name || "New Template");
  const defaultChannel = template?.channel || (initialChannel as Channel) || "Cold Email";
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  
  const getDefaultContent = (ch: Channel) => {
    switch (ch) {
      case "LinkedIn Post":
        return {
          subject: "",
          body: `I've been thinking a lot about data visibility in modern SaaS companies. We often see teams struggling to piece together metrics from 10 different tools.\n\nAt Rhinon, we decided to change that.\n\n[AI to insert insight on specific industry pain point]\n\nWhat's the hardest metric for your team to track right now? Let me know below. 👇`,
          aiInstructions: "Keep it casual and engaging. Focus on one specific SaaS pain point related to data fragmentation. End with a question to drive comments.",
        };
      case "LinkedIn Video":
        return {
          subject: "How to unify your data stack (Demo)",
          body: `[AI to reference the video topic]\n\nHere are the top 3 takeaways:\n1. [AI to insert takeaway 1]\n2. [AI to insert takeaway 2]\n3. [AI to insert takeaway 3]\n\nIf you found this helpful, check out our full dashboard solution at Rhinon!`,
          aiInstructions: "Write a punchy hook referencing the attached video. Summarize 3 key benefits of unified data dashboards in a list format.",
        };
      case "LinkedIn Article":
        return { // Using 'subject' as Article Title
          subject: "The Hidden Cost of Fragmented Data",
          body: `## The Hidden Cost of Fragmented Data\n\nIn my conversations with leaders in the SaaS space, I consistently hear the same struggle: data is everywhere, but insights are nowhere.\n\n[AI to expand on the cost of fragmented data]\n\n[AI to explain how centralizing metrics improves ROI]\n\nHow is your team handling this scale?`,
          aiInstructions: "Write a thought-leadership style article. Use professional formatting with headers. Focus on the ROI of centralizing metrics.",
        };
      case "Cold Email":
      default:
        return {
          subject: "Unlocking {{lead.company}}'s internal data potential",
          body: `Hi {{lead.name}},\n\nI'm {{sender.name}}, and I'm reaching out from Rhinon. We help companies like {{lead.company}} leverage their internal data to improve efficiency and decision-making.\n\nI noticed {{lead.company}} is working on [mention something specific about the company based on research - AI should fill this]. This got me thinking about the potential value an internal dashboard could provide, consolidating key metrics and insights into a single, easily accessible view.\n\nWith Rhinon's dashboard solution, you can:\n\n* [Benefit 1 - AI to tailor to industry/company]\n* [Benefit 2 - AI to tailor to role/company]\n* [Benefit 3 - AI to tailor to potential pain points]\n\nWould you be open to a quick 15-minute call to discuss how Rhinon can help {{lead.company}} unlock the power of its data?\n\nBest regards,\n{{sender.name}}`,
          aiInstructions: "Research the company's recent activity to fill the research placeholder. Tailor the three benefits specifically to their industry, their job title, and the likely pain points they face in data management.",
        };
    }
  };

  const initialContent = template ? { subject: template.subject, body: template.body, aiInstructions: template.aiInstructions } : getDefaultContent(defaultChannel);

  const [subject, setSubject] = useState(initialContent.subject);
  const [body, setBody] = useState(initialContent.body);
  const [aiInstructions, setAiInstructions] = useState(initialContent.aiInstructions);
  const [mediaUrl, setMediaUrl] = useState(template?.mediaUrl || "");

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  
  // New social settings
  const [visibility, setVisibility] = useState<"PUBLIC" | "CONNECTIONS">(template?.visibility || "PUBLIC");
  const [articleUrl, setArticleUrl] = useState(template?.articleUrl || "");
  const [mediaTitle, setMediaTitle] = useState(template?.mediaTitle || "");
  const [mediaDescription, setMediaDescription] = useState(template?.mediaDescription || "");

  const [imagePrompt, setImagePrompt] = useState("");

  const variables = channel === "Cold Email" 
    ? ["{{lead.name}}", "{{lead.firstName}}", "{{lead.company}}", "{{lead.title}}", "{{sender.name}}"]
    : ["{{sender.name}}"];

  const handleInject = (variable: string) => {
    setBody((prev) => prev + " " + variable);
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

      if (data.name) setName(data.name);
      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
      if (data.aiInstructions) setAiInstructions(data.aiInstructions);
      
      toast.success("AI generated a draft for you!");
      setAiPrompt("");
    } catch (error: any) {
      console.error("AI Template Gen Error:", error);
      toast.error(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name,
        subject,
        body,
        aiInstructions,
        mediaUrl,
        channel,
        visibility,
        articleUrl,
        mediaTitle,
        mediaDescription,
      };

      const id = (template as any)?._id || template?.id;
      const url = id ? `/api/templates/${id}` : "/api/templates";
      const method = id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(id ? "Template updated!" : "Template created!");
        router.push("/templates");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  // Fake preview with replaced variables
  const previewBody = body
    .replace(/\{\{lead\.name\}\}/g, "Marcus Johnson")
    .replace(/\{\{lead\.firstName\}\}/g, "Marcus")
    .replace(/\{\{lead\.company\}\}/g, "TechFlow")
    .replace(/\{\{lead\.title\}\}/g, "Founder & CEO")
    .replace(/\{\{sender\.name\}\}/g, "Alex Mercer");

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
                  {template ? "Edit Template" : "New Template"}
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
                Draft and optimize your outreach messaging.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              variant="outline" 
              className="border-border text-foreground hover:bg-secondary h-10 px-6 font-bold"
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Save Draft
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black h-10 px-8 rounded-xl shadow-glow-sm"
            >
              <Send size={16} className="mr-2" /> {template ? "Update Template" : "Publish Template"}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 min-h-[600px]">
        {/* Editor Area */}
        <div className="flex-1 p-8 overflow-y-auto space-y-8 border-r border-border bg-background/50">
          {/* AI Generation Bar */}
          {!template && (
            <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 flex flex-col gap-3 group">
              <div className="flex items-center gap-2 text-violet-400">
                <Wand2 size={16} className="group-hover:animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">AI Template Propagator</span>
              </div>
              <div className="flex gap-3">
                <Input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your goal (e.g. 'A direct post about SaaS scalability for developers')"
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

          {/* Global Template Name */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
              Template Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 bg-secondary/50 border-border text-lg font-medium text-foreground focus:ring-cyan-500/20"
              placeholder="Internal name..."
            />
          </div>

          <div className="w-full h-px bg-border/50 my-6" />

          {/* CHANNEL SPECIFIC FORMS */}
          {channel === "Cold Email" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="text-cyan-500" size={18} />
                <h3 className="text-sm font-bold text-foreground">Email Configuration</h3>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                  Subject Line
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-secondary/30 border-border text-foreground focus:ring-cyan-500/20"
                  placeholder="Enter subject line..."
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Message Body</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Insert:</span>
                    {variables.slice(0, 3).map((v) => (
                      <button key={v} onClick={() => handleInject(v)} className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded-md text-cyan-600 dark:text-cyan-400 hover:bg-secondary/80 transition-colors font-mono">
                        {v.replace(/lead\./, "")}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full min-h-[350px] bg-secondary/30 border border-border rounded-xl p-6 text-foreground text-sm leading-relaxed outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-500/30 resize-none"
                  placeholder="Enter your email message here..."
                />
              </div>
            </div>
          )}

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
                        placeholder="Describe the image (e.g. A futuristic data center, neon..."
                        className="bg-black/20 border-violet-500/20 text-xs focus:ring-violet-500/20 h-9"
                      />
                      <Button 
                        onClick={async () => {
                          if (!imagePrompt) return;
                          toast.loading("Generating Imagen 3 Art...", { id: "ai-img-gen" });
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
                            console.error(err);
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Insert:</span>
                    {variables.map((v) => (
                      <button key={v} onClick={() => handleInject(v)} className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded-md text-cyan-600 dark:text-cyan-400 hover:bg-secondary/80 transition-colors font-mono">
                        {v.replace(/sender\./, "")}
                      </button>
                    ))}
                  </div>
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
                    <SelectTrigger className="bg-secondary/30 border-border h-11">
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
                <h3 className="text-sm font-bold text-foreground">Video Propagation Configuration</h3>
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
                <p className="text-[10px] text-muted-foreground ml-1">Link to the external video asset you want to orchestrate.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Companion Post Text</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full min-h-[200px] bg-secondary/30 border border-border rounded-xl p-6 text-foreground text-sm leading-relaxed outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500/30 resize-none"
                  placeholder="Describe the video..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Visibility</label>
                  <Select value={visibility} onValueChange={(val) => setVisibility(val as any)}>
                    <SelectTrigger className="bg-secondary/30 border-border h-11">
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
                    <p className="text-xs text-emerald-500/80 leading-relaxed mb-3">Generate an eye-catching 16:9 cover image for your LinkedIn article.</p>
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
                          toast.loading("Generating Imagen 3 Cover Art...", { id: "ai-img-gen" });
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
                            console.error(err);
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
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-secondary/30 border-border text-foreground text-lg font-bold focus:ring-emerald-500/20"
                  placeholder="Title of your article..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Article Visibility</label>
                  <Select value={visibility} onValueChange={(val) => setVisibility(val as any)}>
                    <SelectTrigger className="bg-secondary/30 border-border h-11">
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
                 <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Article Content (Markdown Supported)</label>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full min-h-[400px] bg-secondary/30 border border-border rounded-xl p-6 text-foreground text-sm leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/30 font-mono resize-none"
                  placeholder="## Heading 1\nWrite your long-form article here..."
                />
              </div>
            </div>
          )}

        </div>

        {/* Sidebar / Preview / AI */}
        <div className="w-[450px] flex flex-col bg-secondary/10">
          {/* AI Instructions Panel */}
          <div className="p-8 border-b border-border bg-violet-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                <Sparkles size={18} />
                <span className="text-xs font-black uppercase tracking-widest">AI Personalization</span>
              </div>
              <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 text-[10px] font-black uppercase tracking-widest">
                Active
              </Badge>
            </div>
            <textarea
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              className="w-full h-32 bg-secondary/50 border border-violet-500/20 rounded-xl p-4 text-xs text-foreground placeholder:text-muted-foreground/50 italic leading-relaxed focus:ring-2 focus:ring-violet-500/10 outline-none resize-none"
              placeholder="e.g. Reference their recent funding round..."
            />
            <p className="mt-3 text-[10px] text-muted-foreground leading-tight font-medium">
              AI uses these instructions to tailor each message uniquely per lead when generating outreach drafts.
            </p>
          </div>

          {/* Live Preview Panel */}
          <div className="p-8 flex-1 flex flex-col bg-background/30 overflow-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                Live Propagation Preview
              </span>
              <div className="flex gap-2">
                {channel === "Cold Email" && <Mail size={14} className="text-muted-foreground" />}
                {channel === "LinkedIn Post" && <Layout size={14} className="text-muted-foreground" />}
                {channel === "LinkedIn Video" && <Video size={14} className="text-muted-foreground" />}
                {channel === "LinkedIn Article" && <FileText size={14} className="text-muted-foreground" />}
              </div>
            </div>

            <div className="flex-1 bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden relative min-h-[400px]">
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-glow shadow-emerald-500/50" />
              
              <div className="space-y-4">
                {/* EMAIL PREVIEW */}
                {channel === "Cold Email" && (
                  <>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-bold">Subject</p>
                      <p className="text-sm font-semibold text-foreground truncate">{(subject || "").replace(/\{\{lead\.company\}\}/g, "TechFlow")}</p>
                    </div>
                    <div className="w-full h-px bg-border/50" />
                    <div className="space-y-1 whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed font-sans font-medium">
                      {previewBody}
                    </div>
                  </>
                )}

                {/* POST PREVIEW */}
                {channel === "LinkedIn Post" && (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-foreground leading-none">Alex Mercer</p>
                        <p className="text-xs text-muted-foreground leading-none">Founder & CEO @ Rhinon</p>
                      </div>
                      <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed font-sans font-medium">
                        {previewBody || "What do you want to talk about?"}
                      </div>
                      <div className="w-full aspect-square bg-secondary/50 rounded-lg border border-border flex items-center justify-center relative overflow-hidden group">
                        {mediaUrl ? (
                          <img src={mediaUrl} alt="AI Generated" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Sparkles className="absolute inset-0 m-auto text-violet-500/20 group-hover:scale-110 transition-transform" size={48} />
                            <span className="text-xs font-bold text-muted-foreground z-10 flex items-center gap-2">
                              <Sparkles size={12} className="text-violet-400" /> AI Generated Image Area
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* VIDEO PREVIEW */}
                {channel === "LinkedIn Video" && (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-foreground leading-none">Alex Mercer</p>
                        <p className="text-xs text-muted-foreground leading-none">Founder & CEO @ Rhinon</p>
                      </div>
                      <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed font-sans font-medium">
                        {previewBody || "Describe the video..."}
                      </div>
                      <div className="w-full aspect-[4/5] bg-black/90 rounded-lg border border-border flex flex-col items-center justify-center relative group">
                        <div className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform cursor-pointer">
                          <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[14px] border-l-white border-b-8 border-b-transparent ml-1" />
                        </div>
                        {mediaUrl && (
                          <div className="absolute bottom-4 left-4 right-4 text-xs font-mono text-white/50 truncate bg-black/50 px-2 py-1 rounded">
                            {mediaUrl}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ARTICLE PREVIEW */}
                {channel === "LinkedIn Article" && (
                  <div className="space-y-6">
                    <div className="w-full h-48 bg-secondary/50 rounded-xl border border-border flex items-center justify-center relative overflow-hidden group">
                      {mediaUrl ? (
                         <img src={mediaUrl} alt="Cover Art" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Sparkles className="absolute inset-0 m-auto text-emerald-500/20 group-hover:scale-110 transition-transform" size={48} />
                          <span className="text-xs font-bold text-muted-foreground z-10 flex items-center gap-2">
                            <Sparkles size={12} className="text-emerald-400" /> AI Generated Cover Image
                          </span>
                        </>
                      )}
                    </div>
                    <div className="space-y-4 px-2">
                       <h1 className="text-2xl font-black text-foreground">{subject || "Article Title"}</h1>
                       <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-secondary shrink-0" />
                         <div className="space-y-0.5">
                           <p className="text-xs font-bold text-foreground leading-none">Alex Mercer</p>
                           <p className="text-[10px] text-muted-foreground leading-none">Published on LinkedIn Pulse</p>
                         </div>
                       </div>
                       <div className="w-full h-px bg-border/50" />
                       <div className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed font-sans font-medium">
                         {previewBody || "Article content will appear here..."}
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl border border-dashed border-border flex flex-col gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Output Quality Score</p>
              <div className="flex h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-gradient-to-r from-cyan-500 to-violet-500" />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-muted-foreground/80 tracking-widest uppercase">
                <span>Authentic</span>
                <span>85% Personalized</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
