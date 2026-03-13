import { CampaignBoard } from "@/views/Campaigns/CampaignBoard";
import { Rocket } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaign Orchestration | Rhinon CMS",
};

export default function CampaignsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative min-h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Rocket size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Campaign Orchestration</h1>
            <p className="text-sm text-slate-400">Launch and monitor outbound playbooks</p>
          </div>
        </div>
      </div>

      <CampaignBoard />
    </div>
  );
}
