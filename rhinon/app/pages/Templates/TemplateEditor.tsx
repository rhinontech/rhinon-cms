"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Sparkles, Send, BoxSelect, Maximize2 } from "lucide-react";
import { Template } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TemplateEditorProps {
  template: Template | null;
  onClose: () => void;
}

export function TemplateEditor({ template, onClose }: TemplateEditorProps) {
  const [subject, setSubject] = useState(template?.subject || "Scaling {{lead.company}}'s operations");
  const [body, setBody] = useState(template?.body || "Hi {{lead.name}},\n\nI noticed that {{lead.company}} has been expanding rapidly. We help companies like yours automate outbound sales.\n\nWorth a quick chat next week?");
  const [aiInstructions, setAiInstructions] = useState(template?.aiInstructions || "Keep it under 3 sentences. Mention their recent funding round or product launch if applicable.");

  const variables = ["{{lead.name}}", "{{lead.firstName}}", "{{lead.company}}", "{{lead.title}}", "{{sender.name}}"];

  const handleInject = (variable: string) => {
    setBody((prev) => prev + " " + variable);
  };

  if (!template) return null;

  // Fake preview with replaced variables
  const previewBody = body
    .replace(/\{\{lead\.name\}\}/g, "Marcus Johnson")
    .replace(/\{\{lead\.firstName\}\}/g, "Marcus")
    .replace(/\{\{lead\.company\}\}/g, "TechFlow")
    .replace(/\{\{lead\.title\}\}/g, "Founder & CEO")
    .replace(/\{\{sender\.name\}\}/g, "Alex Mercer");

  return (
    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col animate-in slide-in-from-right-8 duration-300">
      <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-slate-200">{template.name}</h2>
            <p className="text-xs text-slate-500">Last edited {format(new Date(template.updatedAt), "MMM d, yyyy")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-slate-800">{template.channel}</Badge>
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium">
            Save Template
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANE: Editor */}
        <div className="w-1/2 flex flex-col border-r border-slate-800 bg-slate-950 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Subject Line (if email) */}
            {template.channel === "Email" && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Subject Line</label>
                <Input 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-slate-900 border-slate-800 font-medium"
                />
              </div>
            )}

            {/* AI Instructions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-violet-400" />
                <label className="text-sm font-medium text-slate-300">Instructions for AI Agent</label>
              </div>
              <p className="text-xs text-slate-500">
                These instructions guide Gemini when generating personalized variants of this template.
              </p>
              <textarea 
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all resize-none"
                placeholder="e.g. Keep it casual, mention their recent LinkedIn post..."
              />
            </div>

            {/* Template Body */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">Base Template Body</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Variables:</span>
                  <DropdownMenu>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2 p-3 rounded-lg border border-dashed border-slate-800 bg-slate-900/30">
                {variables.map(v => (
                  <button 
                    key={v}
                    onClick={() => handleInject(v)}
                    className="text-xs bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-400 px-2 py-1 rounded transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>

              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full h-64 bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANE: Live Preview */}
        <div className="w-1/2 flex flex-col bg-slate-900/30">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Maximize2 size={14} /> Live Preview
            </h3>
            <div className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
              Simulating recipient: Marcus Johnson (TechFlow)
            </div>
          </div>

          <div className="p-8 flex-1 overflow-y-auto flex justify-center items-start">
            <div className="w-full max-w-lg bg-slate-950 border border-slate-800 shadow-2xl rounded-xl overflow-hidden mt-8">
              {template.channel === "Email" ? (
                <>
                  <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex gap-4 text-sm">
                    <div className="text-slate-500 font-medium">To:</div>
                    <div className="text-slate-300">marcus@techflow.io</div>
                  </div>
                  <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex gap-4 text-sm">
                    <div className="text-slate-500 font-medium">Subj:</div>
                    <div className="text-slate-200 font-medium">{subject.replace(/\{\{lead\.company\}\}/g, "TechFlow")}</div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-800 text-slate-200 px-4 py-3 font-medium flex items-center gap-2 text-sm border-b border-slate-700">
                  <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white">in</div>
                  LinkedIn Message
                </div>
              )}
              
              <div className="p-6 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {previewBody}
              </div>
              
              <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-2">
                <BoxSelect size={14} /> This is a static preview showing how variables resolve. The AI agent will slightly modify this text based on instructions before sending.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
