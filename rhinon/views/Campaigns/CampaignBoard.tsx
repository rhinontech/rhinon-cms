"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  List, LayoutGrid, Rocket, Clock, Play, Pause,
  MoreVertical, FileText, Settings, Sparkles, Target,
} from "lucide-react";
import { dummyCampaigns, dummyTemplates } from "@/lib/dummy-data";
import { Campaign, CampaignStage } from "@/lib/types";
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

// ── Stage badge styles (semantic palette — no hardcoded slate) ─────────────
const stageBadge: Record<string, string> = {
  Active:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  Paused:    "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/25",
  Completed: "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/25",
  Draft:     "bg-secondary     text-muted-foreground              border-border",
};

interface CampaignDetailProps {
  campaign: Campaign;
  onClose: () => void;
}

export function CampaignDetail({ campaign, onClose }: CampaignDetailProps) {
  const template = dummyTemplates.find((t) => t.id === campaign.templateId);
  const progress = (campaign.leadsProcessed / campaign.leadsTotal) * 100;

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="!w-[50vw] !max-w-[50vw] sm:!max-w-[50vw] bg-card border-border p-0 flex flex-col shadow-xl"
      >
        {/* Header */}
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
                <Button variant="outline" size="sm" className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 h-9 font-semibold">
                  <Pause size={14} className="mr-2" /> Pause
                </Button>
              ) : (campaign.stage === "Paused" || campaign.stage === "Draft") ? (
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 font-bold">
                  <Play size={14} className="mr-2" /> Resume
                </Button>
              ) : null}
            </div>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Stats grid */}
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
              <div className="mt-6 space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Completion Rate</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-blue-500" />
              </div>
            </div>

            <div className="grid grid-rows-2 gap-4">
              <div className="card p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Daily Bandwidth</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {campaign.dailyLimit} <span className="text-xs font-medium text-muted-foreground">hits/day</span>
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
                  <Settings size={18} />
                </div>
              </div>
              <div className="card p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target ETA</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {Math.ceil((campaign.leadsTotal - campaign.leadsProcessed) / campaign.dailyLimit)}{" "}
                    <span className="text-xs font-medium text-muted-foreground">days left</span>
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Sparkles size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Funnel */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Target size={14} className="text-cyan-500" /> Conversion Funnel
            </h3>
            <div className="card p-8">
              <div className="flex h-52 gap-6">
                {[
                  { label: "Enrolled",    val: campaign.leadsTotal,       color: "bg-secondary border-border",                    text: "text-foreground",  h: "100%" },
                  { label: "Delivered",   val: campaign.leadsProcessed,   color: "bg-cyan-500/15 border-cyan-500/30",              text: "text-cyan-600 dark:text-cyan-400",   h: `${(campaign.leadsProcessed / campaign.leadsTotal) * 100}%` },
                  { label: "Intercepted", val: 142,                       color: "bg-violet-500/15 border-violet-500/30",          text: "text-violet-600 dark:text-violet-400", h: "45%" },
                  { label: "Engaged",     val: 38,                        color: "bg-emerald-500/15 border-emerald-500/30",        text: "text-emerald-600 dark:text-emerald-400", h: "18%" },
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

          {/* Activity log */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText size={14} className="text-violet-500" /> Operational Log
              </h3>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                View All
              </Button>
            </div>
            <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative pl-10 group">
                  <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-card border-2 border-border ring-4 ring-background z-10 group-hover:border-cyan-500 transition-colors" />
                  <div className="card p-4 hover:border-muted transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-semibold text-foreground">
                        Lead <span className="text-cyan-600 dark:text-cyan-400">#{i * 152 + 800}</span> sync complete
                      </p>
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{i} hr ago</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Outreach sequence via {campaign.channel.toLowerCase()}. AI draft verified.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
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
          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
            {campaign.id}
          </Badge>
        </div>
      </SheetContent>
    </Sheet>
  );
}


export function CampaignBoard() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const stages: CampaignStage[] = ["Draft", "Active", "Paused", "Completed"];

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
    const progress = (campaign.leadsProcessed / campaign.leadsTotal) * 100;
    return (
      <div
        onClick={() => setSelectedCampaign(campaign)}
        className="card p-4 cursor-pointer hover:border-cyan-500/40 hover:shadow-glow transition-all group"
      >
        <div className="flex justify-between items-start mb-3">
          <Badge
            variant="outline"
            className={cn("text-[10px] font-semibold uppercase tracking-wide", stageBadge[campaign.stage])}
          >
            {campaign.channel}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
              <DropdownMenuItem onClick={() => setSelectedCampaign(campaign)}>View Analytics</DropdownMenuItem>
              {campaign.stage === "Active" && <DropdownMenuItem>Pause Campaign</DropdownMenuItem>}
              {campaign.stage === "Paused" && <DropdownMenuItem>Resume Campaign</DropdownMenuItem>}
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-semibold text-foreground text-sm mb-4 truncate">{campaign.name}</h3>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>{campaign.leadsProcessed.toLocaleString()} processed</span>
            <span>{campaign.leadsTotal.toLocaleString()} total</span>
          </div>
          <Progress
            value={progress}
            className="h-1.5 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-cyan-400"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {selectedCampaign && (
        <CampaignDetail campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-secondary border border-border p-1 rounded-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("kanban")}
            className={cn(
              "px-3 py-1.5 rounded-lg h-8 text-sm font-medium transition-colors",
              viewMode === "kanban"
                ? "bg-card text-cyan-600 dark:text-cyan-400 shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid size={15} className="mr-1.5" /> Board
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("list")}
            className={cn(
              "px-3 py-1.5 rounded-lg h-8 text-sm font-medium transition-colors",
              viewMode === "list"
                ? "bg-card text-cyan-600 dark:text-cyan-400 shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List size={15} className="mr-1.5" /> List
          </Button>
        </div>
        <CampaignWizard />
      </div>

      {/* Views */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-4 gap-5 items-start">
          {stages.map((stage) => (
            <div key={stage} className="rounded-2xl border border-border bg-secondary/40 p-4 min-h-[480px]">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  {stage}
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px] bg-secondary text-muted-foreground border-border">
                    {dummyCampaigns.filter((c) => c.stage === stage).length}
                  </Badge>
                </h3>
              </div>
              <div className="space-y-3">
                {dummyCampaigns.filter((c) => c.stage === stage).map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dummyCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
