"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Send, BoxSelect, Loader2, Wand2, Mail, Eye, Layout } from "lucide-react";
import { generateEmailHtml } from "@/lib/email-templates";
import { Template, Channel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor").then(m => m.RichTextEditor), {
  ssr: false,
  loading: () => <div className="w-full h-[450px] bg-secondary/10 animate-pulse rounded-xl border border-border" />
});

const CHANNELS: Channel[] = ["Cold Email"];

export function TemplateEditor({ template, initialChannel }: { template?: Template | null, initialChannel?: string }) {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;
  
  const [name, setName] = useState(template?.name || "New Template");
  const defaultChannel = template?.channel || (initialChannel as Channel) || "Cold Email";
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  
  const getDefaultContent = (ch: Channel) => {
    switch (ch) {
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
  const [body, setBody] = useState(initialContent.body || "");
  const [aiInstructions, setAiInstructions] = useState(initialContent.aiInstructions || "");

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isPreviewBranded, setIsPreviewBranded] = useState(false);
  
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
        channel
      };

      const id = (template as any)?._id;
      const url = id ? `/api/templates/${id}` : "/api/templates";
      const method = id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(id ? "Template updated!" : "Template created!");
        router.push(`/${role}/templates`);
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  // Fake preview with replaced variables
  const previewBody = (body || "")
    .replace(/\{\{lead\.name\}\}/g, "Marcus Johnson")
    .replace(/\{\{lead\.firstName\}\}/g, "Marcus")
    .replace(/\{\{lead\.company\}\}/g, "TechFlow")
    .replace(/\{\{lead\.title\}\}/g, "Founder & CEO")
    .replace(/\{\{sender\.name\}\}/g, "Alex Mercer");

  const MarkdownRenderer = ({ content }: { content: string }) => {
    if (!content) return null;

    // If it's HTML (from Tiptap), use dangerouslySetInnerHTML for the preview
    if (content.trim().startsWith("<")) {
      return (
        <div 
          className="text-foreground/90 leading-relaxed text-sm font-medium prose prose-sm dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    const processInlines = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, j) => {
        if (part?.startsWith("**") && part?.endsWith("**")) {
          return <strong key={j} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    const lines = content.split("\n");
    const rendered: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        rendered.push(
          <ul key={`list-${rendered.length}`} className="space-y-2 my-4 ml-4 list-disc marker:text-cyan-500">
            {currentList}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const item = trimmed.replace(/^[\*\-]\s+/, "");
        currentList.push(
          <li key={i} className="text-foreground/80 pl-2">
            {processInlines(item)}
          </li>
        );
        return;
      }

      flushList();

      if (trimmed === "") {
        rendered.push(<div key={i} className="h-4" />);
      } else {
        rendered.push(<p key={i} className="mb-4">{processInlines(line)}</p>);
      }
    });

    flushList();
    return <div className="text-foreground/90 leading-relaxed text-sm font-medium">{rendered}</div>;
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
                  {template ? "Edit Template" : "New Template"}
                </h2>
                <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/20 text-cyan-400 uppercase text-[10px] font-black tracking-widest px-3 py-1">
                  {channel}
                </Badge>
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
                  placeholder="Describe your goal (e.g. 'A professional outreach email for CFOs about data optimization')"
                  className="flex-1 bg-background border-border h-11 text-sm font-medium"
                  onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                />
                <Button 
                  onClick={handleAiGenerate}
                  disabled={isGenerating || !aiPrompt}
                  className="bg-violet-500 hover:bg-violet-600 text-white font-bold h-11 px-8 rounded-xl shadow-glow shadow-violet-500/20"
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

          {/* Email Form */}
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
                    <button 
                      key={v} 
                      type="button"
                      onClick={() => {
                        // This logic will be handled inside RichTextEditor or via a bridge.
                        // For now, let's ensure we can still inject.
                        setBody((prev) => prev + " " + v);
                      }} 
                      className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded-md text-cyan-600 dark:text-cyan-400 hover:bg-secondary/80 transition-colors font-mono"
                    >
                      {v.replace(/[{}]/g, "").replace("lead.", "")}
                    </button>
                  ))}
                </div>
              </div>
              <RichTextEditor 
                content={body} 
                onChange={setBody} 
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
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
              placeholder="e.g. Research the company's recent activity to fill the research placeholder..."
            />
            <p className="mt-3 text-[10px] text-muted-foreground leading-tight font-medium">
              AI uses these instructions to tailor each message uniquely per lead when generating outreach drafts.
            </p>
          </div>

          {/* Live Preview Panel */}
          <div className="p-8 flex-1 flex flex-col bg-background/30 overflow-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1 bg-secondary/50 border border-border p-1 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewBranded(false)}
                  className={cn("px-2 py-1 h-7 text-[9px] font-black uppercase tracking-widest", !isPreviewBranded ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                >
                  Draft
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewBranded(true)}
                  className={cn("px-2 py-1 h-7 text-[9px] font-black uppercase tracking-widest", isPreviewBranded ? "bg-card text-cyan-500 shadow-sm" : "text-muted-foreground")}
                >
                  Branded
                </Button>
              </div>
            </div>

            <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
              {isPreviewBranded ? (
                <iframe 
                  srcDoc={generateEmailHtml(previewBody)} 
                  className="w-full h-full border-0"
                  title="Email Preview"
                />
              ) : (
                <>
                  {/* Fake Browser/Email Tab Header */}
              <div className="bg-secondary/30 px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-background/50 px-3 py-1 rounded-full border border-border/50">
                    <Mail size={10} /> {channel} Preview
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-glow shadow-emerald-500/50" />
              </div>

              <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-black">Subject</p>
                  <p className="text-sm font-bold text-foreground">{(subject || "").replace(/\{\{lead\.company\}\}/g, "TechFlow")}</p>
                </div>
                <div className="w-full h-px bg-border/50" />
                <div className="space-y-1">
                   <MarkdownRenderer content={previewBody} />
                </div>
              </div>
                </>
              )}
            </div>

            <div className="mt-8 p-4 rounded-xl border border-dashed border-border flex flex-col gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">Output Quality Score</p>
              <div className="flex h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-linear-to-r from-cyan-500 to-violet-500" />
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
