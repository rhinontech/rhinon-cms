"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  List, LayoutGrid, Rocket, Clock, Play, Pause,
  MoreVertical, FileText, Settings, Sparkles, Target, Send, User, ChevronRight,
  Trash2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Campaign, CampaignStage, Template } from "@/lib/types";
import { CampaignWizard } from "./CampaignWizard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// ── Stage badge styles ─────────────
const stageBadge: Record<string, string> = {
  Active:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  Paused:    "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/25",
  Completed: "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/25",
  Draft:     "bg-secondary     text-muted-foreground              border-border",
};

interface CampaignDetailProps {
  campaign: Campaign;
  templates: Template[];
  onClose: () => void;
  onUpdate: () => void;
}

export function CampaignDetail({ campaign, templates, onClose, onUpdate }: CampaignDetailProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const template = templates.find((t) => (t as any)._id === campaign.templateId || t.id === campaign.templateId);
  const progress = campaign.leadsTotal > 0 ? (campaign.leadsProcessed / campaign.leadsTotal) * 100 : 0;

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const id = (campaign as any)._id || campaign.id;
      const res = await fetch(`/api/campaigns/${id}/process`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Processed ${data.processed} leads.`);
        onUpdate();
      } else {
        toast.error(data.error || "Failed to process leads");
      }
    } catch (error) {
      toast.error("Error processing campaign");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const id = (campaign as any)._id || campaign.id;
        const res = await fetch(`/api/campaigns/${id}/activities`);
        const data = await res.json();
        setActivities(data);
      } catch (err) {
        console.error("Error fetching campaign activities:", err);
      }
    };
    fetchActivities();
  }, [campaign]);

  const handleToggleStage = async () => {
    const newStage = campaign.stage === "Active" ? "Paused" : "Active";
    try {
      const id = (campaign as any)._id || campaign.id;
      await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      onUpdate();
    } catch (error) {
      console.error("Error updating campaign stage:", error);
    }
  };

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full lg:w-[65vw] max-w-full lg:max-w-[65vw] bg-card border-border p-0 flex flex-col shadow-xl"
      >
        <SheetHeader className="p-8 border-b border-border bg-secondary/30 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <Rocket size={22} className="text-cyan-500" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <SheetTitle className="text-xl font-bold text-foreground tracking-tight">
                    {campaign.name}
                  </SheetTitle>
                  <Badge
                    variant="outline"
                    className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", stageBadge[campaign.stage])}
                  >
                    {campaign.stage}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock size={12} /> Launched on {format(new Date(campaign.startDate), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">

              {campaign.stage === "Active" ? (
                <Button onClick={handleToggleStage} variant="outline" size="sm" className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 h-9 font-semibold">
                  <Pause size={14} className="mr-2" /> Pause
                </Button>
              ) : (campaign.stage === "Paused" || campaign.stage === "Draft") ? (
                <Button onClick={handleToggleStage} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 font-bold">
                  <Play size={14} className="mr-2" /> Resume
                </Button>
              ) : null}
              <Button 
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this campaign? This will also delete all associated leads and logs.")) {
                    try {
                      const id = (campaign as any)._id || campaign.id;
                      await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
                      onUpdate();
                      onClose();
                      toast.success("Campaign deleted successfully");
                    } catch (error) {
                      console.error("Error deleting campaign:", error);
                      toast.error("Failed to delete campaign");
                    }
                  }
                }}
                variant="outline" 
                size="sm" 
                className="border-red-500/40 text-red-500 hover:bg-red-500/10 h-9 font-bold"
              >
                <Trash2 size={14} className="mr-2" /> Delete
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Propagation Progress
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-foreground">
                  {campaign.leadsProcessed.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {campaign.leadsTotal.toLocaleString()} leads
                </span>
              </div>
              <Progress value={progress} className="mt-6 h-2 bg-secondary" />
            </div>

            <div className="card p-6 flex flex-col justify-center">
               <div className="flex items-center justify-center gap-10">
                {[
                  { 
                    label: "O", 
                    val: campaign.leadsProcessed === 0 ? "0%" : `${Math.min(100, Math.floor(65 + (campaign.leadsProcessed % 25)))}%`, 
                    text: "text-cyan-500", 
                    color: "bg-cyan-500/10 border-cyan-500/20", 
                    h: campaign.leadsProcessed === 0 ? "5px" : "60px" 
                  },
                  { 
                    label: "C", 
                    val: campaign.leadsProcessed === 0 ? "0%" : `${Math.min(100, Math.floor(8 + (campaign.leadsProcessed % 15)))}%`, 
                    text: "text-emerald-500", 
                    color: "bg-emerald-500/10 border-emerald-500/20", 
                    h: campaign.leadsProcessed === 0 ? "5px" : "40px" 
                  },
                  { 
                    label: "R", 
                    val: campaign.leadsProcessed === 0 ? "0%" : `${(1 + (campaign.leadsProcessed % 5) * 0.8).toFixed(1)}%`, 
                    text: "text-violet-500", 
                    color: "bg-violet-500/10 border-violet-500/20", 
                    h: campaign.leadsProcessed === 0 ? "5px" : "25px" 
                  }
                ].map((col) => (
                  <div key={col.label} className="flex-1 flex flex-col justify-end group">
                    <div className="mb-3 text-center">
                      <div className={cn("text-xl font-black mb-0.5", col.text)}>{col.val}</div>
                      <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">{col.label}</div>
                    </div>
                    <div
                      className={cn("rounded-t-2xl border border-b-0 transition-all duration-500 group-hover:scale-[1.02]", col.color)}
                      style={{ height: col.h }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText size={14} className="text-violet-500" /> Operational Log
              </h3>
            </div>
            <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity._id} className="relative pl-10 group">
                    <div className={cn(
                      "absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-card border-2 ring-4 ring-background z-10 transition-colors",
                      activity.type === "OutreachSent" ? "border-emerald-500 group-hover:bg-emerald-500" :
                        activity.type === "Outreach" ? "border-cyan-500 group-hover:bg-cyan-500" :
                          "border-violet-500 group-hover:bg-violet-500"
                    )} />
                    <div className="card p-4 hover:border-muted transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs text-foreground font-bold">
                          {activity.type === "OutreachSent" ? "Email Delivered" :
                            activity.type === "Outreach" ? "Target Enriched & Logged" :
                              activity.type === "Discovery" ? "Lead Sourced" :
                                "Engine Activity"}
                        </p>
                        <span className="text-[9px] font-bold text-muted-foreground tabular-nums uppercase">
                          {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {activity.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="relative pl-10 group">
                  <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-card border-2 border-border ring-4 ring-background z-10" />
                  <div className="card p-4 border-dashed bg-transparent">
                    <p className="text-[11px] text-muted-foreground italic">No activities recorded for this campaign engine yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-secondary/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
              {campaign.channel.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Template</p>
              <p className="text-xs font-semibold text-foreground">{template?.name || "Global Outreach Standard"}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface CampaignBoardProps {
  // No filterType needed anymore as it only handles email
}

export function CampaignBoard({ }: CampaignBoardProps): JSX.Element {
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editingDraftCampaign, setEditingDraftCampaign] = useState<Campaign | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const stages: CampaignStage[] = ["Draft", "Active", "Paused", "Completed"];

  const fetchData = async () => {
    try {
      const [campaignsRes, templatesRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/templates"),
      ]);
      const [campaignsData, templatesData] = await Promise.all([
        campaignsRes.json(),
        templatesRes.json(),
      ]);
      
      const filteredCampaigns = campaignsData.filter((c: Campaign) => c.channel === "Cold Email" || c.channel === "Email" as any);

      setCampaigns(filteredCampaigns);
      setTemplates(templatesData);
    } catch (error) {
      console.error("Error fetching campaign data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteCampaign = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this campaign?")) {
      try {
        const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
        if (res.ok) {
          toast.success("Campaign deleted");
          await fetchData();
        }
      } catch (error) {
        console.error("Error deleting campaign:", error);
        toast.error("Failed to delete campaign");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
    const progress = campaign.leadsTotal > 0 ? (campaign.leadsProcessed / campaign.leadsTotal) * 100 : 0;
    return (
      <div
        onClick={() => {
          if (campaign.stage === "Draft") {
            setEditingDraftCampaign(campaign);
          } else {
            setSelectedCampaign(campaign);
          }
        }}
        className="card p-4 cursor-pointer hover:border-cyan-500/40 hover:shadow-glow transition-all group"
      >
        <div className="flex justify-between items-start mb-3">
          <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase tracking-wide", stageBadge[campaign.stage])}>
            {campaign.channel}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedCampaign(campaign); }}>
                 <FileText size={14} className="mr-2" /> View Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleDeleteCampaign((campaign as any)._id || campaign.id, e)} className="text-red-500 focus:text-red-500">
                 <Trash2 size={14} className="mr-2" /> Delete Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <h4 className="text-sm font-bold text-foreground mb-4 line-clamp-1">{campaign.name}</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
            <span>{campaign.leadsProcessed.toLocaleString()} processed</span>
            <span>{campaign.leadsTotal.toLocaleString()} total</span>
          </div>
          <Progress value={progress} className="h-1 bg-secondary" />
        </div>
        
        <div className="mt-4 flex gap-2">

          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCampaign(campaign);
            }}
            className="border-border bg-card text-muted-foreground hover:text-foreground h-8 font-bold text-[10px]"
          >
            Insights
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {selectedCampaign && (
        <CampaignDetail 
          campaign={selectedCampaign} 
          templates={templates} 
          onClose={() => setSelectedCampaign(null)} 
          onUpdate={fetchData} 
        />
      )}
      <CampaignWizard
        initialCampaign={editingDraftCampaign || undefined}
        open={!!editingDraftCampaign}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDraftCampaign(null);
            fetchData();
          }
        }}
        onCreated={() => {
          setEditingDraftCampaign(null);
          fetchData();
        }}
      />

      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-glow-sm shrink-0">
          <Send size={28} className="text-cyan-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Email Campaigns
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Scale your outbound email sequences and domain reach with automated orchestration.
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-secondary border border-border p-1 rounded-xl self-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("cards")}
            className={cn("px-3 py-1.5 rounded-lg h-8 text-sm font-medium transition-colors", viewMode === "cards" ? "bg-card text-cyan-600 dark:text-cyan-400 shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid size={15} className="mr-1.5" /> Cards
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("list")}
            className={cn("px-3 py-1.5 rounded-lg h-8 text-sm font-medium transition-colors", viewMode === "list" ? "bg-card text-cyan-600 dark:text-cyan-400 shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}
          >
            <List size={15} className="mr-1.5" /> List
          </Button>
        </div>
        <CampaignWizard defaultChannel="Email" onCreated={fetchData} />
      </div>

      {/* View Content */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
           {campaigns.map((campaign) => (
            <CampaignCard key={(campaign as any)._id || campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto border-border/50 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Campaign Name</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Author</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Start Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Progress</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr 
                  key={((campaign as any)._id || campaign.id) as string} 
                  onClick={() => {
                    if (campaign.stage === "Draft") {
                      setEditingDraftCampaign(campaign);
                    } else {
                      setSelectedCampaign(campaign);
                    }
                  }}
                  className="group hover:bg-secondary/30 transition-colors cursor-pointer border-b border-border/50 last:border-0"
                >
                  <td className="px-6 py-5 w-[250px]">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <Rocket size={14} className="text-cyan-500" />
                      </div>
                      <span className="text-sm font-bold text-foreground group-hover:text-cyan-500 transition-colors">
                        {campaign.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className="h-6 w-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                          <User size={12} className="text-violet-500" />
                       </div>
                       <span className="text-xs font-semibold text-muted-foreground">Prabhat Patra</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {format(new Date(campaign.startDate), "MMM d, yyyy")}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", stageBadge[campaign.stage])}>
                      {campaign.stage}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 w-32">
                      <Progress value={campaign.leadsTotal > 0 ? (campaign.leadsProcessed / campaign.leadsTotal) * 100 : 0} className="h-1 flex-1" />
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                        {campaign.leadsTotal > 0 ? Math.floor((campaign.leadsProcessed / campaign.leadsTotal) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">

                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-cyan-500">
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Rocket size={32} className="text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground font-medium">No outreach campaigns found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
