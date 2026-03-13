"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  List, LayoutGrid, Rocket, Clock, Play, Pause,
  MoreVertical, FileText, Settings, Sparkles, Target,
} from "lucide-react";
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
  const template = templates.find((t) => (t as any)._id === campaign.templateId || t.id === campaign.templateId);
  const progress = (campaign.leadsProcessed / campaign.leadsTotal) * 100;

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
        className="!w-[50vw] !max-w-[50vw] sm:!max-w-[50vw] bg-card border-border p-0 flex flex-col shadow-xl"
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
                  { label: "O", val: "88%", text: "text-cyan-500", color: "bg-cyan-500/10 border-cyan-500/20", h: "60px" },
                  { label: "C", val: "12%", text: "text-emerald-500", color: "bg-emerald-500/10 border-emerald-500/20", h: "40px" },
                  { label: "R", val: "4.2%", text: "text-violet-500", color: "bg-violet-500/10 border-violet-500/20", h: "25px" }
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
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative pl-10 group">
                  <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-card border-2 border-border ring-4 ring-background z-10 group-hover:border-cyan-500 transition-colors" />
                  <div className="card p-4 hover:border-muted transition-colors">
                    <p className="text-sm font-semibold text-foreground">
                      Lead <span className="text-cyan-600 dark:text-cyan-400">#{i * 152 + 800}</span> sync complete
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Outreach sequence via {campaign.channel.toLowerCase()}. AI draft verified.
                    </p>
                  </div>
                </div>
              ))}
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

export function CampaignBoard(): JSX.Element {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
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
      setCampaigns(campaignsData);
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

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
    const progress = (campaign.leadsProcessed / campaign.leadsTotal) * 100;
    return (
      <div
        onClick={() => setSelectedCampaign(campaign)}
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
              <DropdownMenuItem>View Analytics</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
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

      {/* Page Header */}
      <header className="flex items-center gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-glow-sm">
          <Rocket size={28} className="text-cyan-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and monitor your outbound sequences.</p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-secondary border border-border p-1 rounded-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("kanban")}
            className={cn("px-3 py-1.5 rounded-lg h-8 text-sm font-medium transition-colors", viewMode === "kanban" ? "bg-card text-cyan-600 dark:text-cyan-400 shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}
          >
            <LayoutGrid size={15} className="mr-1.5" /> Board
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
        <CampaignWizard />
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-4 gap-5 items-start">
          {stages.map((stage) => (
            <div key={stage} className="rounded-2xl border border-border bg-secondary/40 p-4 min-h-[480px]">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  {stage}
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px] bg-secondary text-muted-foreground border-border">
                    {campaigns.filter((c) => c.stage === stage).length}
                  </Badge>
                </h3>
              </div>
              <div className="space-y-3">
                {campaigns.filter((c) => c.stage === stage).map((campaign) => (
                  <CampaignCard key={(campaign as any)._id || campaign.id} campaign={campaign} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={(campaign as any)._id || campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
