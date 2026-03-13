"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Lead } from "@/app/lib/types";
import { dummyAiActivities } from "@/app/lib/dummy-data";
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
      <SheetContent className="w-full sm:max-w-xl bg-slate-950 border-l border-slate-800 p-0 flex flex-col h-full overflow-hidden text-slate-300">
        <SheetHeader className="p-6 border-b border-slate-800/60 bg-slate-900/50">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold text-slate-100">{lead.name}</SheetTitle>
              <SheetDescription className="text-slate-400 mt-1 flex items-center gap-2">
                <span className="text-cyan-400 font-medium">{lead.title}</span> 
                at <span className="text-slate-200 font-medium">{lead.company}</span>
              </SheetDescription>
            </div>
            <Badge variant="outline" className="bg-slate-800/50">{lead.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Mail size={14} className="text-slate-500" />
              <span>{lead.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Building2 size={14} className="text-slate-500" />
              <span>{lead.company}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Linkedin size={14} className="text-slate-500" />
              <a href="#" className="text-cyan-400 hover:underline">LinkedIn Profile</a>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar size={14} className="text-slate-500" />
              <span>Added {format(new Date(lead.addedAt), "MMM d, yyyy")}</span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto bg-slate-950 p-6">
          <Tabs defaultValue="outreach" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-900 border border-slate-800">
              <TabsTrigger value="outreach" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">Outreach Content</TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100">Activity Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="outreach" className="mt-6 space-y-4">
              <div className="flex items-center gap-2 font-medium text-slate-200">
                <Sparkles size={16} className="text-violet-400" />
                AI Generated Email
                {aiActivity?.status === "Pending Review" && (
                  <Badge variant="outline" className="ml-auto bg-amber-500/10 text-amber-400 border-amber-500/20">Needs Review</Badge>
                )}
              </div>
              
              <div className="text-sm text-slate-400 border border-slate-800 bg-slate-900/50 rounded-xl p-3">
                <div className="flex flex-col gap-1 mb-3 pb-3 border-b border-slate-800/80">
                  <span className="flex items-center gap-2"><span className="w-8 text-slate-500">To:</span> {lead.email}</span>
                  <span className="flex items-center gap-2"><span className="w-8 text-slate-500">Subj:</span> 
                    <span className="text-slate-200">Scaling {lead.company}&apos;s operations</span>
                  </span>
                </div>
                <textarea 
                  value={editedContent || (aiActivity?.generatedContent ?? "No AI content generated yet for this lead.")}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-48 bg-transparent border-none outline-none resize-none text-slate-300 focus:ring-0 p-0"
                  disabled={aiActivity?.status === "Sent"}
                />
              </div>

              {aiActivity?.status !== "Sent" && (
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" className="border-slate-800 bg-slate-900 hover:bg-slate-800">
                    Regenerate AI
                  </Button>
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium">
                    <Send size={14} className="mr-2" /> Send Email Now
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="activity" className="mt-6">
              <div className="relative border-l border-slate-800 ml-3 space-y-8 pb-4">
                {/* Timeline Item 1 */}
                <div className="relative pl-6">
                  <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-cyan-500 ring-4 ring-slate-950" />
                  <p className="text-xs text-slate-500">{format(new Date(lead.addedAt), "MMM d, yyyy \u2022 h:mm a")}</p>
                  <p className="text-sm text-slate-300 mt-1 font-medium">Lead Imported</p>
                  <p className="text-sm text-slate-400 mt-0.5">Added via Q3 Enterprise SaaS Sweep cohort</p>
                </div>

                {/* Timeline Item 2 */}
                {aiActivity && (
                  <div className="relative pl-6">
                    <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-violet-500 ring-4 ring-slate-950" />
                    <p className="text-xs text-slate-500">{format(new Date(aiActivity.generatedAt), "MMM d, yyyy \u2022 h:mm a")}</p>
                    <p className="text-sm text-slate-300 mt-1 font-medium">AI Content Generated</p>
                    <p className="text-sm text-slate-400 mt-0.5">Gemini processed campaign template 1</p>
                  </div>
                )}

                {/* Timeline Item 3 (If Emailed) */}
                {aiActivity?.sentAt && (
                  <div className="relative pl-6">
                    <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-slate-950" />
                    <p className="text-xs text-slate-500">{format(new Date(aiActivity.sentAt), "MMM d, yyyy \u2022 h:mm a")}</p>
                    <p className="text-sm text-slate-300 mt-1 font-medium">Outreach Sent</p>
                    <p className="text-sm text-slate-400 mt-0.5">Automated sequence initiated</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
