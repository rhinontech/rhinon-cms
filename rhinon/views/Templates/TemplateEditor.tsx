"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Sparkles, Send, BoxSelect, Maximize2 } from "lucide-react";
import { Template } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { useRouter } from "next/navigation";

export function TemplateEditor({ template }: { template: Template | null }) {
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
    <div className="flex flex-col bg-slate-950/40 rounded-3xl border border-slate-800/50 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="p-8 border-b border-slate-800/50 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/templates')}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-glow-sm">
              <BoxSelect size={24} className="text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-slate-100 tracking-tight">{template?.name || "New Template"}</h1>
                <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800/50 text-slate-300 border-slate-700">
                  {template?.channel || "Email"}
                </Badge>
              </div>
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Sparkles size={12} className="text-violet-400" /> AI-Enhanced Propagation Standard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 font-black px-8 h-10 shadow-glow-sm">
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-16rem)] overflow-hidden">
        {/* LEFT PANE: Editor */}
        <div className="flex-1 flex flex-col border-r border-slate-800/50 bg-slate-950/20 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-10 max-w-4xl mx-auto w-full">
            {/* Subject Line (if email) */}
            {(template?.channel === "Email" || !template) && (
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Propagation Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-slate-900/50 border-slate-800 font-bold text-slate-100 h-11 focus:ring-cyan-500/20 transition-all"
                />
              </div>
            )}

            {/* AI Instructions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Sparkles size={14} className="text-violet-500" /> Intelligent Nuance Instructions
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                <textarea
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  className="w-full h-28 bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 text-sm text-slate-300 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none font-medium italic"
                  placeholder="e.g. Keep it casual, mention their recent LinkedIn post..."
                />
              </div>
            </div>

            {/* Template Body */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Base Sequence Body</label>
              </div>

              <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-dashed border-slate-800/60 bg-slate-900/10">
                {variables.map(v => (
                  <button
                    key={v}
                    onClick={() => handleInject(v)}
                    className="text-[10px] font-bold bg-slate-800/50 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-500 px-2 py-1 rounded-md border border-slate-800/50 transition-all"
                  >
                    {v}
                  </button>
                ))}
              </div>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full h-[500px] bg-slate-900/30 border border-slate-800/60 rounded-xl p-6 text-sm leading-relaxed text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none shadow-inner font-medium"
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Live Preview */}
        <div className="w-[450px] flex flex-col bg-slate-900/20 backdrop-blur-sm border-l border-slate-800/50">
          <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Maximize2 size={12} /> Target Preview
            </h3>
            <Badge variant="outline" className="text-[9px] font-bold text-emerald-400 bg-emerald-500/5 border-emerald-500/20">
              LIVE CRYSTALLIZATION
            </Badge>
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="w-full bg-slate-950 border border-slate-800/60 shadow-2xl rounded-2xl overflow-hidden">
              {(!template || template.channel === "Email") ? (
                <>
                  <div className="bg-slate-900/60 border-b border-slate-800/50 px-5 py-4 flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 w-12 text-right">To</span>
                      <span className="text-xs font-medium text-slate-400">marcus@techflow.io</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 w-12 text-right">Subj</span>
                      <span className="text-xs font-bold text-slate-200 italic">{subject.replace(/\{\{lead\.company\}\}/g, "TechFlow")}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-900/60 text-slate-200 px-5 py-4 font-bold flex items-center gap-3 text-xs border-b border-slate-800/50">
                  <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-[10px]">in</div>
                  LinkedIn Reach Mechanism
                </div>
              )}

              <div className="p-8 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {previewBody}
              </div>

              <div className="bg-slate-900/40 px-6 py-4 border-t border-slate-800/50 flex items-start gap-3">
                <BoxSelect size={14} className="text-slate-600 shrink-0 mt-0.5" />
                <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-600 leading-normal">
                  Proprietary crystallization logic active. The AI agent will refine this baseline with specific intelligence before final propagation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Footer Meta */}
      <div className="p-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Revision History</p>
            <Badge variant="outline" className="text-[9px] bg-slate-800/50 border-slate-700">v1.4.2</Badge>
          </div>
        </div>
        <p className="text-[10px] font-bold text-slate-600 italic">Target Protocol: {template?.channel || "Email"}</p>
      </div>
    </div>
  );
}

