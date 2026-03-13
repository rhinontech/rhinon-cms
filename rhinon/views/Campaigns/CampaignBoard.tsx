"use client";

import { useState } from "react";
import { format } from "date-fns";
import { List, LayoutGrid, Rocket, Clock, Play, Pause, MoreVertical, X, FileText, Settings, Sparkles, Target } from "lucide-react";
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

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface CampaignDetailProps {
  campaign: Campaign;
  onClose: () => void;
}

export function CampaignDetail({ campaign, onClose }: CampaignDetailProps) {
  const template = dummyTemplates.find(t => t.id === campaign.templateId);
  const progress = (campaign.leadsProcessed / campaign.leadsTotal) * 100;

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="!w-[50vw] !max-w-[50vw] sm:!max-w-[50vw] bg-slate-950 border-slate-800 p-0 flex flex-col shadow-2xl">
        <SheetHeader className="p-8 border-b border-slate-800/50 bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-glow-sm">
                <Rocket size={24} className="text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <SheetTitle className="text-xl font-bold text-slate-100 tracking-tight">{campaign.name}</SheetTitle>
                  <Badge variant="outline" className={cn(
                    "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    campaign.stage === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      campaign.stage === "Paused" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        campaign.stage === "Completed" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-slate-800 text-slate-300"
                  )}>{campaign.stage}</Badge>
                </div>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <Clock size={12} /> Launched on {format(new Date(campaign.startDate), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {campaign.stage === "Active" ? (
                <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 h-9 font-semibold">
                  <Pause size={14} className="mr-2" /> Pause Campaign
                </Button>
              ) : (campaign.stage === "Paused" || campaign.stage === "Draft") ? (
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 h-9 font-bold shadow-glow-sm">
                  <Play size={14} className="mr-2" /> Resume Now
                </Button>
              ) : null}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6 bg-slate-900/20 border-slate-800/40">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Propagation Progress</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-100">{campaign.leadsProcessed.toLocaleString()}</span>
                <span className="text-sm font-medium text-slate-500">/ {campaign.leadsTotal.toLocaleString()} leads</span>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                  <span>Completion Rate</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-slate-800/50 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-blue-500" />
              </div>
            </div>

            <div className="grid grid-rows-2 gap-4">
              <div className="card p-5 bg-slate-900/20 border-slate-800/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Daily Bandwidth</p>
                  <p className="text-2xl font-bold text-slate-200 mt-1">{campaign.dailyLimit} <span className="text-xs text-slate-500 font-medium">hits/day</span></p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Settings size={20} />
                </div>
              </div>
              <div className="card p-5 bg-slate-900/20 border-slate-800/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Target ETA</p>
                  <p className="text-2xl font-bold text-slate-200 mt-1">
                    {Math.ceil((campaign.leadsTotal - campaign.leadsProcessed) / campaign.dailyLimit)} <span className="text-xs text-slate-500 font-medium">days left</span>
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Sparkles size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Funnel Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Target size={14} className="text-cyan-500" /> Conversional Funnel
            </h3>
            <div className="card p-8 bg-slate-900/10 border-slate-800/30">
              <div className="flex h-56 gap-6">
                {[
                  { label: "Enrolled", val: campaign.leadsTotal, color: "bg-slate-800", text: "text-slate-400", h: "100%" },
                  { label: "Delivered", val: campaign.leadsProcessed, color: "bg-cyan-500/20 border-cyan-500/30", text: "text-cyan-400", h: `${(campaign.leadsProcessed / campaign.leadsTotal) * 100}%` },
                  { label: "Intercepted", val: 142, color: "bg-violet-500/20 border-violet-500/30", text: "text-violet-400", h: "45%" },
                  { label: "Engaged", val: 38, color: "bg-emerald-500/20 border-emerald-500/30", text: "text-emerald-400", h: "18%" },
                ].map((col) => (
                  <div key={col.label} className="flex-1 flex flex-col justify-end group">
                    <div className="mb-3 text-center">
                      <div className={cn("text-xl font-black mb-0.5", col.text)}>{col.val}</div>
                      <div className="text-[9px] uppercase tracking-widest font-bold text-slate-500">{col.label}</div>
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

          {/* Activity Timeline */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileText size={14} className="text-violet-500" /> Operational Log
              </h3>
              <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300">View All Logs</Button>
            </div>
            <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
              {[1, 2, 3].map(i => (
                <div key={i} className="relative pl-10 group">
                  <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full bg-slate-900 border-2 border-slate-700 ring-4 ring-slate-950 z-10 group-hover:border-cyan-500 transition-colors" />
                  <div className="card p-4 bg-slate-900/40 border-slate-800/40 hover:border-slate-700/60 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm text-slate-200 font-semibold italic">Lead <span className="text-cyan-400">#RX-{i * 152 + 800}</span> sync complete</p>
                      <span className="text-[10px] font-bold text-slate-500 tabular-nums">{i} hr ago</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Automatic outreach sequence initiated via {campaign.channel.toLowerCase()}. AI personalized draft verified.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Footer Meta */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
              {campaign.channel.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Template</p>
              <p className="text-xs font-semibold text-slate-300">{template?.name || "Global Outreach Standard"}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-slate-950 border-slate-800 text-[10px] font-mono text-slate-500">UUID: {campaign.id}</Badge>
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
        className="card p-4 cursor-pointer hover:border-cyan-500/50 hover:shadow-glow transition-all group"
      >
        <div className="flex justify-between items-start mb-3">
          <Badge variant="outline" className={`
            ${campaign.stage === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : ""}
            ${campaign.stage === "Paused" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : ""}
            ${campaign.stage === "Draft" ? "bg-slate-800 text-slate-300 border-slate-700" : ""}
            ${campaign.stage === "Completed" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : ""}
          `}>{campaign.channel}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-300">
              <DropdownMenuItem onClick={() => setSelectedCampaign(campaign)}>View Analytics</DropdownMenuItem>
              {campaign.stage === "Active" && <DropdownMenuItem>Pause Campaign</DropdownMenuItem>}
              {campaign.stage === "Paused" && <DropdownMenuItem>Resume Campaign</DropdownMenuItem>}
              <DropdownMenuItem className="text-rose-400">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-semibold text-slate-200 text-base mb-4 truncate">{campaign.name}</h3>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>{campaign.leadsProcessed.toLocaleString()} processed</span>
            <span>{campaign.leadsTotal.toLocaleString()} total</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-cyan-400" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {selectedCampaign && (
        <CampaignDetail campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("kanban")}
            className={`px-3 py-1.5 rounded-lg ${viewMode === "kanban" ? "bg-slate-800 text-cyan-400" : "text-slate-400 hover:text-slate-200"}`}
          >
            <LayoutGrid size={16} className="mr-2" /> Board
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-lg ${viewMode === "list" ? "bg-slate-800 text-cyan-400" : "text-slate-400 hover:text-slate-200"}`}
          >
            <List size={16} className="mr-2" /> List
          </Button>
        </div>

        <CampaignWizard />
      </div>

      {viewMode === "kanban" ? (
        <div className="grid grid-cols-4 gap-6 items-start">
          {stages.map(stage => (
            <div key={stage} className="bg-slate-900/30 rounded-2xl border border-slate-800/60 p-4 min-h-[500px]">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-semibold text-slate-300 text-sm flex items-center gap-2">
                  {stage}
                  <Badge variant="outline" className="bg-slate-800 text-slate-400 px-1.5 py-0 text-[10px]">
                    {dummyCampaigns.filter(c => c.stage === stage).length}
                  </Badge>
                </h3>
              </div>
              <div className="space-y-4">
                {dummyCampaigns.filter(c => c.stage === stage).map(campaign => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dummyCampaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
