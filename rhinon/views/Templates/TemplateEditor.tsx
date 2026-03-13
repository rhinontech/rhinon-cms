"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Send, BoxSelect, Maximize2 } from "lucide-react";
import { Template } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function TemplateEditor({ template }: { template?: Template | null }) {
  const router = useRouter();
  const [subject, setSubject] = useState(template?.subject || "Scaling {{lead.company}}'s operations");
  const [body, setBody] = useState(template?.body || "Hi {{lead.name}},\n\nI noticed that {{lead.company}} has been expanding rapidly. We help companies like yours automate outbound sales.\n\nWorth a quick chat next week?");
  const [aiInstructions, setAiInstructions] = useState(template?.aiInstructions || "Keep it under 3 sentences. Mention their recent funding round or product launch if applicable.");

  const variables = ["{{lead.name}}", "{{lead.firstName}}", "{{lead.company}}", "{{lead.title}}", "{{sender.name}}"];

  const handleInject = (variable: string) => {
    setBody((prev) => prev + " " + variable);
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
                <Badge variant="outline" className="bg-secondary border-border text-muted-foreground">
                  {template?.channel || "Email"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Draft and optimize your outreach messaging.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
              Save as Draft
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold">
              <Send size={16} className="mr-2" /> Publish Template
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 min-h-[600px]">
        {/* Editor Area */}
        <div className="flex-1 p-8 overflow-y-auto space-y-8 border-r border-border bg-background/50">
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
                      <DropdownMenuItem key={v} onClick={() => handleInject(v)} className="text-xs font-mono">
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
        <div className="w-[400px] flex flex-col bg-secondary/10">
          {/* AI Instructions Panel */}
          <div className="p-8 border-b border-border bg-violet-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                <Sparkles size={18} />
                <span className="text-xs font-black uppercase tracking-widest">AI Personalization</span>
              </div>
              <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 text-[10px]">
                Active
              </Badge>
            </div>
            <textarea
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              className="w-full h-32 bg-secondary/50 border border-violet-500/20 rounded-xl p-4 text-xs text-foreground placeholder:text-muted-foreground/50 italic leading-relaxed focus:ring-2 focus:ring-violet-500/10 outline-none resize-none"
              placeholder="e.g. Reference their recent funding round..."
            />
            <p className="mt-3 text-[10px] text-muted-foreground leading-tight">
              AI uses these instructions to tailor each message uniquely per lead.
            </p>
          </div>

          {/* Live Preview Panel */}
          <div className="p-8 flex-1 flex flex-col bg-background/30">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                Live Preview
              </span>
              <button className="text-muted-foreground hover:text-cyan-500 transition-colors">
                <Maximize2 size={14} />
              </button>
            </div>

            <div className="flex-1 bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-glow shadow-emerald-500/50" />
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-bold">Subject</p>
                  <p className="text-sm font-semibold text-foreground truncate">{subject.replace(/\{\{lead\.company\}\}/g, "TechFlow")}</p>
                </div>
                <div className="w-full h-px bg-border/50" />
                <div className="space-y-1 whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed font-sans">
                  {previewBody}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 w-6 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">
                Verified with 812 similar leads
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
