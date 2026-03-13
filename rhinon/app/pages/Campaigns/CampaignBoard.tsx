"use client";

import { useState } from "react";
import { format } from "date-fns";
import { List, LayoutGrid, Rocket, Clock, Play, Pause, MoreVertical, X } from "lucide-react";
import { dummyCampaigns, dummyTemplates } from "@/app/lib/dummy-data";
import { Campaign, CampaignStage } from "@/app/lib/types";
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

interface CampaignDetailProps {
  campaign: Campaign;
  onClose: () => void;
}

export function CampaignDetail({ campaign, onClose }: CampaignDetailProps) {
  const template = dummyTemplates.find(t => t.id === campaign.templateId);
  const progress = (campaign.leadsProcessed / campaign.leadsTotal) * 100;

  return (
    <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col animate-in slide-in-from-bottom-8 duration-300">
      <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Rocket size={20} className="text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-200">{campaign.name}</h2>
              <Badge variant="outline" className={
                campaign.stage === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                campaign.stage === "Paused" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                campaign.stage === "Completed" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                "bg-slate-800 text-slate-300"
              }>{campaign.stage}</Badge>
            </div>
            <p className="text-xs text-slate-500">Started {format(new Date(campaign.startDate), "MMM d, yyyy")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {campaign.stage === "Active" ? (
            <Button variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
              <Pause size={16} className="mr-2" /> Pause Campaign
            </Button>
          ) : campaign.stage === "Paused" || campaign.stage === "Draft" ? (
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-medium">
              <Play size={16} className="mr-2" /> Resume Campaign
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Top Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="card p-5">
            <p className="text-sm font-medium text-slate-400">Leads Processed</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-200">{campaign.leadsProcessed}</span>
              <span className="text-sm text-slate-500">/ {campaign.leadsTotal}</span>
            </div>
            <Progress value={progress} className="h-1.5 mt-4 bg-slate-800 [&>div]:bg-cyan-500" />
          </div>
          <div className="card p-5">
            <p className="text-sm font-medium text-slate-400">Daily Limit</p>
            <div className="mt-2 text-3xl font-bold text-slate-200">{campaign.dailyLimit}</div>
            <p className="text-xs text-slate-500 mt-2">Emails/Day</p>
          </div>
          <div className="card p-5">
            <p className="text-sm font-medium text-slate-400">Est. Completion</p>
            <div className="mt-2 text-xl font-bold text-slate-200">
              {Math.ceil((campaign.leadsTotal - campaign.leadsProcessed) / campaign.dailyLimit)} Days
            </div>
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><Clock size={12}/> on track</p>
          </div>
          <div className="card p-5">
            <p className="text-sm font-medium text-slate-400">Attached Template</p>
            <div className="mt-2 text-sm font-medium text-slate-200 truncate">{template?.name || "None"}</div>
            <Badge variant="outline" className="mt-2 bg-slate-900 border-slate-700">{campaign.channel}</Badge>
          </div>
        </div>

        {/* Funnel */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-6">Campaign Funnel</h3>
          <div className="flex h-32 gap-2 mt-4">
            <div className="flex-1 flex flex-col justify-end group">
              <div className="text-sm text-slate-400 mb-2 font-medium">Enrolled ({campaign.leadsTotal})</div>
              <div className="bg-slate-800 rounded-t-lg h-full transition-all group-hover:bg-slate-700" />
            </div>
            <div className="flex-1 flex flex-col justify-end group">
              <div className="text-sm text-slate-400 mb-2 font-medium">Emailed ({campaign.leadsProcessed})</div>
              <div className="bg-cyan-900/40 border border-cyan-800 border-b-0 rounded-t-lg h-[60%] transition-all group-hover:bg-cyan-900/60" />
            </div>
            <div className="flex-1 flex flex-col justify-end group">
              <div className="text-sm text-slate-400 mb-2 font-medium">Opened (142)</div>
              <div className="bg-indigo-900/40 border border-indigo-800 border-b-0 rounded-t-lg h-[40%] transition-all group-hover:bg-indigo-900/60" />
            </div>
            <div className="flex-1 flex flex-col justify-end group">
              <div className="text-sm text-slate-400 mb-2 font-medium">Replied (38)</div>
              <div className="bg-emerald-900/40 border border-emerald-800 border-b-0 rounded-t-lg h-[15%] transition-all group-hover:bg-emerald-900/60" />
            </div>
            <div className="flex-1 flex flex-col justify-end group">
              <div className="text-sm text-slate-400 mb-2 font-medium">Bounced (4)</div>
              <div className="bg-rose-900/20 border border-rose-800/50 border-b-0 rounded-t-lg h-[2%] transition-all group-hover:bg-rose-900/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CampaignBoard() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const stages: CampaignStage[] = ["Draft", "Active", "Paused", "Completed"];

  if (selectedCampaign) {
    return <CampaignDetail campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />;
  }

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
