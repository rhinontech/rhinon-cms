"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Send, BoxSelect, Maximize2, Loader2, Wand2, Mail, FileText, Video, Layout } from "lucide-react";
import { Template, Channel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CHANNELS: Channel[] = ["Cold Email", "LinkedIn Post", "LinkedIn Video", "LinkedIn Article"];

export function TemplateEditor({ template }: { template?: Template | null }) {
  const router = useRouter();
  const [name, setName] = useState(template?.name || "New Template");
  const [channel, setChannel] = useState<Channel>(template?.channel || "Cold Email");
  const [subject, setSubject] = useState(template?.subject || "Unlocking {{lead.company}}'s internal data potential");
  const [body, setBody] = useState(template?.body || `Hi {{lead.name}},

I'm {{sender.name}}, and I'm reaching out from Rhinon. We help companies like {{lead.company}} leverage their internal data to improve efficiency and decision-making.

I noticed {{lead.company}} is working on [mention something specific about the company based on research - AI should fill this]. This got me thinking about the potential value an internal dashboard could provide, consolidating key metrics and insights into a single, easily accessible view.

With Rhinon's dashboard solution, you can:

* [Benefit 1 - AI to tailor to industry/company]
* [Benefit 2 - AI to tailor to role/company]
* [Benefit 3 - AI to tailor to potential pain points]

Would you be open to a quick 15-minute call to discuss how Rhinon can help {{lead.company}} unlock the power of its data?

Best regards,
{{sender.name}}`);
  const [aiInstructions, setAiInstructions] = useState(template?.aiInstructions || "Research the company's recent activity to fill the research placeholder. Tailor the three benefits specifically to their industry, their job title, and the likely pain points they face in data management.");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const variables = ["{{lead.name}}", "{{lead.firstName}}", "{{lead.company}}", "{{lead.title}}", "{{sender.name}}"];

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
        channel,
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

          <div className="grid grid-cols-2 gap-6">
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
            {channel === "Cold Email" && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                  Subject Line
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-12 bg-secondary/50 border-border text-lg font-medium text-foreground focus:ring-cyan-500/20"
                  placeholder="Enter subject line..."
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                Message Body
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Insert:</span>
                {variables.slice(0, 3).map((v) => (
                  <button
                    key={v}
                    onClick={() => handleInject(v)}
                    className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded-md text-cyan-600 dark:text-cyan-400 hover:bg-secondary/80 transition-colors font-mono"
                  >
                    {v.replace(/lead\./, "")}
                  </button>
                ))}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded-md text-muted-foreground hover:text-foreground">
                      More...
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    {variables.map((v) => (
                      <DropdownMenuItem key={v} onClick={() => handleInject(v)} className="text-xs font-mono text-foreground">
                        {v}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full min-h-[350px] bg-secondary/30 border border-border rounded-2xl p-6 text-foreground text-base leading-relaxed outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-500/30 transition-all resize-none"
              placeholder="Write your message here..."
            />
          </div>
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
                {channel === "Cold Email" ? <Mail size={14} className="text-muted-foreground" /> : <FileText size={14} className="text-muted-foreground" />}
              </div>
            </div>

            <div className="flex-1 bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden relative min-h-[300px]">
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-glow shadow-emerald-500/50" />
              
              <div className="space-y-4">
                {channel === "Cold Email" && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-bold">Subject</p>
                    <p className="text-sm font-semibold text-foreground truncate">{subject.replace(/\{\{lead\.company\}\}/g, "TechFlow")}</p>
                  </div>
                )}
                <div className="w-full h-px bg-border/50" />
                <div className="space-y-1 whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed font-sans font-medium">
                  {previewBody}
                </div>
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
