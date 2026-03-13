"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Lead } from "@/lib/types";
import { dummyAiActivities } from "@/lib/dummy-data";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Calendar, FileText, Linkedin, Mail, Send, Sparkles } from "lucide-react";

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadDrawer({ lead, isOpen, onClose }: LeadDrawerProps) {
  const aiActivity = dummyAiActivities.find((a) => a.leadId === lead?.id);
  const [editedContent, setEditedContent] = useState(aiActivity?.generatedContent || "");

  if (lead && aiActivity && editedContent === "" && aiActivity.generatedContent) {
    setEditedContent(aiActivity.generatedContent);
  }
  if (!lead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="!w-[50vw] !max-w-[50vw] sm:!max-w-[50vw] bg-card border-border p-0 flex flex-col h-full overflow-hidden shadow-xl"
      >
        {/* Header */}
        <SheetHeader className="p-8 border-b border-border bg-secondary/30 backdrop-blur-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <Linkedin size={22} className="text-cyan-500" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <SheetTitle className="text-xl font-bold text-foreground tracking-tight">
                    {lead.name}
                  </SheetTitle>
                  <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground border-border">
                    {lead.status}
                  </Badge>
                </div>
                <SheetDescription className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span className="text-cyan-600 dark:text-cyan-400">{lead.title}</span>
                  <span className="text-border font-bold">•</span>
                  <span className="text-foreground">{lead.company}</span>
                </SheetDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-border bg-card text-muted-foreground hover:text-foreground font-semibold h-9">
              <Linkedin size={14} className="mr-2" /> Profile
            </Button>
          </div>

          {/* Contact info grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mt-8 pb-2">
            {[
              { icon: Mail,      label: "Direct Email",    val: lead.email,   accent: "group-hover:text-cyan-500"    },
              { icon: Building2, label: "Organization",    val: lead.company, accent: "group-hover:text-violet-500"  },
              { icon: Calendar,  label: "Discovery Date",  val: format(new Date(lead.addedAt), "MMMM d, yyyy"), accent: "group-hover:text-emerald-500" },
            ].map(({ icon: Icon, label, val, accent }) => (
              <div key={label} className="flex items-center gap-3 group">
                <div className={`h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground transition-colors ${accent}`}>
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground">{val}</p>
                </div>
              </div>
            ))}
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs defaultValue="outreach" className="w-full flex flex-col flex-1 min-h-0">
          <div className="px-8 pt-5 pb-0 border-b border-border bg-card">
            <TabsList className="inline-flex h-9 items-center gap-1 bg-secondary border border-border p-1 rounded-lg">
              <TabsTrigger
                value="outreach"
                className="rounded-md px-4 py-1.5 text-xs font-semibold transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
              >
                Intel Outreach
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="rounded-md px-4 py-1.5 text-xs font-semibold transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
              >
                Activity Log
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto bg-background p-8 custom-scrollbar">
            {/* Outreach Tab */}
            <TabsContent value="outreach" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Sparkles size={14} className="text-violet-500" /> AI Propagation Content
                </h3>
                {aiActivity?.status === "Pending Review" && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 text-[10px] font-bold uppercase">
                    Needs Review
                  </Badge>
                )}
              </div>

              <div className="card overflow-hidden">
                {/* Email meta bar */}
                <div className="bg-secondary border-b border-border px-6 py-4 flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-16 text-right">To</span>
                    <span className="text-sm text-foreground">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-16 text-right">Subject</span>
                    <span className="text-sm font-bold text-foreground italic">Scaling {lead.company}&apos;s operations</span>
                  </div>
                </div>
                {/* Body */}
                <div className="p-6 bg-card">
                  <textarea
                    value={editedContent || (aiActivity?.generatedContent ?? "No intelligent propagation content generated for this target.")}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-60 bg-transparent border-none outline-none resize-none text-sm leading-relaxed text-foreground font-medium p-0 focus:ring-0"
                    disabled={aiActivity?.status === "Sent"}
                  />
                </div>
              </div>

              {aiActivity?.status !== "Sent" && (
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" className="border-border bg-card text-muted-foreground hover:text-foreground font-semibold h-10 px-6">
                    Regenerate AI
                  </Button>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold px-8 h-10">
                    <Send size={15} className="mr-2" /> Launch Outreach
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText size={14} className="text-cyan-500" /> Discovery & Outreach Timeline
              </h3>

              <div className="relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border space-y-6">
                {/* Item 1 */}
                <div className="relative pl-12 group">
                  <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-card border-2 border-border ring-4 ring-background z-10 group-hover:border-cyan-500 transition-colors" />
                  <div className="card p-5 hover:border-muted transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-foreground font-bold">Target Identified & Imported</p>
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums uppercase">
                        {format(new Date(lead.addedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Added via Outbound Engine: <span className="text-foreground font-medium">Q3 Enterprise SaaS Sweep</span> cohort.
                    </p>
                  </div>
                </div>

                {/* Item 2 */}
                {aiActivity && (
                  <div className="relative pl-12 group">
                    <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-card border-2 border-border ring-4 ring-background z-10 group-hover:border-violet-500 transition-colors" />
                    <div className="card p-5 hover:border-muted transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-foreground font-bold">AI Content Generated</p>
                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums uppercase">
                          {format(new Date(aiActivity.generatedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Gemini AI analyzed{" "}
                        <span className="text-cyan-600 dark:text-cyan-400 font-medium">{lead.title}</span> at{" "}
                        <span className="text-cyan-600 dark:text-cyan-400 font-medium">{lead.company}</span> to create personalized outreach.
                      </p>
                    </div>
                  </div>
                )}

                {/* Item 3 */}
                {aiActivity?.sentAt && (
                  <div className="relative pl-12 group">
                    <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-card border-2 border-border ring-4 ring-background z-10 group-hover:border-emerald-500 transition-colors" />
                    <div className="card p-5 border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold">Propagation Initiated</p>
                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums uppercase">
                          {format(new Date(aiActivity.sentAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Outreach sequence successfully launched via SMTP pipeline.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-secondary/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
              {lead.name.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Global ID</p>
              <p className="text-xs font-semibold text-foreground">{lead.id}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground/60 italic">Rhinon Lead Intel Profile</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
