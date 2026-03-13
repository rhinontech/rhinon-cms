import { TeamTabs } from "@/views/Team/TeamTabs";
import { UsersRound } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Management | Rhinon CMS",
};

export default function TeamPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative min-h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
            <UsersRound size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Team & Permissions</h1>
            <p className="text-sm text-slate-400">Manage user access and RBAC policies</p>
          </div>
        </div>
      </div>

      <TeamTabs />
    </div>
  );
}
