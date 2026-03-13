"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Lead } from "@/lib/types";
import { dummyAiActivities } from "@/lib/dummy-data";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Calendar, Linkedin, Mail, Send, Sparkles } from "lucide-react";

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

import { cn } from "@/lib/utils";

export function LeadDrawer({ lead, isOpen, onClose }: LeadDrawerProps) {
  // Find AI activities for this specific lead (if any)
  const aiActivity = dummyAiActivities.find((a) => a.leadId === lead?.id);
  const [editedContent, setEditedContent] = useState(aiActivity?.generatedContent || "");

  // Update content when lead changes
  if (lead && aiActivity && editedContent === "" && aiActivity.generatedContent) {
    setEditedContent(aiActivity.generatedContent);
  }

  if (!lead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="!w-[50vw] !max-w-[50vw] sm:!max-w-[50vw] bg-slate-950 border-slate-800 p-0 flex flex-col h-full overflow-hidden shadow-2xl">
        <SheetHeader className="p-8 border-b border-slate-800/50 bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-glow-sm">
                <Linkedin size={24} className="text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <SheetTitle className="text-xl font-bold text-slate-100 tracking-tight">{lead.name}</SheetTitle>
                  <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800/50 text-slate-300 border-slate-700">
                    {lead.status}
                  </Badge>
                </div>
                <SheetDescription className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <span className="text-cyan-400">{lead.title}</span>
                  <span className="text-slate-600 font-bold">•</span>
                  <span className="text-slate-300">{lead.company}</span>
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 font-semibold h-9">
                <Linkedin size={14} className="mr-2" /> Profile
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mt-8 pb-2">
            <div className="flex items-center gap-3 group">
              <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                <Mail size={14} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Direct Email</p>
                <p className="text-sm font-medium text-slate-300">{lead.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 group">
              <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-violet-400 transition-colors">
                <Building2 size={14} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Organization</p>
                <p className="text-sm font-medium text-slate-300">{lead.company}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 group">
              <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-400 transition-colors">
                <Calendar size={14} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Discovery Date</p>
                <p className="text-sm font-medium text-slate-300">{format(new Date(lead.addedAt), "MMMM d, yyyy")}</p>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="outreach" className="w-full flex flex-col h-full">
          <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-slate-900/50 p-1 mb-6 border border-slate-800/50">
            <TabsTrigger
              value="outreach"
              className="rounded-md px-4 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400"
            >
              Intel Outreach
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-md px-4 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400"
            >
              Activity Log
            </TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-auto bg-slate-950 p-8 custom-scrollbar">

            <TabsContent value="outreach" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Sparkles size={14} className="text-violet-500" /> AI Propagation Content
                </h3>
                {aiActivity?.status === "Pending Review" && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-bold uppercase tracking-tight">Needs Human Review</Badge>
                )}
              </div>

              <div className="card p-0 overflow-hidden bg-slate-900/10 border-slate-800/40 shadow-glow-sm">
                <div className="bg-slate-900/60 px-6 py-4 border-b border-slate-800/50 flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-12 text-right">To</span>
                    <span className="text-sm font-medium text-slate-300">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 w-12 text-right">Subject</span>
                    <span className="text-sm font-bold text-slate-100 italic">Scaling {lead.company}&apos;s operations</span>
                  </div>
                </div>
                <div className="p-6 bg-slate-950/40">
                  <textarea
                    value={editedContent || (aiActivity?.generatedContent ?? "No intelligent propagation content generated for this target.")}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-64 bg-transparent border-none outline-none resize-none text-sm leading-relaxed text-slate-300 font-medium p-0 focus:ring-0"
                    disabled={aiActivity?.status === "Sent"}
                  />
                </div>
              </div>

              {aiActivity?.status !== "Sent" && (
                <div className="flex gap-4 justify-end">
                  <Button variant="outline" className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 font-bold h-10 px-6">
                    Regenerate AI
                  </Button>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 font-black px-8 h-10 shadow-glow-sm">
                    <Send size={16} className="mr-2" /> Launch Outreach
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileText size={14} className="text-cyan-500" /> Discovery & Outreach Timeline
              </h3>

              <div className="relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800 space-y-8">
                {/* Timeline Item 1 */}
                <div className="relative pl-12 group">
                  <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-slate-900 border-2 border-slate-700 ring-4 ring-slate-950 z-10 group-hover:border-cyan-500 transition-colors" />
                  <div className="card p-5 bg-slate-900/20 border-slate-800/40 hover:border-slate-700/60 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-slate-200 font-bold">Target Identified & Imported</p>
                      <span className="text-[10px] font-bold text-slate-500 tabular-nums uppercase">{format(new Date(lead.addedAt), "MMM d, yyyy")}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Added via Outbound Engine: <span className="text-slate-300">Q3 Enterprise SaaS Sweep</span> cohort.</p>
                  </div>
                </div>

                {/* Timeline Item 2 */}
                {aiActivity && (
                  <div className="relative pl-12 group">
                    <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-slate-900 border-2 border-slate-700 ring-4 ring-slate-950 z-10 group-hover:border-violet-500 transition-colors" />
                    <div className="card p-5 bg-slate-900/20 border-slate-800/40 hover:border-slate-700/60 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-slate-200 font-bold">Intelligent Content Crystallized</p>
                        <span className="text-[10px] font-bold text-slate-500 tabular-nums uppercase">{format(new Date(aiActivity.generatedAt), "MMM d, yyyy")}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">Gemini AI analyzed title <span className="text-cyan-400">{lead.title}</span> and company <span className="text-cyan-400">{lead.company}</span> to synthesize personalized outreach.</p>
                    </div>
                  </div>
                )}

                {/* Timeline Item 3 (If Emailed) */}
                {aiActivity?.sentAt && (
                  <div className="relative pl-12 group">
                    <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-slate-900 border-2 border-slate-700 ring-4 ring-slate-950 z-10 group-hover:border-emerald-500 transition-colors" />
                    <div className="card p-5 bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-emerald-300 font-bold">Propagation Initiated</p>
                        <span className="text-[10px] font-bold text-emerald-900 tabular-nums uppercase">{format(new Date(aiActivity.sentAt), "MMM d, yyyy")}</span>
                      </div>
                      <p className="text-xs text-emerald-400/70 leading-relaxed font-medium">Outreach sequence successfully launched via standard SMTP pipeline.</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Floating Footer Meta */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
              {lead.name.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Global ID</p>
              <p className="text-xs font-semibold text-slate-300">{lead.id}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-600 italic">Proprietary Rhinon Lead Intel Profile</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { FileText } from "lucide-react";

