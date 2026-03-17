"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Lead, Template } from "@/lib/types";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Calendar, FileText, Linkedin, Mail, Send, Sparkles, Wand2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LeadDrawer({ lead, isOpen, onClose }: LeadDrawerProps) {
  const [editedContent, setEditedContent] = useState(lead?.aiDraft || "");
  const [editedSubject, setEditedSubject] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichment, setEnrichment] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [showNoTemplateModal, setShowNoTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [manualPrompt, setManualPrompt] = useState("");
  const [showAiCustomizer, setShowAiCustomizer] = useState(false);

  const fetchActivities = async () => {
    if (!lead) return;
    try {
      const res = await fetch(`/api/leads/${(lead as any)._id || lead.id}/activities`);
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  useEffect(() => {
    if (isOpen && lead) {
      setEditedContent(lead.aiDraft || "");
      setEditedSubject(`Scaling ${lead.company}'s operations`);
      fetchActivities();
      
      // Load templates in background
      fetch("/api/templates")
        .then(res => res.json())
        .then(data => {
          setTemplates(data || []);
          if (data && data.length > 0) {
            setSelectedTemplateId(data[0]._id || data[0].id);
          }
        });
    }
  }, [isOpen, lead]);

  const handleRegenerate = async () => {
    if (!lead) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: (lead as any)._id || lead.id,
          templateId: selectedTemplateId || null,
          customPrompt: manualPrompt || null
        }),
      });
      const data = await res.json();
      if (data.draft) {
        setEditedContent(data.draft);
        if (data.subject) setEditedSubject(data.subject);
        fetchActivities();
        setShowAiCustomizer(false); // Close customizer after success
      }
    } catch (error) {
      console.error("Error regenerating AI content:", error);
      toast.error("Failed to generate AI content.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnrich = async () => {
    if (!lead) return;
    setIsEnriching(true);
    try {
      const res = await fetch("/api/ai/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: (lead as any)._id || lead.id }),
      });
      const data = await res.json();
      setEnrichment(data);
      fetchActivities();
    } catch (error) {
      console.error("Error enriching lead:", error);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleLaunchOutreach = async () => {
    if (!lead || !editedContent) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: (lead as any)._id || lead.id,
          subject: editedSubject || `Scaling ${lead.company}'s operations`,
          body: editedContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Outreach sent successfully via Rhinon Engine!");
        fetchActivities();
        onClose();
      }
    } catch (error) {
      console.error("Error sending outreach:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (!lead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full lg:w-[65vw] max-w-full lg:max-w-[65vw] bg-card border-border p-0 flex flex-col h-full overflow-hidden shadow-xl"
      >
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
            <div className="flex gap-2">
              <Button
                onClick={handleEnrich}
                disabled={isEnriching}
                variant="outline"
                size="sm"
                className="border-violet-500/20 bg-violet-500/5 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 font-semibold h-9"
              >
                <Sparkles size={14} className="mr-2" /> {isEnriching ? "Enriching..." : "Enrich Lead"}
              </Button>
              <Button variant="outline" size="sm" className="border-border bg-card text-muted-foreground hover:text-foreground font-semibold h-9">
                <Linkedin size={14} className="mr-2" /> Profile
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mt-8 pb-2">
            {[
              { icon: Mail, label: "Direct Email", val: lead.email, accent: "group-hover:text-cyan-500" },
              { icon: Building2, label: "Organization", val: lead.company, accent: "group-hover:text-violet-500" },
              { icon: Calendar, label: "Discovery Date", val: format(new Date(lead.addedAt), "MMMM d, yyyy"), accent: "group-hover:text-emerald-500" },
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

        <Tabs defaultValue="outreach" className="w-full flex flex-col flex-1 min-h-0">
          <div className="p-5 pt-0 border-b border-border bg-card">
            <TabsList className="inline-flex h-9 items-center gap-1 bg-secondary border border-border p-1 rounded-lg">
              <TabsTrigger
                value="outreach"
                className="rounded-md px-4 py-1.5 text-xs font-semibold transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
              >
                Intel Outreach
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                onClick={fetchActivities}
                className="rounded-md px-4 py-1.5 text-xs font-semibold transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
              >
                Activity Log
              </TabsTrigger>
            </TabsList>
            {enrichment && (
              <div className="mt-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 animate-in fade-in zoom-in-95">
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2 flex items-center gap-1">
                  <Sparkles size={10} /> AI Intel Found
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed italic">
                  &quot;{enrichment.potentialPainPoint}&quot;
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto bg-background p-8 custom-scrollbar">
            <TabsContent value="outreach" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Sparkles size={14} className="text-violet-500" /> AI Propagation Content
                </h3>
                <Button 
                  onClick={() => setShowAiCustomizer(!showAiCustomizer)}
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-8 text-[10px] font-black uppercase tracking-widest", showAiCustomizer ? "text-violet-500" : "text-muted-foreground")}
                >
                  <Settings size={12} className="mr-1.5" /> AI Customizer
                </Button>
              </div>

              {showAiCustomizer && (
                <div className="p-5 rounded-2xl bg-violet-500/5 border border-violet-500/10 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Base Template</label>
                      <select 
                        value={selectedTemplateId} 
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg h-9 text-xs px-2 outline-none focus:ring-1 focus:ring-violet-500/30"
                      >
                        <option value="">No Template (Generic AI Mode)</option>
                        {templates.map(t => (
                          <option key={(t as any)._id || t.id} value={(t as any)._id || t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Reference Lead Info</label>
                      <div className="h-9 px-3 flex items-center bg-background border border-border rounded-lg text-[10px] text-muted-foreground italic truncate">
                        Using Intel: {lead.company} • {lead.title}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Manual Prompt / Instructions (Optional)</label>
                    <textarea 
                      value={manualPrompt}
                      onChange={(e) => setManualPrompt(e.target.value)}
                      placeholder="e.g. Focus on ROI and data security. Keep it under 100 words."
                      className="w-full h-20 bg-background border border-border rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-violet-500/30 resize-none"
                    />
                  </div>
                  <Button 
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="w-full bg-violet-500 hover:bg-violet-600 text-white font-bold h-9 text-xs"
                  >
                    {isGenerating ? "Generating..." : "Generate Optimized Draft"}
                  </Button>
                </div>
              )}

              <div className="card overflow-hidden">
                <div className="bg-secondary border-b border-border px-6 py-4 flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-16 text-right">To</span>
                    <span className="text-sm text-foreground">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-16 text-right">Subject</span>
                    <input
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm font-bold text-foreground italic flex-1 focus:ring-0"
                      placeholder="Enter subject..."
                    />
                  </div>
                </div>
                <div className="p-6 bg-card relative">
                  {isGenerating && (
                    <div className="absolute inset-0 bg-card/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                        <span className="text-xs font-bold text-cyan-600 animate-pulse">Gemini is thinking...</span>
                      </div>
                    </div>
                  )}
                  <textarea
                    value={editedContent || "No intelligent propagation content generated for this target."}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-60 bg-transparent border-none outline-none resize-none text-sm leading-relaxed text-foreground font-medium p-0 focus:ring-0"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowAiCustomizer(true)}
                  disabled={isGenerating}
                  variant="outline"
                  className="border-border bg-card text-muted-foreground hover:text-foreground font-semibold h-10 px-6"
                >
                  {editedContent ? "Customize AI" : "Generate AI Draft"}
                </Button>
                <Button
                  onClick={handleLaunchOutreach}
                  disabled={isSending || !editedContent}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold px-8 h-10"
                >
                  <Send size={15} className="mr-2" /> {isSending ? "Sending..." : "Launch Outreach"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText size={14} className="text-cyan-500" /> Discovery & Outreach Timeline
              </h3>

              <div className="relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border space-y-6">
                {/* Item 1 - Lead Added (Derived) */}
                {/* <div className="relative pl-12 group">
                  <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-card border-2 border-border ring-4 ring-background z-10 group-hover:border-cyan-500 transition-colors" />
                  <div className="card p-5 hover:border-muted transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-foreground font-bold">Target Identified & Imported</p>
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums uppercase">
                        {format(new Date(lead.addedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Added via Outbound Engine. Ready for propagation.
                    </p>
                  </div>
                </div> */}

                {/* Dynamic AI Activities */}
                {activities.map((activity) => (
                  <div key={activity._id} className="relative pl-12 group">
                    <div className={cn(
                      "absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-card border-2 ring-4 ring-background z-10 transition-colors",
                      activity.type === "Enrichment" ? "border-violet-500 group-hover:bg-violet-500" :
                        activity.type === "OutreachSent" ? "border-emerald-500 group-hover:bg-emerald-500" :
                          "border-cyan-500 group-hover:bg-cyan-500"
                    )} />
                    <div className="card p-5 hover:border-muted transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-foreground font-bold">
                          {activity.type === "Enrichment" ? "Lead Intel Gathered" :
                            activity.type === "DraftGenerated" ? "AI Outreach Drafted" :
                              activity.type === "Outreach" ? "Campaign Draft Ready" :
                                activity.type === "Discovery" ? "Lead Discovered" :
                                  "Outreach Successfully Sent"}
                        </p>
                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums uppercase">
                          {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {activity.content}
                      </p>
                    </div>
                  </div>
                ))}

                {activities.length === 0 && (
                  <div className="relative pl-12 group">
                    <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-card border-2 border-border ring-4 ring-background z-10 transition-colors" />
                    <div className="card p-5 border-dashed bg-transparent">
                      <p className="text-xs text-muted-foreground italic">No AI propagation activities recorded for this target yet.</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="p-6 border-t border-border bg-secondary/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
              {lead.name.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Global ID</p>
              <p className="text-xs font-semibold text-foreground">{(lead as any)._id || lead.id}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground/60 italic">Rhinon Lead Intel Profile</p>
        </div>
      </SheetContent>

      <Dialog open={showNoTemplateModal} onOpenChange={setShowNoTemplateModal}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl">
          <DialogHeader className="flex flex-col items-center text-center pt-4">
            <div className="h-16 w-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 shadow-glow-sm">
              <Wand2 size={32} className="text-violet-500 animate-pulse" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground mb-2">
              Templates Required
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed px-4">
              To generate AI drafts, you first need to create a Message Template. This serves as the foundation for the AI's personalized outreach.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-center gap-3 mt-6 pb-2">
            <Button
              variant="outline"
              onClick={() => setShowNoTemplateModal(false)}
              className="border-border text-muted-foreground hover:text-foreground h-11 px-6 font-bold"
            >
              Maybe Later
            </Button>
            <Link href="/templates/new">
              <Button
                className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black h-11 px-8 rounded-xl shadow-glow-sm"
              >
                Create Template
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
